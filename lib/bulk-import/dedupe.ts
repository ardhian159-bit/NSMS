// =============================================================================
// NSMS Bulk Import — deteksi duplikat
// Kunci komposit: nama_paket | instansi | nilai_anggaran (BUKAN nama_paket saja)
// Layer 1 = antar-baris file. Layer 2 = cross-check ke DB. Semua SOFT (🟡).
// =============================================================================

import { normStr } from './normalizer'
import type { ProcessedRow, ReferenceData } from './types'

function dupKey(namaPaket: string, instansi: string, nilai: string | number): string {
  return `${normStr(namaPaket)}|${normStr(instansi)}|${String(nilai).replace(/[^0-9]/g, '')}`
}

function rowKey(row: ProcessedRow): string {
  return dupKey(
    row.cells['Nama Paket']?.value ?? '',
    row.cells['Instansi']?.value ?? '',
    row.cells['Nilai Anggaran']?.value ?? '',
  )
}

/** Layer 1 — duplikat antar-baris dalam file upload */
export function detectFileDuplicates(rows: ProcessedRow[]): void {
  const seen = new Map<string, number[]>() // key → list rowNum
  rows.forEach((r) => {
    const k = rowKey(r)
    if (!k.replace(/\|/g, '')) return
    const arr = seen.get(k) ?? []
    arr.push(r.rowNum)
    seen.set(k, arr)
  })
  rows.forEach((r) => {
    const k = rowKey(r)
    const arr = seen.get(k)
    if (arr && arr.length > 1) {
      const others = arr.filter((n) => n !== r.rowNum)
      r.dupWarning = `Kemungkinan duplikat dalam file (baris ${others.join(', ')})`
    }
  })
}

/** Layer 2 — cross-check ke leads existing di DB (index sekali di memori) */
export function detectDbDuplicates(rows: ProcessedRow[], existing: ReferenceData['existingLeads']): void {
  const index = new Map<string, { funnelId: string; instansi: string; nilai: number }>()
  existing.forEach((l) => {
    index.set(dupKey(l.namaPaket, l.instansi, l.nilaiAnggaran), {
      funnelId: l.funnelId, instansi: l.instansi, nilai: l.nilaiAnggaran,
    })
  })
  rows.forEach((r) => {
    if (r.dupWarning) return // sudah ada warning Layer 1
    const hit = index.get(rowKey(r))
    if (hit) {
      r.dupWarning = `Mirip lead existing: ${hit.funnelId} — ${hit.instansi}`
    }
  })
}
