'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts'
import type { FunnelChartItem } from '@/lib/dashboard/charts'
import { formatMilyar } from '@/lib/dashboard/formatters'

const COLORS: Record<number, string> = {
  100: '#16a34a',
  75:  '#dc2626',
  50:  '#ea580c',
  25:  '#2563eb',
  10:  '#9333ea',
  5:   '#737373',
  0:   '#a3a3a3',
}

interface ChartFunnelProps {
  data: FunnelChartItem[]
  metricMode: 'netto' | 'bruto'
}

export default function ChartFunnel({ data, metricMode }: ChartFunnelProps) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  if (data.length === 0) return null

  const chartData = data.map((d) => ({
    ...d,
    displayLabel: `${d.count} Paket (${formatMilyar(metricMode === 'netto' ? d.netto : d.bruto)})`,
    value: metricMode === 'netto' ? d.netto : d.bruto,
  }))

  return (
    <div className="bg-surface rounded-lg border border-line p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-ink">Sales Funnel</h3>
        <p className="text-xs text-ink-hint mt-0.5">Nilai dalam {metricMode === 'netto' ? 'Forecast Netto' : 'Bruto'}</p>
      </div>
      <div>
        <ResponsiveContainer width="100%" height={280} minWidth={0}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: isMobile ? 60 : 80 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--ink-muted)' }}
              width={isMobile ? 80 : 130}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.tk] ?? '#a3a3a3'} />
              ))}
              <LabelList
                dataKey="displayLabel"
                position="right"
                style={{ fontSize: isMobile ? 9 : 10, fill: 'var(--ink-muted)' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
