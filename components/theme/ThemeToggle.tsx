'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

interface ThemeToggleProps {
  /** compact = ikon bulat (footer sidebar); row = baris penuh (Settings) */
  variant?: 'compact' | 'row'
  collapsed?: boolean
}

export default function ThemeToggle({ variant = 'compact', collapsed = false }: ThemeToggleProps) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const Icon = isDark ? Sun : Moon
  const label = isDark ? 'Mode Terang' : 'Mode Gelap'

  if (variant === 'row') {
    return (
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-line bg-surface hover:bg-surface-alt transition-colors"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium text-ink">
          <Icon className="w-4 h-4 text-ink-muted" />
          {label}
        </span>
        <span className="text-xs text-ink-hint capitalize">{theme}</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      title={label}
      className={`flex items-center gap-2 text-xs text-ink-hint hover:text-ink transition-colors ${collapsed ? 'justify-center w-full' : 'px-1'}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {!collapsed && label}
    </button>
  )
}
