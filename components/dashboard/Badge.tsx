import { TK_STATUS_MAP, getTKBadgeStyle } from '@/lib/constants'

interface BadgeProps {
  tk: number
  showLabel?: boolean
  className?: string
}

/**
 * Status badge component with TK-based color coding.
 * Design: light theme — bg-{color}-50 text-{color}-600
 */
export default function Badge({ tk, showLabel = true, className = '' }: BadgeProps) {
  const style = getTKBadgeStyle(tk)
  const label = TK_STATUS_MAP[tk] ?? `${tk}%`

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
        ${style.bg} ${style.text}
        ${style.strikethrough ? 'line-through' : ''}
        ${className}
      `}
    >
      {showLabel ? label : `${tk}%`}
    </span>
  )
}
