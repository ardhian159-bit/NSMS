'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Lead, TrackerEntry, FilterState, SortState } from '@/lib/types'
import { DEFAULT_FILTER_STATE, DEFAULT_PER_PAGE } from '@/lib/constants'
import { applyFilters, computeKPIs, getUniqueFilterOptions } from '@/lib/dashboard/filters'
import { sortLeads, paginateLeads } from '@/lib/dashboard/table'
import {
  buildFunnelChartData,
  buildQuarterChartData,
  buildPicChartData,
  buildSumberDanaChartData,
  buildPrincipalChartData,
} from '@/lib/dashboard/charts'
import { getTrackerHistory } from '@/lib/dashboard/detail'
import { getTopClosingLeads } from '@/lib/dashboard/filters'
import { formatRupiahShort } from '@/lib/dashboard/formatters'
import { getISOWeekInfo } from '@/lib/dashboard/week'

import KpiCards from '@/components/dashboard/KpiCards'
import FilterBar from '@/components/dashboard/FilterBar'
import PipelineTable from '@/components/dashboard/PipelineTable'
import LeadDetailDrawer from '@/components/dashboard/LeadDetailDrawer'
import Badge from '@/components/dashboard/Badge'
import ChartFunnel from '@/components/dashboard/charts/ChartFunnel'
import ChartQuarter from '@/components/dashboard/charts/ChartQuarter'
import ChartTopPic from '@/components/dashboard/charts/ChartTopPic'
import ChartSumberDana from '@/components/dashboard/charts/ChartSumberDana'
import ChartPrincipal from '@/components/dashboard/charts/ChartPrincipal'

interface DashboardClientProps {
  leads: Lead[]
  trackers: TrackerEntry[]
}

export default function DashboardClient({ leads, trackers }: DashboardClientProps) {
  // --- State ---
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTER_STATE })
  const [sort, setSort] = useState<SortState>({ column: 'forecastNetto', ascending: false })
  const [page, setPage] = useState(1)
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null)

  // --- Derived data (pure functions) ---
  const filterOptions = useMemo(() => getUniqueFilterOptions(leads), [leads])

  const filteredData = useMemo(
    () => applyFilters(leads, filters),
    [leads, filters]
  )

  const kpis = useMemo(() => computeKPIs(filteredData), [filteredData])

  const sortedData = useMemo(
    () => sortLeads(filteredData, sort),
    [filteredData, sort]
  )

  const pagination = useMemo(
    () => paginateLeads(sortedData, page, DEFAULT_PER_PAGE),
    [sortedData, page]
  )

  const topClosing = useMemo(
    () => getTopClosingLeads(filteredData, 10),
    [filteredData]
  )

  // Charts
  const funnelChart = useMemo(() => buildFunnelChartData(filteredData), [filteredData])
  const quarterChart = useMemo(() => buildQuarterChartData(filteredData), [filteredData])
  const picChart = useMemo(() => buildPicChartData(filteredData), [filteredData])
  const sumberDanaChart = useMemo(() => buildSumberDanaChartData(filteredData), [filteredData])
  const principalChart = useMemo(() => buildPrincipalChartData(filteredData), [filteredData])

  // Detail drawer
  const selectedLead = useMemo(
    () => (selectedFunnelId ? leads.find((l) => l.funnelId === selectedFunnelId) ?? null : null),
    [leads, selectedFunnelId]
  )
  const selectedTrackerHistory = useMemo(
    () => (selectedFunnelId ? getTrackerHistory(trackers, selectedFunnelId) : []),
    [trackers, selectedFunnelId]
  )

  // --- Handlers ---
  const handleFilterChange = useCallback((f: FilterState) => {
    setFilters(f)
    setPage(1)
  }, [])

  const handleSort = useCallback((column: string) => {
    setSort((prev) => ({
      column,
      ascending: prev.column === column ? !prev.ascending : true,
    }))
    setPage(1)
  }, [])

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      {(() => {
        const { week, year, dateLabel } = getISOWeekInfo()
        return (
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-[#1A1A18]">Dashboard</h1>
              <span className="text-xs font-[family-name:var(--font-dm-mono)] bg-[#F0FDF4] text-[#065F46] border border-[#BBF7D0] rounded-full px-2 py-0.5">W{week} · {year}</span>
            </div>
            <p className="text-sm text-[#A0A09A] mt-0.5">Overview pipeline nasional</p>
            <p className="text-xs text-[#6B6B65] mt-0.5">{dateLabel}</p>
          </div>
        )
      })()}

      {/* KPI Cards */}
      <KpiCards kpis={kpis} />

      {/* Top 5 Closing */}
      {topClosing.length > 0 && (
        <div className="bg-white rounded-lg border border-[#EBEBE7] p-4">
          <h3 className="text-sm font-semibold text-[#1A1A18] mb-3">🏆 Top 10 Closing</h3>
          <div className="overflow-x-auto overflow-y-auto max-h-[260px] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#EBEBE7] [&::-webkit-scrollbar-thumb]:rounded-full">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-xs text-[#A0A09A] uppercase border-b border-[#EBEBE7]">
                  <th className="text-left px-3 py-2 font-medium">#</th>
                  <th className="text-left px-3 py-2 font-medium">PIC</th>
                  <th className="text-left px-3 py-2 font-medium">Nama Paket</th>
                  <th className="text-left px-3 py-2 font-medium">Wilayah</th>
                  <th className="text-right px-3 py-2 font-medium">Forecast Netto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBE7]">
                {topClosing.map((c, idx) => (
                  <tr key={c.funnelId} className="hover:bg-[#FAFAF8]">
                    <td className="px-3 py-2">
                      <span className="inline-flex w-5 h-5 bg-green-50 text-green-700 rounded-full items-center justify-center text-xs font-medium">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[#1A1A18] font-medium">{c.ownerName}</td>
                    <td className="px-3 py-2 text-[#6B6B65] max-w-[200px] truncate">{c.namaPaket}</td>
                    <td className="px-3 py-2 text-[#6B6B65]">{c.wilayah}</td>
                    <td className="px-3 py-2 text-right font-semibold text-green-700">
                      {formatRupiahShort(c.forecastNetto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartFunnel data={funnelChart} />
        <ChartQuarter data={quarterChart} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartTopPic data={picChart} />
        <ChartSumberDana data={sumberDanaChart} />
      </div>
      <ChartPrincipal data={principalChart} />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        options={filterOptions}
      />

      {/* Data Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#1A1A18]">Pipeline Data</h3>
          <span className="text-xs text-[#A0A09A]">{filteredData.length} paket</span>
        </div>
        <PipelineTable
          rows={pagination.rows}
          sort={sort}
          onSort={handleSort}
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          onPageChange={setPage}
          onRowClick={setSelectedFunnelId}
        />
      </div>

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        trackerHistory={selectedTrackerHistory}
        open={!!selectedFunnelId}
        onClose={() => setSelectedFunnelId(null)}
      />
    </div>
  )
}
