'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts'
import type { PicChartItem } from '@/lib/dashboard/charts'
import { formatMilyar } from '@/lib/dashboard/formatters'

interface ChartTopPicProps {
  data: PicChartItem[]
}

type Mode = 'top' | 'boost'

export default function ChartTopPic({ data }: ChartTopPicProps) {
  const [mode, setMode] = useState<Mode>('top')

  if (data.length === 0) return null

  // data comes in sorted descending (highest first)
  // Top 10: take first 10
  // Perlu Boost: take last 10, sort ascending so lowest is leftmost
  const chartData =
    mode === 'top'
      ? data.slice(0, 10)
      : [...data].slice(-10).reverse()

  const barColor = mode === 'top' ? '#3b82f6' : '#f59e0b'

  return (
    <div className="bg-white rounded-lg border border-[#EBEBE7] p-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1A1A18]">
            {mode === 'top' ? 'Top 10 PIC' : 'Perlu Boost'}
          </h3>
          <p className="text-xs text-[#A0A09A] mt-0.5">Forecast Netto</p>
        </div>
        <div className="flex items-center gap-1 bg-[#F5F5F2] rounded-full p-0.5">
          <button
            onClick={() => setMode('top')}
            className={`text-xs px-3 py-1 rounded-full transition-all duration-200 ${
              mode === 'top'
                ? 'bg-white text-[#1A1A18] font-semibold shadow-sm'
                : 'text-[#6B6B65] hover:text-[#1A1A18]'
            }`}
          >
            Top 10
          </button>
          <button
            onClick={() => setMode('boost')}
            className={`text-xs px-3 py-1 rounded-full transition-all duration-200 ${
              mode === 'boost'
                ? 'bg-white text-[#1A1A18] font-semibold shadow-sm'
                : 'text-[#6B6B65] hover:text-[#1A1A18]'
            }`}
          >
            Perlu Boost
          </button>
        </div>
      </div>

      {/* Chart */}
      <div>
        <ResponsiveContainer width="100%" height={280} minWidth={0}>
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
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
            <Bar dataKey="netto" fill={barColor} radius={[4, 4, 0, 0]} barSize={28}>
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
