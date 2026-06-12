'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts'
import type { PrincipalChartItem } from '@/lib/dashboard/charts'
import { formatMilyar } from '@/lib/dashboard/formatters'

interface ChartPrincipalProps {
  data: PrincipalChartItem[]
  metricMode: 'netto' | 'bruto'
}

export default function ChartPrincipal({ data, metricMode }: ChartPrincipalProps) {
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
    value: metricMode === 'netto' ? d.netto : d.bruto,
    displayLabel: `${d.count} Paket — ${formatMilyar(metricMode === 'netto' ? d.netto : d.bruto)}`,
  }))

  return (
    <div className="bg-surface rounded-lg border border-line p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-ink">Principal</h3>
        <p className="text-xs text-ink-hint mt-0.5">{metricMode === 'netto' ? 'Forecast Netto' : 'Bruto'}</p>
      </div>
      <div>
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)} minWidth={0}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              left: isMobile ? 0 : 100,
              right: isMobile ? 80 : 120,
            }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: isMobile ? 10 : 11, fill: 'var(--ink-muted)' }}
              width={isMobile ? 36 : 90}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={18}>
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