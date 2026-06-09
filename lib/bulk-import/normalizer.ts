// =============================================================================
// NSMS Bulk Import — normalisasi string (pure functions)
// =============================================================================

import { TK_VALUES } from '@/lib/constants'

export function normStr(s: string | undefined | null): string {
  return (s ?? '').toString().toLowerCase().trim().replace(/\s+/g, ' ')
}

/** "q1" / "Q-1" / "tw1" / "triwulan 1" / "kuartal 1" → "Q1" */
export function normalizeQuarter(s: string): string {
  const t = normStr(s)
  const m = t.match(/([1-4])/)
  if (!t) return ''
  if (/^q|tw|triwulan|kuartal|quarter/.test(t) && m) return `Q${m[1]}`
  if (/^[1-4]$/.test(t)) return `Q${t}`
  if (/^q[1-4]$/.test(t)) return t.toUpperCase()
  return ''
}

/** parse TK → salah satu dari TK_VALUES, atau null */
export function normalizeTk(s: string): number | null {
  const n = parseInt(normStr(s).replace(/[^0-9]/g, ''), 10)
  if (Number.isNaN(n)) return null
  return (TK_VALUES as readonly number[]).includes(n) ? n : null
}

/** "Rp 30.000.000" / "30,000,000" / "30jt" / "1.5 m" → number, atau null */
export function parseNumber(s: string): number | null {
  let t = normStr(s).replace(/rp/g, '').replace(/\s/g, '')
  if (!t) return null

  // suffix juta / miliar
  let mult = 1
  if (/(jt|juta|m)$/.test(t) && !/miliar|milyar/.test(t)) { mult = 1_000_000; t = t.replace(/(jt|juta|m)$/, '') }
  else if (/(miliar|milyar|b)$/.test(t)) { mult = 1_000_000_000; t = t.replace(/(miliar|milyar|b)$/, '') }

  // Hilangkan pemisah ribuan. Deteksi desimal: kalau ada koma & titik, yang terakhir = desimal.
  // Sederhana: buang titik & koma sbg ribuan; kalau pakai suffix, izinkan 1 desimal.
  if (mult > 1) {
    t = t.replace(/,/g, '.')
    const f = parseFloat(t)
    return Number.isNaN(f) ? null : Math.round(f * mult)
  }
  t = t.replace(/[.,]/g, '')
  const n = parseInt(t, 10)
  return Number.isNaN(n) ? null : n
}

/** "Kabupaten X" → "Kab. X"; "kota x" → "Kota X" (title preserved dari input) */
export function normalizeKabKota(s: string): string {
  let t = (s ?? '').toString().trim().replace(/\s+/g, ' ')
  t = t.replace(/^kabupaten\s+/i, 'Kab. ').replace(/^kab\.?\s+/i, 'Kab. ').replace(/^kota\s+/i, 'Kota ')
  return t
}

/** "ppn" → "PPN"; "non ppn"/"nonppn"/"non-ppn" → "Non PPN" */
export function normalizePPN(s: string): string {
  const t = normStr(s).replace(/[-_]/g, ' ')
  if (!t) return 'PPN'
  if (/non\s*ppn|tanpa ppn|bebas/.test(t)) return 'Non PPN'
  if (/ppn/.test(t)) return 'PPN'
  return ''
}
