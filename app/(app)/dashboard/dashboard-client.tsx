'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Lead, TrackerEntry, FilterState, SortState, Profile } from '@/lib/types'
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
import { exportFilteredLeads } from '@/lib/dashboard/exporters'

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
import ChartJenisProduk from '@/components/dashboard/charts/ChartJenisProduk'
import TargetGauge from '@/components/dashboard/TargetGauge'

interface DashboardClientProps {
  leads: Lead[]
  trackers: TrackerEntry[]
  profile: Profile
  companyTargets: { quarter: string; target_bruto: number; target_netto: number }[]
}

export default function DashboardClient({ leads, trackers, profile, companyTargets }: DashboardClientProps) {
  // --- State ---
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTER_STATE })
  const [sort, setSort] = useState<SortState>({ column: 'forecastNetto', ascending: false })
  const [page, setPage] = useState(1)
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null)
  const [metricMode, setMetricMode] = useState<'netto' | 'bruto'>('netto')
  const [targetView, setTargetView] = useState<'global' | 'MP' | 'SP'>('global')
  const [isExporting, setIsExporting] = useState(false)

  // Lead untuk gauge target: global (semua) atau capaian divisi MP/SP (by penggarap)
  const targetLeads = useMemo(
    () => (targetView === 'global' ? leads : leads.filter((l) => l.ketPenggarap === targetView)),
    [leads, targetView]
  )

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

  const jenisProdukChartData = useMemo(() => {
    const map: Record<string, { netto: number; count: number }> = {}
    filteredData.forEach(l => {
      const jp = l.jenisProduk
      if (!jp) return
      if (!map[jp]) map[jp] = { netto: 0, count: 0 }
      map[jp].netto += l.forecastNetto || 0
      map[jp].count += 1
    })
    return Object.entries(map)
      .map(([name, val]) => ({ name, netto: val.netto, count: val.count }))
      .sort((a, b) => b.netto - a.netto)
  }, [filteredData])

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

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const activeFilters = Object.entries(filters)
        .filter(([_, v]) => (Array.isArray(v) ? v.length > 0 : v !== 'ALL' && v !== ''))
        .map(([_, v]) => (Array.isArray(v) ? v.join('+') : v))
        .join('-')
      await exportFilteredLeads(filteredData, activeFilters || undefined)
    } finally {
      setIsExporting(false)
    }
  }

  const handleSort = useCallback((column: string) => {
    setSort((prev) => ({
      column,
      ascending: prev.column === column ? !prev.ascending : true,
    }))
    setPage(1)
  }, [])

  return (
    <div className="p-6 md:p-7 flex flex-col gap-3.5">
      {/* Header */}
      {(() => {
        const { week, year, dateLabel } = getISOWeekInfo()
        return (
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
              <span className="text-xs font-[family-name:var(--font-dm-mono)] bg-brand-soft text-brand border border-brand-soft rounded-full px-2 py-0.5">W{week} · {year}</span>
            </div>
            <p className="text-[12.5px] text-ink-muted mt-0.5">
              Overview pipeline nasional 2026
            </p>
          </div>
        )
      })()}

      {/* Target Gauge — hero + toggle divisi */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 bg-surface-alt rounded-full p-0.5 w-fit border border-line">
          {([['global', 'Global'], ['MP', 'Divisi MP'], ['SP', 'Divisi SP']] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTargetView(k)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                targetView === k ? 'bg-accent-solid text-accent-on' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <TargetGauge
          leads={targetLeads}
          targets={companyTargets}
          metricMode={metricMode}
        />
      </div>

      {/* KPI Cards */}
      <KpiCards kpis={kpis} />

      {/* Bruto / Netto Toggle */}
      <div className="flex items-center gap-1 bg-page rounded-full p-0.5 w-fit">
        {(['netto', 'bruto'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMetricMode(m)}
            className={`text-xs px-4 py-1.5 rounded-full transition-all duration-200 font-medium ${
              metricMode === m
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {m === 'netto' ? 'Forecast Netto' : 'Bruto'}
          </button>
        ))}
      </div>

      {/* Top 10 Closing */}
      {topClosing.length > 0 && (
        <div className="bg-surface rounded-lg border border-line p-4">
          <h3 className="text-sm font-semibold text-ink mb-3">🏆 Top 10 Closing</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface z-10">
                <tr className="text-xs text-ink-hint uppercase border-b border-line">
                  <th className="text-left px-3 py-2 font-medium">#</th>
                  <th className="text-left px-3 py-2 font-medium">PIC</th>
                  <th className="text-left px-3 py-2 font-medium">Nama Paket</th>
                  <th className="text-left px-3 py-2 font-medium max-w-[120px]">Wilayah</th>
                  <th className="px-3 py-2 font-medium text-center w-16">Quarter</th>
                  <th className="text-right px-3 py-2 font-medium">
                    {metricMode === 'netto' ? 'Forecast Netto' : 'Bruto'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {topClosing.map((c, idx) => (
                  <tr key={c.funnelId} className="hover:bg-surface-alt">
                    <td className="px-3 py-2">
                      <span className="inline-flex w-5 h-5 bg-green-50 text-green-700 rounded-full items-center justify-center text-xs font-medium">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-ink font-medium">{c.ownerName}</td>
                    <td className="px-3 py-2 text-ink-muted max-w-[200px] truncate">{c.namaPaket}</td>
                    <td className="px-3 py-2 text-ink-muted max-w-[120px] truncate">{c.wilayah}</td>
                    <td className="px-3 py-2 text-center w-16">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-page text-ink-muted font-medium">
                        {c.quarter || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-green-700">
                      {formatRupiahShort(metricMode === 'netto' ? c.forecastNetto : c.nilaiAnggaran)}
                    </td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 10 - topClosing.length) }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="bg-neutral-50/40">
                    <td className="px-3 py-2">
                      <span className="inline-flex w-5 h-5 bg-neutral-100 text-neutral-400 rounded-full items-center justify-center text-xs font-medium">
                        {topClosing.length + idx + 1}
                      </span>
                    </td>
                    <td colSpan={5} className="px-3 py-2 text-ink-hint italic text-sm">
                      Menunggu Closing
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
        <ChartFunnel data={funnelChart} metricMode={metricMode} />
        <ChartQuarter
          data={quarterChart}
          targets={companyTargets}
          metricMode={metricMode}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {profile.role === 'sales'
          ? <ChartJenisProduk data={jenisProdukChartData} />
          : <ChartTopPic data={picChart} metricMode={metricMode} />
        }
        <ChartSumberDana data={sumberDanaChart} />
      </div>
      <ChartPrincipal data={principalChart} metricMode={metricMode} />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        options={filterOptions}
        onExport={
          profile.role === 'admin' || profile.role === 'superadmin'
            ? handleExport
            : undefined
        }
        isExporting={isExporting}
      />

      {/* Data Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">Pipeline Data</h3>
          <span className="text-xs text-ink-hint">{filteredData.length} paket</span>
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
        profile={profile}
      />
    </div>
  )
}
