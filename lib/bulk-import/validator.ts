// =============================================================================
// NSMS Bulk Import — validator: raw rows → ProcessedRow[] (per-cell status)
// =============================================================================

import Fuse from 'fuse.js'
import { REGION_DATA } from '@/lib/region-data'
import { makeMatcher, PRINCIPAL_ALIAS } from './fuzzy'
import {
  normalizeQuarter, normalizeTk, parseNumber, normalizeKabKota, normalizePPN, normStr,
} from './normalizer'
import { detectFileDuplicates, detectDbDuplicates } from './dedupe'
import type { ProcessedRow, CellResult, RowStatus, ReferenceData } from './types'

// Region: semua kab/kota + reverse map ke provinsi + exact map + bare-name index
const ALL_KABKOTA: string[] = []
const KABKOTA_TO_PROV: Record<string, string> = {}
const KABKOTA_EXACT = new Map<string, string>()
const KABKOTA_BARE: Record<string, string[]> = {}

/** buang prefix "Kab."/"Kabupaten"/"Kota" (+ "Administrasi") → nama telanjang */
function stripKabKotaPrefix(s: string): string {
  return s.replace(/^(kab\.?|kabupaten|kota)\s+(administrasi\s+)?/i, '')
}

for (const [prov, list] of Object.entries(REGION_DATA)) {
  list.forEach((kk) => {
    if (kk.startsWith('Provinsi ')) return
    ALL_KABKOTA.push(kk)
    KABKOTA_TO_PROV[normStr(kk)] = prov
    KABKOTA_EXACT.set(normStr(kk), kk)
    const bare = normStr(stripKabKotaPrefix(kk))
    ;(KABKOTA_BARE[bare] ??= []).push(kk)
  })
}

// Provinsi (untuk wilayah level-provinsi). Key normStr → nama provinsi bare.
const PROVINCE_EXACT = new Map<string, string>()
for (const prov of Object.keys(REGION_DATA)) {
  PROVINCE_EXACT.set(normStr(prov), prov)
}

export function provinsiOf(kabKota: string): string {
  return KABKOTA_TO_PROV[normStr(kabKota)] ?? ''
}

/**
 * Resolusi kab/kota: exact → bare-name (user tanpa prefix) → fuzzy typo.
 * "Pekanbaru" → "Kota Pekanbaru" (unik). "Magelang" → suggestion (Kota/Kab).
 */
function resolveKabKota(raw: string, fuzzy: ReturnType<typeof makeMatcher>): CellResult {
  const norm = normalizeKabKota(raw ?? '')
  if (!norm) return { raw: raw ?? '', value: '', status: 'error', message: 'Wajib diisi' }

  const exact = KABKOTA_EXACT.get(normStr(norm))
  if (exact) return { raw, value: exact, status: 'ok' }

  const bare = normStr(stripKabKotaPrefix(norm))
  const hits = KABKOTA_BARE[bare]
  if (hits && hits.length === 1) return { raw, value: hits[0], status: 'ok' }
  if (hits && hits.length > 1) {
    return { raw, value: hits[0], status: 'suggestion', candidates: hits, message: 'Pilih Kab. atau Kota' }
  }

  // fuzzy typo fallback
  const m = fuzzy(norm)
  return { raw, value: m.value, status: m.status, candidates: m.candidates, message: m.status === 'error' ? 'Tidak match region' : undefined }
}

/**
 * Resolusi wilayah: bisa level kab/kota ATAU provinsi (pengadaan skala provinsi).
 * Provinsi (mis. "Kalimantan Barat" / "Provinsi Kalbar") → nama provinsi bare.
 * Selain itu diperlakukan sama seperti kab/kota (normalisasi prefix/bare/fuzzy).
 */
function resolveWilayah(raw: string, fuzzy: ReturnType<typeof makeMatcher>): CellResult {
  const t = (raw ?? '').toString().trim()
  if (!t) return { raw: raw ?? '', value: '', status: 'error', message: 'Wajib diisi' }
  const prov = PROVINCE_EXACT.get(normStr(t).replace(/^provinsi\s+/, ''))
  if (prov) return { raw: t, value: prov, status: 'ok' }
  return resolveKabKota(t, fuzzy)
}

// --- helpers cell ---
function reqText(raw: string): CellResult {
  const v = (raw ?? '').toString().trim()
  return v ? { raw, value: v, status: 'ok' } : { raw, value: '', status: 'error', message: 'Wajib diisi' }
}

function numCell(raw: string, required: boolean): CellResult {
  const t = (raw ?? '').toString().trim()
  if (!t) return required
    ? { raw, value: '', status: 'error', message: 'Wajib diisi' }
    : { raw, value: '', status: 'ok' }
  const n = parseNumber(t)
  return n === null
    ? { raw, value: '', status: 'error', message: 'Bukan angka valid' }
    : { raw, value: String(n), status: 'ok' }
}

export function processRows(raw: Record<string, string>[], ref: ReferenceData): ProcessedRow[] {
  const principalMatcher = makeMatcher(ref.principals, 0.3)
  const sumberMatcher = makeMatcher(ref.sumberDana, 0.3, { prefixMatch: true })
  const kabKotaMatcher = makeMatcher(ALL_KABKOTA, 0.3)
  const picByName = new Map(ref.pics.map((p) => [normStr(p.picName), p]))
  const knownOwnerByName = new Map(ref.knownOwners.map((o) => [normStr(o.name), o]))
  // Pool fuzzy PIC: nama profile + nama owner yang sudah ada di DB
  const picPool = Array.from(new Set([...ref.pics.map((p) => p.picName), ...ref.knownOwners.map((o) => o.name)]))
  const picFuse = new Fuse(picPool, { includeScore: true, threshold: 0.4, ignoreLocation: true })

  const rows: ProcessedRow[] = raw.map((r, i) => {
    const cells: Record<string, CellResult> = {}

    cells['Nama Paket'] = reqText(r['Nama Paket'])
    cells['Instansi'] = reqText(r['Instansi'])
    cells['Wilayah'] = resolveWilayah(r['Wilayah'] ?? '', kabKotaMatcher)

    // Principal (alias + fuzzy)
    {
      const m = principalMatcher(r['Principal'] ?? '', PRINCIPAL_ALIAS)
      cells['Principal'] = { raw: r['Principal'] ?? '', value: m.value, status: m.status, candidates: m.candidates, message: m.status === 'error' ? 'Tidak match' : undefined }
    }
    // Sumber Dana
    {
      const m = sumberMatcher(r['Sumber Dana'] ?? '')
      cells['Sumber Dana'] = { raw: r['Sumber Dana'] ?? '', value: m.value, status: m.status, candidates: m.candidates, message: m.status === 'error' ? 'Tidak match' : undefined }
    }
    // Quarter
    {
      const q = normalizeQuarter(r['Quarter'] ?? '')
      cells['Quarter'] = q ? { raw: r['Quarter'] ?? '', value: q, status: 'ok' } : { raw: r['Quarter'] ?? '', value: '', status: 'error', message: 'Q1–Q4' }
    }
    // Stage (TK)
    {
      const tk = normalizeTk(r['Stage (TK)'] ?? '')
      cells['Stage (TK)'] = tk === null ? { raw: r['Stage (TK)'] ?? '', value: '', status: 'error', message: '0/5/10/25/50/75/100' } : { raw: r['Stage (TK)'] ?? '', value: String(tk), status: 'ok' }
    }
    // Nilai Anggaran (required) + Forecast Netto (optional)
    cells['Nilai Anggaran'] = numCell(r['Nilai Anggaran'], true)
    cells['Forecast Netto'] = numCell(r['Forecast Netto'], false)
    cells['Perkiraan CB (%)'] = numCell(r['Perkiraan CB (%)'], true)

    // Kab/Kota (normalize + bare-name index + fuzzy)
    cells['Kab/Kota'] = resolveKabKota(r['Kab/Kota'] ?? '', kabKotaMatcher)
    // PPN
    {
      const p = normalizePPN(r['PPN'] ?? '')
      cells['PPN'] = p ? { raw: r['PPN'] ?? '', value: p, status: 'ok' } : { raw: r['PPN'] ?? '', value: '', status: 'error', message: 'PPN / Non PPN' }
    }
    // Target Close (optional, format W{N}-YYYY)
    {
      const t = (r['Target Close'] ?? '').toString().trim()
      cells['Target Close'] = !t || /^W\d{1,2}-\d{4}$/i.test(t)
        ? { raw: t, value: t, status: 'ok' }
        : { raw: t, value: t, status: 'suggestion', message: 'Format W{N}-YYYY' }
    }

    // PIC — cascade: profiles (akun) → nama di DB → nama baru (rekanan)
    let ownerId: string | null = null
    let ketPenggarap: string | null = null
    {
      const rawPic = (r['PIC'] ?? '').toString().trim()
      const norm = normStr(rawPic)
      const prof = picByName.get(norm)
      const known = knownOwnerByName.get(norm)
      if (!rawPic) {
        cells['PIC'] = { raw: '', value: '', status: 'error', message: 'Wajib diisi' }
      } else if (prof) {
        // 1. Punya akun
        cells['PIC'] = { raw: rawPic, value: prof.picName, status: 'ok' }
        ownerId = prof.id
        ketPenggarap = prof.penggarap ?? null
      } else if (known) {
        // 2. Tanpa akun tapi sudah ada di DB → pakai ket_penggarap aslinya
        cells['PIC'] = { raw: rawPic, value: known.name, status: 'ok' }
        ownerId = known.ownerId
        ketPenggarap = known.ketPenggarap
      } else {
        // 3. Nama baru tak dikenal → suggestion. Default REKANAN, bisa dikoreksi.
        // Kandidat: nama asli (pakai apa adanya) lalu alternatif fuzzy.
        const fuzzy = picFuse.search(rawPic).slice(0, 3).map((x) => x.item).filter((n) => normStr(n) !== norm)
        cells['PIC'] = {
          raw: rawPic, value: rawPic, status: 'suggestion',
          candidates: [rawPic, ...fuzzy],
          message: 'PIC tak dikenal — pakai apa adanya (rekanan) atau pilih nama mirip',
        }
        ownerId = null
        ketPenggarap = 'REKANAN'
      }
    }

    const row: ProcessedRow = {
      id: `r${i}`,
      rowNum: i + 1,
      cells,
      status: 'valid',
      ownerId,
      ketPenggarap,
    }
    row.status = computeStatus(row)
    return row
  })

  // Dedupe
  detectFileDuplicates(rows)
  detectDbDuplicates(rows, ref.existingLeads)
  rows.forEach((r) => { r.status = computeStatus(r) })

  return rows
}

export function computeStatus(row: ProcessedRow): RowStatus {
  const cells = Object.values(row.cells)
  if (cells.some((c) => c.status === 'error')) return 'error'
  if (cells.some((c) => c.status === 'suggestion')) return 'suggestion'
  if (row.dupWarning && !row.forceInsert) return 'suggestion'
  return 'valid'
}
