'use client'

import type { Lead } from '@/lib/types'
import { formatRupiahShort } from '@/lib/dashboard/formatters'
import { getISOWeekInfo } from '@/lib/dashboard/week'

interface CompanyTarget {
  quarter: string
  target_bruto: number
  target_netto: number
}

interface TargetGaugeProps {
  leads: Lead[]
  targets: CompanyTarget[]
  metricMode: 'netto' | 'bruto'
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const

function getCurrentQuarter(): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const { week } = getISOWeekInfo()
  if (week <= 13) return 'Q1'
  if (week <= 26) return 'Q2'
  if (week <= 39) return 'Q3'
  return 'Q4'
}

export default function TargetGauge({ leads, targets, metricMode }: TargetGaugeProps) {
  const currentQ = getCurrentQuarter()

  // Closing per quarter dari leads (tk === 100)
  const closingByQ: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }
  leads.forEach(l => {
    if (l.tk === 100 && l.quarter && closingByQ[l.quarter] !== undefined) {
      closingByQ[l.quarter] += metricMode === 'netto'
        ? (l.forecastNetto || 0)
        : (l.nilaiAnggaran || 0)
    }
  })

  const totalTarget = targets.reduce((sum, t) =>
    sum + (metricMode === 'netto' ? t.target_netto : t.target_bruto), 0)

  const ytdClosing = Object.values(closingByQ).reduce((sum, v) => sum + v, 0)
  const ytdPct = totalTarget > 0 ? (ytdClosing / totalTarget) * 100 : 0

  // Weeks remaining — dari week saat ini sampai W52
  const { week: currentWeek } = getISOWeekInfo()
  const weeksRemaining = Math.max(1, 52 - currentWeek)
  const weeklyNeeded = (totalTarget - ytdClosing) / weeksRemaining

  // Radial gauge
  const R = 90
  const C = 2 * Math.PI * R
  const dash = Math.min(ytdPct / 100, 1) * C
  const gaugeColor =
    ytdPct >= 70 ? '#16a34a' :
    ytdPct >= 30 ? '#d97706' :
    '#dc2626'

  return (
    <div className="bg-surface rounded-[14px] border border-line p-6
                    flex flex-col md:grid md:grid-cols-[208px_1fr] gap-6 items-center">

      {/* KIRI — Radial Gauge */}
      <div className="relative w-[208px] h-[208px] flex-shrink-0 mx-auto md:mx-0">
        <svg width="208" height="208" viewBox="0 0 208 208">
          {/* Track */}
          <circle cx="104" cy="104" r={R}
            fill="none" stroke="var(--line)" strokeWidth="14" />
          {/* Progress arc */}
          <circle cx="104" cy="104" r={R}
            fill="none" stroke={gaugeColor} strokeWidth="14"
            strokeDasharray={`${dash} ${C}`}
            strokeLinecap="round"
            transform="rotate(-90 104 104)" />
          {/* Tick marks di 25%, 50%, 75% */}
          {[25, 50, 75].map(p => {
            const a = (p / 100) * 2 * Math.PI - Math.PI / 2
            const x1 = 104 + (R - 12) * Math.cos(a)
            const y1 = 104 + (R - 12) * Math.sin(a)
            const x2 = 104 + (R - 2) * Math.cos(a)
            const y2 = 104 + (R - 2) * Math.sin(a)
            return <line key={p} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="var(--line)" strokeWidth="1.5" />
          })}
        </svg>
        {/* Center text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[36px] font-bold tracking-[-0.02em] leading-none"
            style={{ color: gaugeColor }}>
            {ytdPct.toFixed(1)}%
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-hint mt-1">
            YTD vs Target
          </span>
        </div>
      </div>

      {/* KANAN — Insight + Quarter chips */}
      <div className="flex-1 min-w-0 w-full">
        {/* Eyebrow */}
        <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand">
          Target {metricMode === 'netto' ? 'Netto' : 'Bruto'} 2026
        </p>

        {/* Big number */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-[32px] font-bold tracking-[-0.015em] text-ink leading-tight">
            {formatRupiahShort(ytdClosing)}
          </span>
          <span className="text-ink-hint font-medium text-sm">
            / {formatRupiahShort(totalTarget)}
          </span>
        </div>

        {/* Insight sentence */}
        <p className="text-[13px] text-ink-muted mt-1.5 leading-normal">
          Untuk mencapai target tahun ini, dibutuhkan rata-rata{' '}
          <strong className="text-ink">
            {formatRupiahShort(weeklyNeeded)} / minggu
          </strong>{' '}
          netto sampai akhir Q4.
        </p>

        {/* 4 Quarter chips */}
        <div className="flex gap-1.5 mt-3.5">
          {QUARTERS.map(q => {
            const target = targets.find(t => t.quarter === q)
            const targetVal = target
              ? (metricMode === 'netto' ? target.target_netto : target.target_bruto)
              : 0
            const closing = closingByQ[q] || 0
            const pct = targetVal > 0 ? (closing / targetVal) * 100 : 0
            const isActive = q === currentQ
            const barWidth = Math.max(pct > 0 ? 6 : 0, pct * 4)

            return (
              <div key={q}
                className="flex-1 px-3 py-2.5 rounded-[10px] border"
                style={{
                  background: isActive ? 'var(--surface)' : 'var(--surface-alt)',
                  border: isActive ? '1px solid #1A1A18' : '1px solid #EBEBE7',
                }}
              >
                {/* Chip header */}
                <div className="flex justify-between items-baseline mb-1">
                  <span className="flex items-center gap-1"
                    style={{
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: 10,
                      fontWeight: 600,
                      color: isActive ? 'var(--ink)' : 'var(--ink-hint)',
                    }}>
                    {q}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] inline-block" />
                    )}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: pct > 0 ? '#dc2626' : 'var(--ink-hint)',
                  }}>
                    {pct.toFixed(1)}%
                  </span>
                </div>

                {/* Closing value */}
                <p className="text-[13px] font-semibold mb-0.5 text-ink">
                  {closing > 0 ? formatRupiahShort(closing) : '—'}
                </p>
                <p className="text-[10px] text-ink-hint mb-1.5">
                  dari {formatRupiahShort(targetVal)}
                </p>

                {/* Progress bar */}
                <div className="h-[3px] bg-page rounded-sm overflow-hidden">
                  <div style={{
                    height: '100%',
                    width: `${Math.min(barWidth, 100)}%`,
                    background: isActive ? '#16a34a' : '#064E3B',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
