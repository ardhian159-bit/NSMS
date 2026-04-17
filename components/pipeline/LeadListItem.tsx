import Badge from '@/components/dashboard/Badge'
import { formatRupiahShort, truncateText } from '@/lib/dashboard/formatters'
import type { Lead } from '@/lib/types'

interface LeadListItemProps {
  lead: Lead
  selected: boolean
  onClick: () => void
}

export default function LeadListItem({ lead, selected, onClick }: LeadListItemProps) {
  const isLocked = lead.tk === 100 || lead.tk === 0

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-3 py-3 rounded-lg transition-colors border
        ${selected
          ? 'bg-[#1A1A18] text-white border-[#1A1A18]'
          : 'bg-white text-[#1A1A18] border-[#EBEBE7] hover:bg-[#F5F5F2]'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className={`text-[10px] font-[family-name:var(--font-dm-mono)] ${selected ? 'text-white/60' : 'text-[#A0A09A]'}`}>
          {lead.funnelId}
        </span>
        <div className="flex items-center gap-1">
          <Badge tk={lead.tk} showLabel={false} />
          {isLocked && (
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
              selected ? 'bg-white/20 text-white/80' : 'bg-amber-100 text-amber-700'
            }`}>
              TERKUNCI
            </span>
          )}
        </div>
      </div>
      <p className={`text-sm font-medium leading-snug mb-1 ${selected ? 'text-white' : 'text-[#1A1A18]'}`}>
        {truncateText(lead.namaPaket || '(Tanpa nama)', 45)}
      </p>
      <div className="flex items-center justify-between">
        <span className={`text-xs ${selected ? 'text-white/60' : 'text-[#6B6B65]'}`}>
          {truncateText(lead.instansi, 25)}
        </span>
        <span className={`text-xs font-semibold ${selected ? 'text-white' : 'text-[#1A1A18]'}`}>
          {formatRupiahShort(lead.forecastNetto)}
        </span>
      </div>
    </button>
  )
}
