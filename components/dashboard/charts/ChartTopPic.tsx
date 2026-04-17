'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts'
import type { PicChartItem } from '@/lib/dashboard/charts'
import { formatMilyar } from '@/lib/dashboard/formatters'

interface ChartTopPicProps {
  data: PicChartItem[]
}

export default function ChartTopPic({ data }: ChartTopPicProps) {
  if (data.length === 0) return null

  return (
    <div className="bg-white rounded-lg border border-[#EBEBE7] p-4">
      <h3 className="text-sm font-semibold text-[#1A1A18] mb-4">Top 10 PIC</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: '#6B6B65' }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tickFormatter={(v) => formatMilyar(Number(v))}
              tick={{ fontSize: 10, fill: '#A0A09A' }}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="netto" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28}>
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
