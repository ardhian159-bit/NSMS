// =============================================================================
// NSMS Bulk Import — fuzzy matching (Fuse.js)
// =============================================================================

import Fuse from 'fuse.js'
import { normStr } from './normalizer'

export interface FuzzyResult {
  /** nilai resolved kalau exact/confident, else '' */
  value: string
  status: 'ok' | 'suggestion' | 'error'
  candidates: string[]
}

// Alias principal (uppercase input → kode resmi). Selaras normalisasi DB.
const PRINCIPAL_ALIAS: Record<string, string> = {
  'INTAN PARIWARA EDUKASI': 'IPE',
  'PPL': 'IPE',
  'INTAN PARIWARA VITARANA': 'IPV',
  'PT MACANAN JAYA CEMERLANG': 'MJC',
  'PT SAKA MITRA KOMPETENSI': 'SMK',
  'PT SENTRA KRIYA EDUKASI': 'SKE',
  'PT APSARA TIYASA SAMBADA': 'ATS',
}

export function makeMatcher(options: string[], threshold: number) {
  const fuse = new Fuse(options, { includeScore: true, threshold, ignoreLocation: true })
  const exactMap = new Map(options.map((o) => [normStr(o), o]))

  return function match(raw: string, alias?: Record<string, string>): FuzzyResult {
    const q = (raw ?? '').toString().trim()
    if (!q) return { value: '', status: 'error', candidates: [] }

    // alias dulu
    if (alias) {
      const a = alias[q.toUpperCase()]
      if (a) return { value: a, status: 'ok', candidates: [] }
    }

    // exact (case-insensitive)
    const exact = exactMap.get(normStr(q))
    if (exact) return { value: exact, status: 'ok', candidates: [] }

    // fuzzy
    const res = fuse.search(q).slice(0, 3)
    if (res.length === 0) return { value: '', status: 'error', candidates: [] }

    const top = res[0]
    const candidates = res.map((r) => r.item)
    // skor sangat kecil → auto-resolve, else suggestion
    if ((top.score ?? 1) <= threshold * 0.4) {
      return { value: top.item, status: 'ok', candidates }
    }
    return { value: top.item, status: 'suggestion', candidates }
  }
}

export { PRINCIPAL_ALIAS }
