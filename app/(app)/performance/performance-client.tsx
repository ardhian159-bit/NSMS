'use client'

import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { formatRupiahShort } from '@/lib/dashboard/formatters'
import type { Lead } from '@/lib/types'
import type { CompanyTarget } from '@/lib/api'

interface PerformanceClientProps {
  initialLeads: { owner_name: string; forecast_netto: number; quarter: string; tk: number; ket_penggarap: string | null }[]
  companyTargets: CompanyTarget[]
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']



export default function PerformanceClient({ initialLeads, companyTargets }: PerformanceClientProps) {
  // Daftar filter penggarap dinamis dari data ('' = semua)
  const penggarapFilters = useMemo(() => {
    const set = new Set<string>()
    initialLeads.forEach((l) => { if (l.ket_penggarap) set.add(l.ket_penggarap) })
    return ['', ...[...set].sort()]
  }, [initialLeads])

  // Map owner_name → ket_penggarap (untuk pre-filter chip list)
  const picKeteranganMap = useMemo(() => {
    const map: Record<string, string> = {}
    initialLeads.forEach(l => {
      const pic = l.owner_name || 'Unknown'
      if (l.ket_penggarap && !map[pic]) map[pic] = l.ket_penggarap
    })
    return map
  }, [initialLeads])

  // Aggregate data per PIC
  const picAgg = useMemo(() => {
    const map: Record<string, number> = {}
    initialLeads.forEach(l => {
      const pic = l.owner_name || 'Unknown'
      map[pic] = (map[pic] || 0) + (l.forecast_netto || 0)
    })

    return Object.entries(map)
      .map(([name, netto]) => ({ name, netto }))
      .sort((a, b) => b.netto - a.netto)
  }, [initialLeads])

  const [filterPenggarap, setFilterPenggarap] = useState<string>('')

  // Chip list PIC, pre-filtered by penggarap
  const filteredPicAgg = useMemo(() => {
    if (filterPenggarap === '') return picAgg
    return picAgg.filter(p => picKeteranganMap[p.name] === filterPenggarap)
  }, [picAgg, filterPenggarap, picKeteranganMap])

  // Initial selection (up to 4)
  const initialSelection = useMemo(() => {
    return picAgg.slice(0, 4).map(p => p.name)
  }, [picAgg])

  const [selectedPics, setSelectedPics] = useState<string[]>(initialSelection)
  const [metricMode, setMetricMode] = useState<'netto' | 'bruto'>('netto')

  // Ganti filter penggarap — prune PIC terpilih yang tidak ada di list baru
  const changePenggarap = (val: string) => {
    setFilterPenggarap(val)
    if (val === '') return
    const allowed = new Set(
      picAgg.filter(p => picKeteranganMap[p.name] === val).map(p => p.name)
    )
    setSelectedPics(prev => prev.filter(p => allowed.has(p)))
  }

  const togglePic = (pic: string) => {
    setSelectedPics(prev => {
      if (prev.includes(pic)) {
        return prev.filter(p => p !== pic)
      } else {
        if (prev.length >= 4) return prev // block adding more than 4
        return [...prev, pic]
      }
    })
  }

  // Build chart data maintaining the sort order of selected pics
  const chartData = useMemo(() => {
    return QUARTERS.map(q => {
      const entry: Record<string, any> = { quarter: q }
      selectedPics.forEach(pic => {
        const total = initialLeads
          .filter(l => l.quarter === q && l.owner_name === pic)
          .reduce((sum, l) => sum + (l.forecast_netto || 0), 0)
        entry[pic] = total
      })
      return entry
    })
  }, [initialLeads, selectedPics])

  const quarterTotals = useMemo(() => {
    return QUARTERS.map(q =>
      selectedPics.reduce((sum, pic) => sum + (chartData.find(d => d.quarter === q)?.[pic] || 0), 0)
    )
  }, [chartData, selectedPics])

  const closingPerQuarter = useMemo(() => {
    return QUARTERS.map(q => ({
      quarter: q,
      closing: initialLeads
        .filter(l => l.quarter === q)
        .reduce((sum, l) => sum + (l.forecast_netto || 0), 0),
    }))
  }, [initialLeads])

  const achievementData = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1
    const currentQ = Math.ceil(currentMonth / 3)
    const totalTarget = companyTargets.reduce((s, t) =>
      s + (metricMode === 'netto' ? t.targetNetto : t.targetBruto), 0)
    const totalClosing = closingPerQuarter.reduce((s, q) => s + q.closing, 0)
    const remainingQ = 4 - currentQ
    const forecastNextQ = remainingQ > 0
      ? (totalTarget - totalClosing) / remainingQ
      : 0

    return {
      quarters: (() => {
        let carryOverGap = 0
        return QUARTERS.map((q, i) => {
          const target = companyTargets.find(t => t.quarter === q)
          const targetVal = target
            ? (metricMode === 'netto' ? target.targetNetto : target.targetBruto)
            : 0
          const closing = closingPerQuarter.find(c => c.quarter === q)?.closing ?? 0
          const targetRealisasi = targetVal + carryOverGap
          const gap = targetVal - closing
          const ach = targetVal > 0 ? (closing / targetVal) * 100 : 0
          const isPast = i + 1 < currentQ
          const isCurrent = i + 1 === currentQ
          carryOverGap = Math.max(0, targetRealisasi - closing)
          return { quarter: q, targetVal, closing, gap, ach, isPast, isCurrent, targetRealisasi }
        })
      })(),
      totalTarget,
      totalClosing,
      totalAch: totalTarget > 0 ? (totalClosing / totalTarget) * 100 : 0,
      forecastNextQ,
      currentQ,
    }
  }, [companyTargets, closingPerQuarter, metricMode])

  const achColor = (pct: number) => {
    if (pct >= 70) return { bar: '#10B981', text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' }
    if (pct >= 30) return { bar: '#F59E0B', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' }
    return { bar: '#EF4444', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
  }

  function formatDiff(curr: number, next: number) {
    const diff = next - curr
    if (curr === 0 && next === 0) return null
    const pct = curr === 0 ? 100 : Math.round((diff / curr) * 100)
    const sign = diff >= 0 ? '+' : ''
    const nomStr = formatRupiahShort(Math.abs(diff)).replace('Rp', '').trim()
    const nom = `${diff < 0 ? '-' : '+'}${nomStr}`
    return `${nom} · ${sign}${pct}%`
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-ink">Performance</h1>
        <p className="text-sm text-ink-hint mt-0.5">Closing per quarter per PIC</p>
      </div>

      {/* Target vs Achievement */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">
            Target vs Achievement {new Date().getFullYear()}
          </h2>
          <div className="flex items-center gap-1 bg-page rounded-full p-0.5">
            {(['netto', 'bruto'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetricMode(m)}
                className={`text-xs px-3 py-1 rounded-full transition-all duration-200 font-medium ${
                  metricMode === m
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {m === 'netto' ? 'Netto' : 'Bruto'}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Quarter Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {achievementData.quarters.map(({ quarter, targetVal, closing, gap, ach, isPast, isCurrent, targetRealisasi }) => {
            const color = achColor(ach)
            const clampedAch = Math.min(ach, 100)
            return (
              <div
                key={quarter}
                className={`bg-surface rounded-lg border p-4 space-y-3 transition-all ${
                  isCurrent
                    ? 'border-emerald-300 shadow-sm shadow-emerald-50'
                    : 'border-line'
                } ${!isPast && !isCurrent ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{quarter}</span>
                  {isCurrent && (
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  )}
                  {isPast && (
                    <span className="text-[10px] font-medium text-ink-hint bg-page border border-line px-2 py-0.5 rounded-full">
                      Selesai
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-end justify-between mb-1">
                    <span className={`text-2xl font-bold ${color.text}`}>
                      {ach.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-page rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${clampedAch}%`, backgroundColor: color.bar }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-ink-hint uppercase tracking-wider">Closing</span>
                    <span className="text-xs font-semibold text-ink font-[family-name:var(--font-dm-mono)]">
                      {closing > 0 ? formatRupiahShort(closing) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-ink-hint uppercase tracking-wider">Target</span>
                    <span className="text-xs text-ink-muted font-[family-name:var(--font-dm-mono)]">
                      {formatRupiahShort(targetVal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-ink-hint uppercase tracking-wider">Gap</span>
                    <span className="text-xs text-red-500 font-[family-name:var(--font-dm-mono)]">
                      {gap > 0 ? formatRupiahShort(gap) : '✓'}
                    </span>
                  </div>
                </div>
                <div className="pt-2 mt-1 border-t border-line flex justify-between items-center">
                  <span className="text-[10px] text-red-600 uppercase tracking-wider font-semibold">
                    Target Realisasi
                  </span>
                  <span className="text-xs font-semibold text-red-600 font-[family-name:var(--font-dm-mono)]">
                    {formatRupiahShort(targetRealisasi)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary Card */}
        <div className="bg-surface rounded-lg border border-line p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">Total Achievement</span>
                <span className={`text-sm font-bold ${achColor(achievementData.totalAch).text}`}>
                  {achievementData.totalAch.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 bg-page rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(achievementData.totalAch, 100)}%`,
                    backgroundColor: achColor(achievementData.totalAch).bar
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-ink-hint font-[family-name:var(--font-dm-mono)]">
                <span>Closing: {formatRupiahShort(achievementData.totalClosing)}</span>
                <span>Target: {formatRupiahShort(achievementData.totalTarget)}</span>
              </div>
            </div>
            {achievementData.forecastNextQ > 0 && (
              <div className="md:border-l md:border-line md:pl-4">
                <p className="text-[10px] text-ink-hint uppercase tracking-wider mb-1">
                  Beban per Q sisa
                </p>
                <p className="text-lg font-bold text-ink font-[family-name:var(--font-dm-mono)]">
                  {formatRupiahShort(achievementData.forecastNextQ)}
                </p>
                <p className="text-[10px] text-ink-hint">
                  dibagi {4 - achievementData.currentQ} quarter tersisa
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-line p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Pilih PIC (Maks. 4)</h2>
          <div className="flex items-center gap-1 bg-page rounded-full p-0.5">
            {penggarapFilters.map((f) => (
              <button
                key={f || 'all'}
                onClick={() => changePenggarap(f)}
                className={`text-xs px-3 py-1 rounded-full transition-all duration-200 font-medium ${
                  filterPenggarap === f
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {f === '' ? 'Semua' : f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {filteredPicAgg.length === 0 && (
            <p className="text-xs text-ink-hint py-1">Tidak ada PIC untuk penggarap ini</p>
          )}
          {filteredPicAgg.map((p) => {
            const isSelected = selectedPics.includes(p.name)
            const isDisabled = !isSelected && selectedPics.length >= 4
            return (
              <button
                key={p.name}
                onClick={() => togglePic(p.name)}
                disabled={isDisabled}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
                  ${isSelected
                    ? 'bg-accent-solid text-accent-on border-accent-solid'
                    : isDisabled
                      ? 'bg-neutral-50 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-60'
                      : 'bg-surface text-ink-muted border-line hover:border-accent-solid hover:text-ink'}
                `}
              >
                {p.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-line p-5">
        <div className="h-[380px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
              <XAxis
                dataKey="quarter"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--ink-muted)', fontFamily: 'var(--font-dm-sans)' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => formatRupiahShort(val)}
                tick={{ fontSize: 12, fill: 'var(--ink-muted)', fontFamily: 'var(--font-dm-mono)' }}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-alt)' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-surface border border-line shadow-sm rounded-lg p-3 space-y-1">
                        <p className="text-xs font-semibold text-ink mb-1">{label}</p>
                        {payload.map((p, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
                            <span className="text-xs text-ink-muted">{String(p.dataKey)}</span>
                            <span className="text-xs font-medium text-ink font-mono">
                              {formatRupiahShort(p.value as number)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
              />
              {selectedPics.map((pic, i) => (
                <Bar
                  key={pic}
                  dataKey={pic}
                  fill={COLORS[i % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {quarterTotals.slice(0, -1).map((curr, i) => {
            const next = quarterTotals[i + 1]
            const label = formatDiff(curr, next)
            if (!label) return <div key={i} className="flex-1" />
            const isPositive = next >= curr
            return (
              <div key={i} className="flex-1 flex items-center justify-center gap-1">
                <span className="text-ink-hint text-[10px] font-[family-name:var(--font-dm-mono)]">
                  Q{i + 1}→Q{i + 2}
                </span>
                <span className={`text-[10px] font-medium font-[family-name:var(--font-dm-mono)] px-2 py-0.5 rounded-full border ${
                  isPositive
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-600 border-red-200'
                }`}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
