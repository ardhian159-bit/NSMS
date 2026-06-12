'use client'

import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Lead, SortState } from '@/lib/types'
import { formatRupiahShort } from '@/lib/dashboard/formatters'
import { truncateText } from '@/lib/dashboard/formatters'
import Badge from './Badge'

interface PipelineTableProps {
  rows: Lead[]
  sort: SortState
  onSort: (column: string) => void
  page: number
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
  onPageChange: (page: number) => void
  onRowClick: (funnelId: string) => void
}

const COLUMNS = [
  { key: 'funnelId',       label: 'ID',         sortable: false, className: 'w-20' },
  { key: 'ownerName',      label: 'PIC',        sortable: true,  className: 'w-28' },
  { key: 'principal',      label: 'Principal',   sortable: true,  className: 'w-28' },
  { key: 'namaPaket',      label: 'Nama Paket',  sortable: true,  className: 'max-w-[200px]' },
  { key: 'wilayah',        label: 'Wilayah',     sortable: true,  className: 'w-28' },
  { key: 'instansi',       label: 'Instansi',    sortable: true,  className: 'max-w-[160px]' },
  { key: 'sumberDana',     label: 'SD',          sortable: false, className: 'w-20' },
  { key: 'nilaiAnggaran',  label: 'Brutto',      sortable: true,  className: 'w-28 text-right' },
  { key: 'forecastNetto',  label: 'Netto',       sortable: true,  className: 'w-28 text-right' },
  { key: 'quarter',        label: 'Q',           sortable: true,  className: 'w-12 text-center' },
  { key: 'tk',             label: 'TK',          sortable: true,  className: 'w-24 text-center' },
]

export default function PipelineTable({
  rows, sort, onSort, page, totalPages, totalItems,
  startIndex, endIndex, onPageChange, onRowClick,
}: PipelineTableProps) {
  const SortIcon = ({ col }: { col: string }) => {
    if (sort.column !== col) return <span className="text-ink-hint ml-0.5 text-[10px]">↕</span>
    return sort.ascending
      ? <ChevronUp className="w-3 h-3 text-ink ml-0.5 inline" />
      : <ChevronDown className="w-3 h-3 text-ink ml-0.5 inline" />
  }

  return (
    <div className="bg-surface rounded-lg border border-line overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-ink-hint uppercase bg-surface-alt border-b border-line">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-3 font-medium ${col.className} ${col.sortable ? 'cursor-pointer hover:text-ink select-none' : ''}`}
                  onClick={col.sortable ? () => onSort(col.key) : undefined}
                >
                  {col.label}
                  {col.sortable && <SortIcon col={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-ink-hint">
                  Tidak ada data ditemukan
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.funnelId}
                  className="hover:bg-surface-alt transition-colors cursor-pointer"
                  onClick={() => onRowClick(row.funnelId)}
                >
                  <td className="px-3 py-3 font-[family-name:var(--font-dm-mono)] text-xs text-ink-hint">
                    {row.funnelId}
                  </td>
                  <td className="px-3 py-3 text-ink whitespace-nowrap">{row.ownerName}</td>
                  <td className="px-3 py-3 font-medium text-ink">{row.principal}</td>
                  <td className="px-3 py-3 text-ink" title={row.namaPaket}>
                    {truncateText(row.namaPaket, 40)}
                  </td>
                  <td className="px-3 py-3 text-ink-muted">{row.wilayah}</td>
                  <td className="px-3 py-3 text-ink-muted" title={row.instansi}>
                    {truncateText(row.instansi, 28)}
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 bg-page rounded text-xs text-ink-muted border border-line">
                      {row.sumberDana || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-ink-muted">
                    {formatRupiahShort(row.nilaiAnggaran)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-ink">
                    {formatRupiahShort(row.forecastNetto)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-page text-xs font-medium text-ink-muted">
                      {row.quarter || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Badge tk={row.tk} showLabel={false} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-line bg-surface-alt">
        <p className="text-xs text-ink-hint">
          {totalItems > 0 ? `${startIndex + 1}–${endIndex} dari ${totalItems} data` : '0 data'}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded border border-line bg-surface text-ink-muted disabled:opacity-30 hover:bg-page transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-ink-muted font-medium">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded border border-line bg-surface text-ink-muted disabled:opacity-30 hover:bg-page transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
