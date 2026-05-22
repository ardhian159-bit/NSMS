'use client'

import type { Lead } from '@/lib/types'
import { formatRupiahShort } from '@/lib/dashboard/formatters'

interface CompanyTarget {
  quarter: string
  target_bruto: number
  target_netto: number
}

interface TargetProgressProps {
  leads: Lead[]
  targets: CompanyTarget[]
  metricMode: 'netto' | 'bruto'
  onToggle: () => void
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

function getCurrentQuarter(): string {
  const week = getISOWeek(new Date())
  if (week <= 13) return 'Q1'
  if (week <= 26) return 'Q2'
  if (week <= 39) return 'Q3'
  return 'Q4'
}

function getISOWeek(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
}

export default function TargetProgress({ leads, targets, metricMode, onToggle }: TargetProgressProps) {
  const currentQ = getCurrentQuarter()

  // Hitung closing per quarter dari leads (tk===100)
  const closingByQ: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }
  leads.forEach(l => {
    if (l.tk === 100 && l.quarter && closingByQ[l.quarter] !== undefined) {
      closingByQ[l.quarter] += metricMode === 'netto' ? (l.forecastNetto || 0) : (l.nilaiAnggaran || 0)
    }
  })

  const totalTarget = targets.reduce((sum, t) =>
    sum + (metricMode === 'netto' ? t.target_netto : t.target_bruto), 0)
  const totalClosing = Object.values(closingByQ).reduce((sum, v) => sum + v, 0)
  const totalPct = totalTarget > 0 ? Math.min(100, (totalClosing / totalTarget) * 100) : 0

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-[#A0A09A]">
          Target {metricMode === 'netto' ? 'Netto' : 'Bruto'} 2026
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6B6B65]">{formatRupiahShort(totalClosing)} / {formatRupiahShort(totalTarget)}</span>
          <span className={`text-xs font-semibold ${totalPct >= 70 ? 'text-emerald-600' : totalPct >= 30 ? 'text-amber-600' : 'text-red-500'}`}>
            {totalPct.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {QUARTERS.map(q => {
        const target = targets.find(t => t.quarter === q)
        const targetVal = target
          ? (metricMode === 'netto' ? target.target_netto : target.target_bruto)
          : 0
        const closing = closingByQ[q] || 0
        const pct = targetVal > 0 ? Math.min(100, (closing / targetVal) * 100) : 0
        const isActive = q === currentQ
        const isDone = QUARTERS.indexOf(q) < QUARTERS.indexOf(currentQ)

        const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 30 ? 'bg-amber-400' : 'bg-red-400'
        const pctColor = pct >= 70 ? 'text-emerald-600' : pct >= 30 ? 'text-amber-600' : isDone && pct < 30 ? 'text-red-500' : 'text-[#A0A09A]'

        return (
          <div
            key={q}
            className={`bg-white rounded-lg border p-4 transition-shadow hover:shadow-sm ${
              isActive ? 'border-[#BBF7D0]' : 'border-[#EBEBE7]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-[#A0A09A] uppercase tracking-wider">
                  Target {q}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                )}
              </div>
              <span className={`text-xs font-semibold ${pctColor}`}>
                {pct.toFixed(1)}%
              </span>
            </div>

            {/* Closing value */}
            <p className="text-lg font-semibold text-[#1A1A18] mb-1">
              {formatRupiahShort(closing)}
            </p>
            <p className="text-[11px] text-[#A0A09A] mb-3">
              dari {formatRupiahShort(targetVal)}
            </p>

            {/* Progress bar */}
            <div className="h-1.5 bg-[#EBEBE7] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}
