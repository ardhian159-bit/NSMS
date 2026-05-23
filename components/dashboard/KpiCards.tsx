'use client'

import type { KPIData } from '@/lib/types'
import { formatRupiahShort } from '@/lib/dashboard/formatters'

interface KpiCardsProps {
  kpis: KPIData
}

export default function KpiCards({ kpis }: KpiCardsProps) {
  const cards = [
    {
      label: 'Total Brutto',
      value: formatRupiahShort(kpis.totalBrutto),
      sub: kpis.gagalBrutto > 0
        ? `▼ ${formatRupiahShort(kpis.gagalBrutto)} (${kpis.gagalPercent}% gagal)`
        : undefined,
      valueColor: '#1A1A18',
    },
    {
      label: 'Forecast Netto',
      value: formatRupiahShort(kpis.totalNetto),
      sub: 'Setelah PPN & CB',
      valueColor: '#1A1A18',
    },
    {
      label: 'Total Pipeline',
      value: `${kpis.totalPipeline} Paket`,
      sub: 'Paket aktif',
      valueColor: '#1A1A18',
    },
    {
      label: 'Closing',
      value: formatRupiahShort(kpis.closingNetto),
      sub: `${kpis.closingCount} Paket`,
      valueColor: '#16a34a',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-[14px] border border-[#EBEBE7]"
          style={{ padding: '14px 18px' }}
        >
          <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#A0A09A]">
            {card.label}
          </p>
          <p
            className="text-[20px] font-bold tracking-[-0.01em] mt-1.5"
            style={{ color: card.valueColor }}
          >
            {card.value}
          </p>
          {card.sub && (
            <p className="text-[11px] text-[#A0A09A] mt-0.5">{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  )
}
