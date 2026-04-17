// =============================================================================
// NSMS — Chart Data Builders
// Source: legacy dashboard.html renderCharts (line 1049-1356)
// Pure functions — prepare data for Recharts, no Recharts dependency
// =============================================================================

import type { Lead } from '../types'
import { TK_STATUS_MAP } from '../constants'

// --- Types for chart data ---

export interface FunnelChartItem {
  label: string
  tk: number
  count: number
  netto: number
}

export interface QuarterChartItem {
  quarter: string
  brutto: number
  netto: number
}

export interface PicChartItem {
  name: string
  netto: number
  count: number
}

export interface SumberDanaChartItem {
  name: string
  brutto: number
  percent: number
}

export interface PrincipalChartItem {
  name: string
  count: number
  netto: number
}

// --- Builder Functions ---

/**
 * Build funnel/stage chart data: count + netto per TK stage.
 * Source: dashboard.html line 1052-1055
 */
export function buildFunnelChartData(data: Lead[]): FunnelChartItem[] {
  const stages = [100, 75, 50, 25, 10, 5, 0]
  return stages.map((tk) => {
    const items = data.filter((d) => d.tk === tk)
    return {
      label: `${tk}% ${TK_STATUS_MAP[tk] ?? ''}`,
      tk,
      count: items.length,
      netto: items.reduce((sum, d) => sum + d.forecastNetto, 0),
    }
  })
}

/**
 * Build quarter chart data: brutto vs netto per quarter.
 * Source: dashboard.html line 1111-1116
 */
export function buildQuarterChartData(data: Lead[]): QuarterChartItem[] {
  return ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
    const items = data.filter((d) => d.quarter === q)
    return {
      quarter: q,
      brutto: items.reduce((sum, d) => sum + d.nilaiAnggaran, 0),
      netto: items.reduce((sum, d) => sum + d.forecastNetto, 0),
    }
  })
}

/**
 * Build top PIC chart data sorted by netto.
 * Source: dashboard.html line 1160-1166
 */
export function buildPicChartData(data: Lead[], limit: number = 10): PicChartItem[] {
  const picMap: Record<string, { netto: number; count: number }> = {}

  data.forEach((d) => {
    const pic = d.ownerName || 'Uncategorized'
    if (!picMap[pic]) picMap[pic] = { netto: 0, count: 0 }
    picMap[pic].netto += d.forecastNetto
    picMap[pic].count += 1
  })

  return Object.entries(picMap)
    .map(([name, { netto, count }]) => ({ name, netto, count }))
    .sort((a, b) => b.netto - a.netto)
    .slice(0, limit)
}

/**
 * Build sumber dana breakdown (for pie/doughnut chart).
 * Source: dashboard.html line 1202-1209
 */
export function buildSumberDanaChartData(data: Lead[]): SumberDanaChartItem[] {
  const sdMap: Record<string, number> = {}

  data.forEach((d) => {
    const sd = d.sumberDana.toUpperCase()
    if (sd && sd !== '-') {
      sdMap[sd] = (sdMap[sd] || 0) + d.nilaiAnggaran
    }
  })

  const sorted = Object.entries(sdMap)
    .map(([name, brutto]) => ({ name, brutto }))
    .sort((a, b) => b.brutto - a.brutto)

  const total = sorted.reduce((sum, x) => sum + x.brutto, 0)

  return sorted.map((x) => ({
    ...x,
    percent: total > 0 ? parseFloat(((x.brutto / total) * 100).toFixed(1)) : 0,
  }))
}

/**
 * Build principal chart data with count + netto per principal.
 * Source: dashboard.html line 1290-1301
 */
export function buildPrincipalChartData(data: Lead[]): PrincipalChartItem[] {
  const map: Record<string, { count: number; netto: number }> = {}

  data.forEach((d) => {
    const p = (d.principal || 'Uncategorized').toUpperCase()
    if (!map[p]) map[p] = { count: 0, netto: 0 }
    map[p].count += 1
    map[p].netto += d.forecastNetto
  })

  return Object.entries(map)
    .map(([name, { count, netto }]) => ({ name, count, netto }))
    .sort((a, b) => b.netto - a.netto)
}
