'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, LabelList } from 'recharts'
import type { QuarterChartItem } from '@/lib/dashboard/charts'
import { formatMilyar } from '@/lib/dashboard/formatters'

interface CompanyTarget {
  quarter: string
  target_bruto: number
  target_netto: number
}

interface ChartQuarterProps {
  data: QuarterChartItem[]
  targets?: CompanyTarget[]
  metricMode?: 'netto' | 'bruto'
}

export default function ChartQuarter({ data, targets = [], metricMode = 'netto' }: ChartQuarterProps) {
  if (data.length === 0) return null

  // Merge target ke dalam data
  const enriched = data.map(item => {
    const t = targets.find(t => t.quarter === item.quarter)
    return {
      ...item,
      target: t
        ? (metricMode === 'netto' ? t.target_netto : t.target_bruto)
        : 0,
    }
  })

  const targetLabel = metricMode === 'netto' ? 'Target Netto' : 'Target Bruto'

  return (
    <div className="bg-white rounded-lg border border-[#EBEBE7] p-4">
      <h3 className="text-sm font-semibold text-[#1A1A18] mb-4">Distribusi Quarter</h3>
      <div>
        <ResponsiveContainer width="100%" height={280} minWidth={0}>
          <BarChart data={enriched} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
            <XAxis
              dataKey="quarter"
              tick={{ fontSize: 12, fill: '#6B6B65' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatMilyar(Number(v))}
              tick={{ fontSize: 10, fill: '#A0A09A' }}
              axisLine={false}
              tickLine={false}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#6B6B65' }} />
            <Bar dataKey="brutto" name="Brutto" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20}>
              <LabelList
                dataKey="brutto"
                position="top"
                formatter={((v: unknown) => formatMilyar(Number(v ?? 0))) as never}
                style={{ fontSize: 9, fill: '#6B6B65' }}
              />
            </Bar>
            <Bar dataKey="netto" name="Netto" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20}>
              <LabelList
                dataKey="netto"
                position="top"
                formatter={((v: unknown) => formatMilyar(Number(v ?? 0))) as never}
                style={{ fontSize: 9, fill: '#6B6B65' }}
              />
            </Bar>
            <Bar dataKey="target" name={targetLabel} fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20}>
              <LabelList
                dataKey="target"
                position="top"
                formatter={((v: unknown) => formatMilyar(Number(v ?? 0))) as never}
                style={{ fontSize: 9, fill: '#6B6B65' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
