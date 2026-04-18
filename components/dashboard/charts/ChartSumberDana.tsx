'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { SumberDanaChartItem } from '@/lib/dashboard/charts'
import { formatRupiahShort } from '@/lib/dashboard/formatters'

const PIE_COLORS = ['#ef4444', '#8b5cf6', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981', '#6366f1', '#ec4899']

interface ChartSumberDanaProps {
  data: SumberDanaChartItem[]
}

export default function ChartSumberDana({ data }: ChartSumberDanaProps) {
  if (data.length === 0) return null

  const total = data.reduce((sum, d) => sum + d.brutto, 0)

  return (
    <div className="bg-white rounded-lg border border-[#EBEBE7] p-4">
      <h3 className="text-sm font-semibold text-[#1A1A18] mb-4">Sumber Dana</h3>
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Chart */}
        <div className="w-[200px] relative flex-shrink-0">
          <ResponsiveContainer width="100%" height={200} minWidth={0}>
            <PieChart>
              <Pie
                data={data}
                dataKey="brutto"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((_entry, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-[#A0A09A]">Total Bruto</span>
            <span className="text-xs font-semibold text-[#1A1A18]">{formatRupiahShort(total)}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="flex-1 text-[#1A1A18] font-medium">{item.name}</span>
              <span className="text-[#A0A09A]">{item.percent}%</span>
              <span className="text-[#6B6B65]">
                {formatRupiahShort(item.brutto)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
