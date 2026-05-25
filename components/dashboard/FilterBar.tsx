'use client'

import { Search, RotateCcw, Download } from 'lucide-react'
import type { FilterState } from '@/lib/types'
import { TK_VALUES_ALL } from '@/lib/constants'

interface FilterBarProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  options: {
    pics: string[]
    wilayahs: string[]
    principals: string[]
    sumberDanas: string[]
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
      quarter: 'ALL',
      sumberDana: 'ALL',
      pic: 'ALL',
      wilayah: 'ALL',
      principal: 'ALL',
      tk: 'ALL',
      search: '',
    })
  }

  return (
    <div className="bg-white rounded-lg border border-[#EBEBE7] p-4 space-y-4">
      {/* Row 1: Quarter pills */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[#A0A09A] uppercase tracking-wider mr-1">Quarter</span>
          {['ALL', 'Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
            <button
              key={q}
              onClick={() => update({ quarter: q })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filters.quarter === q
                  ? 'bg-[#1A1A18] text-white'
                  : 'bg-[#F5F5F2] text-[#6B6B65] hover:bg-[#EBEBE7]'
              }`}
            >
              {q === 'ALL' ? 'Semua' : q}
            </button>
          ))}
        </div>
        {onExport && (
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EBEBE7] bg-white text-xs font-medium text-[#064E3B] hover:bg-[#F0FDF4] hover:border-[#064E3B] transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Menyiapkan...' : 'Export Excel'}
          </button>
        )}
      </div>

      {/* Row 2: TK pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-[#A0A09A] uppercase tracking-wider mr-1">Stage</span>
        <button
          onClick={() => update({ tk: 'ALL' })}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filters.tk === 'ALL'
              ? 'bg-[#1A1A18] text-white'
              : 'bg-[#F5F5F2] text-[#6B6B65] hover:bg-[#EBEBE7]'
          }`}
        >
          Semua
        </button>
        {TK_VALUES_ALL.map((tk) => (
          <button
            key={tk}
            onClick={() => update({ tk: tk.toString() })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filters.tk === tk.toString()
                ? 'bg-[#1A1A18] text-white'
                : 'bg-[#F5F5F2] text-[#6B6B65] hover:bg-[#EBEBE7]'
            }`}
          >
            {tk}%
          </button>
        ))}
      </div>

      {/* Row 3: Dropdowns + Search */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* PIC */}
        <select
          value={filters.pic}
          onChange={(e) => update({ pic: e.target.value })}
          className="rounded-lg border border-[#EBEBE7] bg-white text-sm text-[#1A1A18] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1A1A18]"
        >
          <option value="ALL">Semua PIC</option>
          {options.pics.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Principal */}
        <select
          value={filters.principal}
          onChange={(e) => update({ principal: e.target.value })}
          className="rounded-lg border border-[#EBEBE7] bg-white text-sm text-[#1A1A18] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1A1A18]"
        >
          <option value="ALL">Semua Principal</option>
          {options.principals.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Wilayah */}
        <select
          value={filters.wilayah}
          onChange={(e) => update({ wilayah: e.target.value })}
          className="rounded-lg border border-[#EBEBE7] bg-white text-sm text-[#1A1A18] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1A1A18]"
        >
          <option value="ALL">Semua Wilayah</option>
          {options.wilayahs.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>

        {/* Sumber Dana */}
        <select
          value={filters.sumberDana}
          onChange={(e) => update({ sumberDana: e.target.value })}
          className="rounded-lg border border-[#EBEBE7] bg-white text-sm text-[#1A1A18] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1A1A18]"
        >
          <option value="ALL">Semua Sumber Dana</option>
          {options.sumberDanas.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Search + Reset */}
        <div className="flex gap-2 col-span-2 md:col-span-4 lg:col-span-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A09A]" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              placeholder="Cari paket, instansi..."
              className="w-full rounded-lg border border-[#EBEBE7] bg-white text-sm text-[#1A1A18] pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1A1A18] placeholder:text-[#A0A09A]"
            />
          </div>
          <button
            onClick={reset}
            className="p-2 rounded-lg border border-[#EBEBE7] bg-white text-[#A0A09A] hover:text-[#1A1A18] hover:border-[#1A1A18] transition-colors"
            title="Reset Filter"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
