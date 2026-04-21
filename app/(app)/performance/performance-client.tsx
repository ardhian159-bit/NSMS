'use client'

import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { formatRupiahShort } from '@/lib/dashboard/formatters'
import type { Lead } from '@/lib/types'

interface PerformanceClientProps {
  initialLeads: { owner_name: string; forecast_netto: number }[]
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

function formatDiff(curr: number, next: number) {
  const nomDiff = next - curr
  if (nomDiff === 0) return '±0 · 0%'
  
  const sign = nomDiff > 0 ? '+' : ''
  const pct = curr === 0 ? 100 : (nomDiff / curr) * 100
  
  // Format to string
  const absNom = Math.abs(nomDiff)
  const nomStr = formatRupiahShort(absNom).replace('Rp', '').trim()
  const displayNom = nomDiff < 0 ? `-${nomStr}` : `+${nomStr}`
  
  return `${displayNom} · ${sign}${pct.toFixed(0)}%`
}

export default function PerformanceClient({ initialLeads }: PerformanceClientProps) {
  // Aggregate data per PIC
  const picAgg = useMemo(() => {
    const map: Record<string, number> = {}
    initialLeads.forEach(lk => {
      const pic = lk.owner_name || 'Unknown'
      map[pic] = (map[pic] || 0) + (lk.forecast_netto || 0)
    })
    
    return Object.entries(map)
      .map(([name, netto]) => ({ name, netto }))
      .sort((a, b) => b.netto - a.netto)
  }, [initialLeads])

  // Initial selection (up to 4)
  const initialSelection = useMemo(() => {
    return picAgg.slice(0, 4).map(p => p.name)
  }, [picAgg])

  const [selectedPics, setSelectedPics] = useState<string[]>(initialSelection)

  const togglePic = (pic: string) => {
    setSelectedPics(prev => {
      if (prev.includes(pic)) {
        return prev.filter(p => p !== pic)
      } else {
        if (prev.length >= 4) return prev // block adding more than 4
        return [...prev, pic]
      }
    })
  }

  // Build chart data maintaining the sort order of selected pics
  const chartData = useMemo(() => {
    return picAgg
      .filter(p => selectedPics.includes(p.name))
      .map((p, i) => ({
        ...p,
        colorIndex: i
      }))
  }, [picAgg, selectedPics])

  // Custom component for the diff labels
  const DiffOverlay = (props: any) => {
    const { xAxisMap, yAxisMap, offset, width, height, data } = props;
    if (!offset || !data || data.length < 2) return null;

    // xAxisMap sometimes isn't structured reliably in v2, but we can compute proportional steps
    // Data length = N
    // Available width array step = offset.width / N
    // Center of bar i = offset.left + (step * i) + (step / 2)
    // Between bar i and i+1 = center of bar i + step / 2 = offset.left + step * (i + 1)
    const N = data.length;
    const step = offset.width / N;

    // Y Axis scaling max bound determination
    // Since we don't fix the domain, recharts auto-calculates. 
    // yAxisMap or getting coordinates direct from data.
    // However, Recharts <Customized> doesn't expose the bar's computed heights easily unless we compute domain bounds.
    // Let's use robust manual domain locking using the Recharts parent YAxis
    return <></>
  } // I will rethink diffusing the label over BarChart using LabelList

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A18]">Performance</h1>
        <p className="text-sm text-[#A0A09A] mt-0.5">Perbandingan forecast netto per PIC</p>
      </div>

      <div className="bg-white rounded-lg border border-[#EBEBE7] p-5">
        <h2 className="text-sm font-semibold text-[#1A1A18] mb-3">Pilih PIC (Maks. 4)</h2>
        <div className="flex flex-wrap gap-2">
          {picAgg.map((p) => {
            const isSelected = selectedPics.includes(p.name)
            const isDisabled = !isSelected && selectedPics.length >= 4
            return (
              <button
                key={p.name}
                onClick={() => togglePic(p.name)}
                disabled={isDisabled}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
                  ${isSelected 
                    ? 'bg-[#1A1A18] text-white border-[#1A1A18]' 
                    : isDisabled 
                      ? 'bg-neutral-50 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-60' 
                      : 'bg-white text-[#6B6B65] border-[#EBEBE7] hover:border-[#1A1A18] hover:text-[#1A1A18]'}
                `}
              >
                {p.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#EBEBE7] p-5">
        <div className="h-[380px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBE7" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B6B65', fontFamily: 'var(--font-dm-sans)' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => formatRupiahShort(val)}
                tick={{ fontSize: 12, fill: '#6B6B65', fontFamily: 'var(--font-dm-mono)' }}
              />
              <Tooltip
                cursor={{ fill: '#F5F5F2' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-[#EBEBE7] shadow-sm rounded-lg p-3">
                        <p className="text-xs font-semibold text-[#1A1A18] mb-1">{payload[0].payload.name}</p>
                        <p className="text-xs text-[#064E3B] font-mono font-medium">
                          {formatRupiahShort(payload[0].value as number)}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              {/* Using a custom shaped Bar to harvest coordinates or render absolute foreignObject per bar */}
              <Bar 
                dataKey="netto" 
                radius={[4, 4, 0, 0]}
                shape={(props: any) => {
                  const { x, y, width, height, index, payload } = props;
                  
                  // Recharts magic: The gap arithmetic
                  // We render the Diff HTML component from WITHIN the bar shape drawing function!
                  // It's technically drawn by Bar 0, Bar 1... up to Bar N-2.
                  
                  const isLast = index === chartData.length - 1;
                  const currentVal = payload?.netto ?? 0;
                  const nextVal = isLast ? 0 : (chartData[index + 1]?.netto ?? 0);
                  
                  // Compute ratio using THIS bar's metrics (pixel density)
                  const pixelsPerUnit = currentVal === 0 ? 0 : height / currentVal;
                  
                  let nextHeight = 0;
                  if (!isLast) {
                     // Extrapolate next bar's visual height if we have a valid pixel scale
                     if (pixelsPerUnit > 0) {
                        nextHeight = nextVal * pixelsPerUnit;
                     } else {
                        // Edge case: current is 0, so we can't derive scale factor from it.
                        // Can't reliably draw the Y accurately from here without full chart context.
                        // Let's just fix the Y to the bottom axis. 
                     }
                  }

                  const Y0 = y + height;
                  const fallbackNextY = Y0 - nextHeight;
                  const nextY = pixelsPerUnit > 0 ? fallbackNextY : y; 

                  const shorterY = Math.max(y, nextY); // visually lower value on screen = larger Y num. above it = subtract.
                  const overlayY = shorterY - 25; 
                  // If both are 0, Y0 is the base.
                  
                  // Approximate midX between this bar's right edge and next bar's left edge
                  const midX = x + width + 20;

                  // Recharts requires returning an SVG Element for shape!
                  return (
                    <g>
                      {/* Normal Bar Rectangle */}
                      <path d={`M${x},${Y0} L${x},${y+4} Q${x},${y} ${x+4},${y} L${x+width-4},${y} Q${x+width},${y} ${x+width},${y+4} L${x+width},${Y0} Z`} fill={COLORS[props.colorIndex % COLORS.length]} />
                      
                      {/* Diff Overlay to the Right of THIS Bar */}
                      {!isLast && chartData.length > 1 && (
                        <foreignObject 
                           x={midX - 60} 
                           y={overlayY < 0 ? 0 : overlayY} 
                           width={120} 
                           height={32}
                           style={{ overflow: 'visible' }}
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="bg-[#F5F5F2] text-[#6B6B65] text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border border-[#EBEBE7] shadow-sm whitespace-nowrap">
                              {formatDiff(currentVal, nextVal)}
                            </div>
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
