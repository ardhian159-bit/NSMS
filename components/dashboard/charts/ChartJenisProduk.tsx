'use client'

import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList } from 'recharts'
import { formatRupiahShort } from '@/lib/dashboard/formatters'

// Palet kategorikal — tiap jenis produk dapat warna sendiri (selaras pie Sumber Dana)
const PRODUK_COLORS = ['#ef4444', '#8b5cf6', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981', '#6366f1', '#ec4899']

interface JenisProdukChartItem {
  name: string
  netto: number
  count: number
}

interface ChartJenisProdukProps {
  data: JenisProdukChartItem[]
}

export default function ChartJenisProduk({ data }: ChartJenisProdukProps) {
  if (data.length === 0) return null

  return (
    <div className="bg-surface rounded-lg border border-line p-4">
      <h3 className="text-sm font-semibold text-ink mb-4">Breakdown Jenis Produk</h3>
      
      <div style={{ height: Math.max(200, data.length * 44) }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 170, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={120}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'var(--ink-muted)', fontFamily: 'var(--font-dm-sans)' }}
            />
            <Tooltip
              cursor={{ fill: 'var(--surface-alt)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload
                  return (
                    <div className="bg-surface border border-line shadow-sm rounded-lg p-3">
                      <p className="text-xs font-semibold text-ink mb-1">{d.name}</p>
                      <p className="text-[11px] text-ink-hint mb-0.5">{d.count} Paket</p>
                      <p className="text-xs text-brand font-mono font-medium">
                        {formatRupiahShort(d.netto)}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar
              dataKey="netto"
              radius={[0, 4, 4, 0]}
              barSize={24}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PRODUK_COLORS[i % PRODUK_COLORS.length]} />
              ))}
              <LabelList
                dataKey="netto"
                position="right"
                content={(props: any) => {
                  const { x, y, width, height, value, index } = props;
                  const count = data[index]?.count || 0;
                  return (
                    <text
                      x={x + width + 8}
                      y={y + height / 2 + 4}
                      fill="var(--ink-muted)"
                      textAnchor="start"
                      style={{ fontSize: '11px', fontWeight: 500, fontFamily: 'var(--font-dm-sans)' }}
                    >
                      {`${count} Paket — ${formatRupiahShort(value as number)}`}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
