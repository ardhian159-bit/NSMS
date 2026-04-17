'use client'

import { TrendingDown, TrendingUp, Package, CheckCircle } from 'lucide-react'
import type { KPIData } from '@/lib/types'
import { formatRupiahShort } from '@/lib/dashboard/formatters'

interface KpiCardsProps {
  kpis: KPIData
}

interface CardConfig {
  title: string
  getValue: (k: KPIData) => string
  getSubtext?: (k: KPIData) => string
  icon: React.ElementType
  iconColor: string
  iconBg: string
}

const CARDS: CardConfig[] = [
  {
    title: 'Total Brutto',
    getValue: (k) => formatRupiahShort(k.totalBrutto),
    getSubtext: (k) =>
      k.gagalBrutto > 0
        ? `▼ ${formatRupiahShort(k.gagalBrutto)} (${k.gagalPercent}% gagal)`
        : '',
    icon: TrendingUp,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    title: 'Forecast Netto',
    getValue: (k) => formatRupiahShort(k.totalNetto),
    icon: TrendingDown,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
  },
  {
    title: 'Total Pipeline',
    getValue: (k) => `${k.totalPipeline} Paket`,
    icon: Package,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
  {
    title: 'Closing',
    getValue: (k) => formatRupiahShort(k.closingNetto),
    getSubtext: (k) => `${k.closingCount} Paket`,
    icon: CheckCircle,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
  },
]

export default function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((card) => {
        const subtext = card.getSubtext?.(kpis)
        return (
          <div
            key={card.title}
            className="bg-white rounded-lg border border-[#EBEBE7] p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#A0A09A] uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-lg font-semibold text-[#1A1A18]">
              {card.getValue(kpis)}
            </p>
            {subtext && (
              <p className="text-[11px] text-[#A0A09A] mt-1">{subtext}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
