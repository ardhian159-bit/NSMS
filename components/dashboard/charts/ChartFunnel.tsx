'use client'

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
}

export default function ChartFunnel({ data }: ChartFunnelProps) {
  if (data.length === 0) return null

  const chartData = data.map((d) => ({
    ...d,
    displayLabel: `${d.count} Paket (${formatMilyar(d.netto)})`,
  }))

  return (
    <div className="bg-white rounded-lg border border-[#EBEBE7] p-4">
      <h3 className="text-sm font-semibold text-[#1A1A18] mb-4">Sales Funnel</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 120, right: 100 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11, fill: '#6B6B65' }}
              width={110}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.tk] ?? '#a3a3a3'} />
              ))}
              <LabelList
                dataKey="displayLabel"
                position="right"
                style={{ fontSize: 10, fill: '#6B6B65' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
