'use client'

import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import type { Lead } from '@/lib/types'
import { formatRupiahShort, truncateText } from '@/lib/dashboard/formatters'
import Badge from '@/components/dashboard/Badge'

interface AdminLeadTableProps {
  leads: Lead[]
  onEdit: (lead: Lead) => void
  onDelete: (lead: Lead) => void
}

const PER_PAGE = 20

export default function AdminLeadTable({ leads, onEdit, onDelete }: AdminLeadTableProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = leads.filter((d) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      d.funnelId.toLowerCase().includes(s) ||
      d.ownerName.toLowerCase().includes(s) ||
      d.namaPaket.toLowerCase().includes(s) ||
      d.instansi.toLowerCase().includes(s)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PER_PAGE
  const rows = filtered.slice(start, start + PER_PAGE)

  return (
    <div className="bg-white rounded-lg border border-[#EBEBE7] overflow-hidden">
      {/* Search */}
      <div className="px-4 py-3 border-b border-[#EBEBE7]">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A09A]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari funnel ID, PIC, paket..."
            className="form-input pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-[#A0A09A] uppercase bg-[#FAFAF8] border-b border-[#EBEBE7]">
            <tr>
              <th className="px-3 py-3 font-medium w-24">Funnel ID</th>
              <th className="px-3 py-3 font-medium w-28">PIC</th>
              <th className="px-3 py-3 font-medium">Nama Paket</th>
              <th className="px-3 py-3 font-medium w-32">Instansi</th>
              <th className="px-3 py-3 font-medium w-20 text-center">TK</th>
              <th className="px-3 py-3 font-medium w-28 text-right">Brutto</th>
              <th className="px-3 py-3 font-medium w-28 text-right">Netto</th>
              <th className="px-3 py-3 font-medium w-20 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBEBE7]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[#A0A09A]">
                  Tidak ada data ditemukan
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAFAF8] transition-colors">
                  <td className="px-3 py-3 font-[family-name:var(--font-dm-mono)] text-xs text-[#A0A09A]">
                    {row.funnelId}
                  </td>
                  <td className="px-3 py-3 text-[#1A1A18] font-medium whitespace-nowrap">{row.ownerName}</td>
                  <td className="px-3 py-3 text-[#1A1A18]" title={row.namaPaket}>
                    {truncateText(row.namaPaket, 35)}
                  </td>
                  <td className="px-3 py-3 text-[#6B6B65]" title={row.instansi}>
                    {truncateText(row.instansi, 24)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Badge tk={row.tk} showLabel={false} />
                  </td>
                  <td className="px-3 py-3 text-right text-[#6B6B65]">
                    {formatRupiahShort(row.nilaiAnggaran)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-[#1A1A18]">
                    {formatRupiahShort(row.forecastNetto)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit(row)}
                        className="p-1.5 rounded-md text-[#6B6B65] hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(row)}
                        className="p-1.5 rounded-md text-[#6B6B65] hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#EBEBE7] bg-[#FAFAF8]">
        <p className="text-xs text-[#A0A09A]">
          {filtered.length > 0 ? `${start + 1}–${Math.min(start + PER_PAGE, filtered.length)} dari ${filtered.length}` : '0 data'}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="p-1.5 rounded border border-[#EBEBE7] bg-white text-[#6B6B65] disabled:opacity-30 hover:bg-[#F5F5F2] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-[#6B6B65] font-medium">{safePage} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="p-1.5 rounded border border-[#EBEBE7] bg-white text-[#6B6B65] disabled:opacity-30 hover:bg-[#F5F5F2] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
