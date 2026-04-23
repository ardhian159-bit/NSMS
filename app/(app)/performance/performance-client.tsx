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

interface PerformanceClientProps {
  initialLeads: { owner_name: string; forecast_netto: number; quarter: string; tk: number }[]
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']



export default function PerformanceClient({ initialLeads }: PerformanceClientProps) {
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

  // Initial selection (up to 4)
  const initialSelection = useMemo(() => {
    return picAgg.slice(0, 4).map(p => p.name)
  }, [picAgg])

  const [selectedPics, setSelectedPics] = useState<string[]>(initialSelection)

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
        <h1 className="text-xl font-semibold text-[#1A1A18]">Performance</h1>
        <p className="text-sm text-[#A0A09A] mt-0.5">Closing per quarter per PIC</p>
      </div>

      <div className="bg-white rounded-lg border border-[#EBEBE7] p-5">
        <h2 className="text-sm font-semibold text-[#1A1A18] mb-3">Pilih PIC (Maks. 4)</h2>
        <div className="flex flex-wrap gap-2">
          {picAgg.map((p) => {
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
                    ? 'bg-[#1A1A18] text-white border-[#1A1A18]'
                    : isDisabled
                      ? 'bg-neutral-50 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-60'
                      : 'bg-white text-[#6B6B65] border-[#EBEBE7] hover:border-[#1A1A18] hover:text-[#1A1A18]'}
                `}
              >
                {p.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#EBEBE7] p-5">
        <div className="h-[380px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBE7" />
              <XAxis
                dataKey="quarter"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B6B65', fontFamily: 'var(--font-dm-sans)' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => formatRupiahShort(val)}
                tick={{ fontSize: 12, fill: '#6B6B65', fontFamily: 'var(--font-dm-mono)' }}
              />
              <Tooltip
                cursor={{ fill: '#F5F5F2' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-[#EBEBE7] shadow-sm rounded-lg p-3 space-y-1">
                        <p className="text-xs font-semibold text-[#1A1A18] mb-1">{label}</p>
                        {payload.map((p, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
                            <span className="text-xs text-[#6B6B65]">{String(p.dataKey)}</span>
                            <span className="text-xs font-medium text-[#1A1A18] font-mono">
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
                <span className="text-[#A0A09A] text-[10px] font-[family-name:var(--font-dm-mono)]">
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
