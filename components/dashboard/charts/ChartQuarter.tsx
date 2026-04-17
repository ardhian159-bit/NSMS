'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, LabelList } from 'recharts'
import type { QuarterChartItem } from '@/lib/dashboard/charts'
import { formatMilyar } from '@/lib/dashboard/formatters'

interface ChartQuarterProps {
  data: QuarterChartItem[]
}

export default function ChartQuarter({ data }: ChartQuarterProps) {
  if (data.length === 0) return null

  return (
    <div className="bg-white rounded-lg border border-[#EBEBE7] p-4">
      <h3 className="text-sm font-semibold text-[#1A1A18] mb-4">Distribusi Quarter</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
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
            <Legend
              wrapperStyle={{ fontSize: 11, color: '#6B6B65' }}
            />
            <Bar dataKey="brutto" name="Brutto" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24}>
              <LabelList
                dataKey="brutto"
                position="top"
                formatter={(v) => formatMilyar(Number(v))}
                style={{ fontSize: 9, fill: '#6B6B65' }}
              />
            </Bar>
            <Bar dataKey="netto" name="Netto" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24}>
              <LabelList
                dataKey="netto"
                position="top"
                formatter={(v) => formatMilyar(Number(v))}
                style={{ fontSize: 9, fill: '#6B6B65' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
