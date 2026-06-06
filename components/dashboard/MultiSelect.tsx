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

  const selectAllFiltered = () => {
    const merged = new Set([...selected, ...filtered])
    onChange([...merged])
  }

  const clearAll = () => onChange([])

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
          className={`flex items-center justify-between gap-2 w-full rounded-lg border bg-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1A1A18] transition-colors ${
            selected.length > 0
              ? 'border-[#1A1A18] text-[#1A1A18] font-medium'
              : 'border-[#EBEBE7] text-[#6B6B65]'
          }`}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="w-4 h-4 flex-shrink-0 text-[#A0A09A]" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[220px] rounded-lg border border-[#EBEBE7] bg-white shadow-lg overflow-hidden"
        >
          {/* Search */}
          <div className="p-2 border-b border-[#EBEBE7]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A0A09A]" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Cari ${label.toLowerCase()}...`}
                className="w-full rounded-md border border-[#EBEBE7] bg-white text-sm text-[#1A1A18] pl-8 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1A1A18] placeholder:text-[#A0A09A]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#EBEBE7] text-xs">
            <button
              onClick={selectAllFiltered}
              className="text-[#064E3B] font-medium hover:underline"
            >
              Pilih semua
            </button>
            <span className="text-[#A0A09A]">{selected.length} terpilih</span>
            <button
              onClick={clearAll}
              className="text-[#6B6B65] font-medium hover:text-[#1A1A18] hover:underline disabled:opacity-40"
              disabled={selected.length === 0}
            >
              Hapus
            </button>
          </div>

          {/* Checklist */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-[#A0A09A] text-center">Tidak ada hasil</p>
            ) : (
              filtered.map((opt) => {
                const checked = selected.includes(opt)
                return (
                  <button
                    key={opt}
                    onClick={() => toggle(opt)}
                    className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-left hover:bg-[#F5F5F2] transition-colors"
                  >
                    <span
                      className={`flex items-center justify-center w-4 h-4 rounded border flex-shrink-0 ${
                        checked ? 'bg-[#1A1A18] border-[#1A1A18]' : 'border-[#D4D4D0] bg-white'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="truncate text-[#1A1A18]">{opt}</span>
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
