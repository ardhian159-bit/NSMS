'use client'

import { useState, useMemo } from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { Check, ChevronDown, Search, X } from 'lucide-react'

interface MultiSelectProps {
  /** Label dasar, mis. "PIC" */
  label: string
  /** Semua opsi tersedia */
  options: string[]
  /** Nilai terpilih ([] = semua) */
  selected: string[]
  /** Callback saat pilihan berubah */
  onChange: (values: string[]) => void
}

export default function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return options
    const q = query.toLowerCase()
    return options.filter((o) => o.toLowerCase().includes(q))
  }, [options, query])

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val))
    } else {
      onChange([...selected, val])
    }
  }

  // Master "Semua" → balik ke [] (semua masuk). selected=[] berarti semua.
  const isAll = selected.length === 0
  const selectAll = () => onChange([])

  // Label trigger
  const triggerLabel =
    selected.length === 0
      ? `Semua ${label}`
      : selected.length === 1
        ? selected[0]
        : `${label} · ${selected.length}`

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={`flex items-center justify-between gap-2 w-full rounded-lg border bg-surface text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent-solid transition-colors ${
            selected.length > 0
              ? 'border-accent-solid text-ink font-medium'
              : 'border-line text-ink-muted'
          }`}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="w-4 h-4 flex-shrink-0 text-ink-hint" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[220px] rounded-lg border border-line bg-surface shadow-lg overflow-hidden"
        >
          {/* Search */}
          <div className="p-2 border-b border-line">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-hint" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Cari ${label.toLowerCase()}...`}
                className="w-full rounded-md border border-line bg-surface text-sm text-ink pl-8 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-solid placeholder:text-ink-hint"
              />
            </div>
          </div>

          {/* Master "Semua" */}
          <button
            onClick={selectAll}
            className="flex items-center justify-between gap-2.5 w-full px-3 py-2 text-sm text-left border-b border-line hover:bg-page transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <span
                className={`flex items-center justify-center w-4 h-4 rounded border flex-shrink-0 ${
                  isAll ? 'bg-accent-solid border-accent-solid' : 'border-line bg-surface'
                }`}
              >
                {isAll && <Check className="w-3 h-3 text-accent-on" />}
              </span>
              <span className="font-medium text-ink">Semua {label}</span>
            </span>
            {!isAll && <span className="text-xs text-ink-hint">{selected.length} terpilih</span>}
          </button>

          {/* Checklist */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-ink-hint text-center">Tidak ada hasil</p>
            ) : (
              filtered.map((opt) => {
                const checked = selected.includes(opt)
                return (
                  <button
                    key={opt}
                    onClick={() => toggle(opt)}
                    className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-left hover:bg-page transition-colors"
                  >
                    <span
                      className={`flex items-center justify-center w-4 h-4 rounded border flex-shrink-0 ${
                        checked ? 'bg-accent-solid border-accent-solid' : 'border-line bg-surface'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 text-accent-on" />}
                    </span>
                    <span className="truncate text-ink">{opt}</span>
                  </button>
                )
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
