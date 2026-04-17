// =============================================================================
// NSMS — Currency & Text Formatters
// Source: legacy dashboard.html formatRupiahShort / formatMilyar / truncateWords
// =============================================================================

/**
 * Format a number as shortened Rupiah: "Rp 5,00 M" or "Rp 437 Jt"
 * Source: dashboard.html line 714-725
 */
export function formatRupiahShort(value: number): string {
  if (value >= 1e12) return `Rp ${(value / 1e12).toFixed(2)} T`
  if (value >= 1e9)  return `Rp ${(value / 1e9).toFixed(2)} M`
  if (value >= 1e6)  return `Rp ${(value / 1e6).toFixed(0)} Jt`
  if (value >= 1e3)  return `Rp ${Math.round(value).toLocaleString('id-ID')}`
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`
}

/**
 * Format a number as full Rupiah: "Rp 186.677.623.435"
 */
export function formatRupiahLong(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`
}

/**
 * Format as shortened milyar without "Rp" prefix: "5,00 M"
 * Source: dashboard.html formatMilyar
 */
export function formatMilyar(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)} T`
  if (value >= 1e9)  return `${(value / 1e9).toFixed(2)} M`
  if (value >= 1e6)  return `${(value / 1e6).toFixed(1)} Jt`
  if (value === 0)   return '0'
  return Math.round(value).toLocaleString('id-ID')
}

/**
 * Format a number as dotted Indonesian number string: "186.677.623.435"
 * Used for form input display
 */
export function formatDotted(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Parse a dotted Indonesian number string back to number.
 * "186.677.623.435" → 186677623435
 * Source: legacy parseCurrency
 */
export function parseCurrency(str: string): number {
  if (!str) return 0
  const cleaned = str.replace(/\./g, '').replace(/,/g, '')
  return parseInt(cleaned, 10) || 0
}

/**
 * Truncate text to a max character length with "..."
 * Source: dashboard.html truncateWords
 */
export function truncateText(text: string, maxLen: number): string {
  if (!text) return ''
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen) + '…'
}

/**
 * Calculate DPP from brutto value.
 * DPP = PPN applied ? brutto / 1.11 : brutto
 */
export function calcDPP(nilaiAnggaran: number, ppn: string): number {
  return ppn === 'PPN' ? Math.round(nilaiAnggaran / 1.11) : nilaiAnggaran
}

/**
 * Calculate forecast netto.
 * Netto = DPP × (1 - CB/100)
 */
export function calcForecastNetto(
  nilaiAnggaran: number,
  ppn: string,
  perkiraanCb: number
): number {
  const dpp = calcDPP(nilaiAnggaran, ppn)
  return Math.round(dpp * (1 - perkiraanCb / 100))
}
