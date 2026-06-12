'use client'

import { Search, RotateCcw, Download } from 'lucide-react'
import type { FilterState } from '@/lib/types'
import { TK_VALUES_ALL } from '@/lib/constants'
import MultiSelect from './MultiSelect'

interface FilterBarProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  options: {
    pics: string[]
    wilayahs: string[]
    principals: string[]
    sumberDanas: string[]
    ketPenggaraps: string[]
  }
  onExport?: () => void
  isExporting?: boolean
}

export default function FilterBar({ filters, onFilterChange, options, onExport, isExporting }: FilterBarProps) {
  const update = (partial: Partial<FilterState>) => {
    onFilterChange({ ...filters, ...partial })
  }

  const reset = () => {
    onFilterChange({
      quarter: [],
      tk: [],
      sumberDana: [],
      pic: [],
      wilayah: [],
      principal: [],
      ketPenggarap: [],
      search: '',
    })
  }

  // toggle satu nilai dalam array filter (klik lagi = lepas)
  const toggle = (key: 'quarter' | 'tk', value: string) => {
    const cur = filters[key]
    update({ [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] })
  }

  const pillClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      active ? 'bg-accent-solid text-accent-on' : 'bg-page text-ink-muted hover:bg-line'
    }`

  return (
    <div className="bg-surface rounded-lg border border-line p-4 space-y-4">
      {/* Row 1: Quarter pills */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink-hint uppercase tracking-wider mr-1">Quarter</span>
          <button onClick={() => update({ quarter: [] })} className={pillClass(filters.quarter.length === 0)}>
            Semua
          </button>
          {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
            <button key={q} onClick={() => toggle('quarter', q)} className={pillClass(filters.quarter.includes(q))}>
              {q}
            </button>
          ))}
        </div>
        {onExport && (
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-medium text-brand hover:bg-brand-soft hover:border-brand transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Menyiapkan...' : 'Export Excel'}
          </button>
        )}
      </div>

      {/* Row 2: TK pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink-hint uppercase tracking-wider mr-1">Stage</span>
        <button onClick={() => update({ tk: [] })} className={pillClass(filters.tk.length === 0)}>
          Semua
        </button>
        {TK_VALUES_ALL.map((tk) => (
          <button key={tk} onClick={() => toggle('tk', tk.toString())} className={pillClass(filters.tk.includes(tk.toString()))}>
            {tk}%
          </button>
        ))}
      </div>

      {/* Row 3: Dropdowns + Search */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* PIC */}
        <MultiSelect
          label="PIC"
          options={options.pics}
          selected={filters.pic}
          onChange={(v) => update({ pic: v })}
        />

        {/* Principal */}
        <MultiSelect
          label="Principal"
          options={options.principals}
          selected={filters.principal}
          onChange={(v) => update({ principal: v })}
        />

        {/* Wilayah */}
        <MultiSelect
          label="Wilayah"
          options={options.wilayahs}
          selected={filters.wilayah}
          onChange={(v) => update({ wilayah: v })}
        />

        {/* Sumber Dana */}
        <MultiSelect
          label="Sumber Dana"
          options={options.sumberDanas}
          selected={filters.sumberDana}
          onChange={(v) => update({ sumberDana: v })}
        />

        {/* Penggarap */}
        <MultiSelect
          label="Penggarap"
          options={options.ketPenggaraps}
          selected={filters.ketPenggarap}
          onChange={(v) => update({ ketPenggarap: v })}
        />

        {/* Search + Reset */}
        <div className="flex gap-2 col-span-2 md:col-span-4 lg:col-span-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-hint" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              placeholder="Cari paket, instansi..."
              className="w-full rounded-lg border border-line bg-surface text-sm text-ink pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent-solid placeholder:text-ink-hint"
            />
          </div>
          <button
            onClick={reset}
            className="p-2 rounded-lg border border-line bg-surface text-ink-hint hover:text-ink hover:border-accent-solid transition-colors"
            title="Reset Filter"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
