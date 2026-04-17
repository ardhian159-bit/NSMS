// =============================================================================
// NSMS — Filter Engine + KPI Compute
// Source: legacy dashboard.html applyFilters (line 835-896)
// Pure functions — no UI, no Supabase
// =============================================================================

import type { Lead, FilterState, KPIData } from '../types'

/**
 * Apply multi-filter to leads array.
 * Source: dashboard.html applyFilters
 */
export function applyFilters(data: Lead[], filters: FilterState): Lead[] {
  return data.filter((d) => {
    if (filters.quarter !== 'ALL' && d.quarter !== filters.quarter) return false
    if (filters.sumberDana !== 'ALL') {
      if (!d.sumberDana.toUpperCase().includes(filters.sumberDana.toUpperCase())) return false
    }
    if (filters.tk !== 'ALL' && d.tk.toString() !== filters.tk) return false
    if (filters.pic !== 'ALL' && d.ownerName !== filters.pic) return false
    if (filters.wilayah !== 'ALL' && d.wilayah !== filters.wilayah) return false
    if (filters.principal !== 'ALL' && d.principal !== filters.principal) return false

    if (filters.search) {
      const search = filters.search.toLowerCase()
      return (
        d.namaPaket.toLowerCase().includes(search) ||
        d.instansi.toLowerCase().includes(search) ||
        d.wilayah.toLowerCase().includes(search) ||
        d.ownerName.toLowerCase().includes(search) ||
        d.principal.toLowerCase().includes(search) ||
        d.funnelId.toLowerCase().includes(search)
      )
    }

    return true
  })
}

/**
 * Compute dashboard KPI values from filtered data.
 * Source: dashboard.html lines 866-888
 */
export function computeKPIs(data: Lead[]): KPIData {
  const totalBrutto = data.reduce((sum, d) => sum + d.nilaiAnggaran, 0)
  const totalNetto = data.reduce((sum, d) => sum + d.forecastNetto, 0)
  const totalPipeline = data.length

  const closingItems = data.filter((d) => d.tk === 100)
  const closingCount = closingItems.length
  const closingNetto = closingItems.reduce((sum, d) => sum + d.forecastNetto, 0)

  const gagalBrutto = data.filter((d) => d.tk === 0).reduce((sum, d) => sum + d.nilaiAnggaran, 0)
  const gagalPercent = totalBrutto > 0 ? parseFloat(((gagalBrutto / totalBrutto) * 100).toFixed(1)) : 0

  return {
    totalBrutto,
    totalNetto,
    totalPipeline,
    closingCount,
    closingNetto,
    gagalBrutto,
    gagalPercent,
  }
}

/**
 * Extract unique filter options from data for dropdown population.
 * Source: dashboard.html populateFilters
 */
export function getUniqueFilterOptions(data: Lead[]) {
  const pics = [...new Set(data.map((d) => d.ownerName).filter(Boolean))].sort()
  const wilayahs = [...new Set(data.map((d) => d.wilayah).filter(Boolean))].sort()
  const principals = [...new Set(data.map((d) => d.principal).filter(Boolean))].sort()
  const sumberDanas = [...new Set(data.map((d) => d.sumberDana).filter(Boolean))].sort()

  return { pics, wilayahs, principals, sumberDanas }
}

/**
 * Get wilayah options filtered by currently selected PIC.
 * Source: dashboard.html updateWilayahOptions
 */
export function getWilayahOptionsForPic(data: Lead[], pic: string): string[] {
  const filtered = pic === 'ALL' ? data : data.filter((d) => d.ownerName === pic)
  return [...new Set(filtered.map((d) => d.wilayah).filter(Boolean))].sort()
}

/**
 * Get top N leads by forecast netto where tk=100 (closing).
 * Source: dashboard.html renderTop5
 */
export function getTopClosingLeads(data: Lead[], limit: number = 5): Lead[] {
  return data
    .filter((d) => d.tk === 100)
    .sort((a, b) => b.forecastNetto - a.forecastNetto)
    .slice(0, limit)
}
