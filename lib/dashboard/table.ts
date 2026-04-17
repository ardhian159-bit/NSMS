// =============================================================================
// NSMS — Table Sort & Pagination
// Source: legacy dashboard.html sortTable / renderTable
// Pure functions
// =============================================================================

import type { Lead, SortState } from '../types'

/**
 * Sort leads array by a given column.
 * Source: dashboard.html sortTable (line 900-918)
 */
export function sortLeads(data: Lead[], sort: SortState): Lead[] {
  const sorted = [...data]
  const col = sort.column as keyof Lead

  sorted.sort((a, b) => {
    const valA = a[col]
    const valB = b[col]

    if (valA == null && valB == null) return 0
    if (valA == null) return 1
    if (valB == null) return -1

    if (typeof valA === 'string' && typeof valB === 'string') {
      const cmp = valA.toLowerCase().localeCompare(valB.toLowerCase())
      return sort.ascending ? cmp : -cmp
    }

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sort.ascending ? valA - valB : valB - valA
    }

    return 0
  })

  return sorted
}

/**
 * Paginate a data array.
 * Returns the current page slice plus metadata.
 */
export function paginateLeads(
  data: Lead[],
  page: number,
  perPage: number
): {
  rows: Lead[]
  page: number
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
} {
  const totalItems = data.length
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * perPage
  const endIndex = Math.min(startIndex + perPage, totalItems)
  const rows = data.slice(startIndex, endIndex)

  return {
    rows,
    page: safePage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  }
}
