// =============================================================================
// NSMS Bulk Import — validator: raw rows → ProcessedRow[] (per-cell status)
// =============================================================================

import { REGION_DATA } from '@/lib/region-data'
import { makeMatcher, PRINCIPAL_ALIAS } from './fuzzy'
import {
  normalizeQuarter, normalizeTk, parseNumber, normalizeKabKota, normalizePPN, normStr,
} from './normalizer'
import { detectFileDuplicates, detectDbDuplicates } from './dedupe'
import type { ProcessedRow, CellResult, RowStatus, ReferenceData } from './types'

const KET_PENGGARAP_MAP: Record<string, string> = {
  sales: 'SP', mp: 'MP', am: 'MP', dirut: 'MP', rekanan: 'REKANAN',
}

// Region: semua kab/kota + reverse map ke provinsi
const ALL_KABKOTA: string[] = []
const KABKOTA_TO_PROV: Record<string, string> = {}
for (const [prov, list] of Object.entries(REGION_DATA)) {
  list.forEach((kk) => {
    if (kk.startsWith('Provinsi ')) return
    ALL_KABKOTA.push(kk)
    KABKOTA_TO_PROV[normStr(kk)] = prov
  })
}

export function provinsiOf(kabKota: string): string {
  return KABKOTA_TO_PROV[normStr(kabKota)] ?? ''
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
  const picMatcher = makeMatcher(ref.pics.map((p) => p.picName), 0.35)
  const principalMatcher = makeMatcher(ref.principals, 0.3)
  const sumberMatcher = makeMatcher(ref.sumberDana, 0.3)
  const kabKotaMatcher = makeMatcher(ALL_KABKOTA, 0.3)
  const picByName = new Map(ref.pics.map((p) => [normStr(p.picName), p]))

  const rows: ProcessedRow[] = raw.map((r, i) => {
    const cells: Record<string, CellResult> = {}

    cells['Nama Paket'] = reqText(r['Nama Paket'])
    cells['Instansi'] = reqText(r['Instansi'])
    cells['Wilayah'] = reqText(r['Wilayah'])

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
    cells['Perkiraan CB (%)'] = numCell(r['Perkiraan CB (%)'], false)

    // Kab/Kota (normalize + fuzzy)
    {
      const norm = normalizeKabKota(r['Kab/Kota'] ?? '')
      const m = kabKotaMatcher(norm)
      cells['Kab/Kota'] = { raw: r['Kab/Kota'] ?? '', value: m.value, status: m.status, candidates: m.candidates, message: m.status === 'error' ? 'Tidak match region' : undefined }
    }
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

    // PIC (fuzzy → owner_id + ket_penggarap)
    let ownerId: string | null = null
    let ketPenggarap: string | null = null
    {
      const m = picMatcher(r['PIC'] ?? '')
      cells['PIC'] = { raw: r['PIC'] ?? '', value: m.value, status: m.status, candidates: m.candidates, message: m.status === 'error' ? 'PIC tidak ditemukan' : undefined }
      if (m.value) {
        const pic = picByName.get(normStr(m.value))
        if (pic) {
          ownerId = pic.id
          ketPenggarap = KET_PENGGARAP_MAP[pic.role] ?? null
        }
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
