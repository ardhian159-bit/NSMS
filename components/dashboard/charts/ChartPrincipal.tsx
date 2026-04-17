'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts'
import type { PrincipalChartItem } from '@/lib/dashboard/charts'
import { formatMilyar } from '@/lib/dashboard/formatters'

interface ChartPrincipalProps {
  data: PrincipalChartItem[]
}

export default function ChartPrincipal({ data }: ChartPrincipalProps) {
  if (data.length === 0) return null

  const chartData = data.map((d) => ({
    ...d,
    displayLabel: `${d.count} Paket — ${formatMilyar(d.netto)}`,
  }))

  return (
    <div className="bg-white rounded-lg border border-[#EBEBE7] p-4">
      <h3 className="text-sm font-semibold text-[#1A1A18] mb-4">Principal</h3>
      <div style={{ height: Math.max(200, data.length * 36) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 120 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#6B6B65' }}
              width={90}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="netto" fill="#10b981" radius={[0, 4, 4, 0]} barSize={18}>
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
