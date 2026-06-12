'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Lead, TrackerEntry } from '@/lib/types'
import { formatRupiahShort, truncateText } from '@/lib/dashboard/formatters'
import Badge from '@/components/dashboard/Badge'
import UpdateForm from '@/components/pipeline/UpdateForm'
import { getTrackerHistory } from '@/lib/dashboard/detail'

interface AdminTabUpdateFunnelProps {
  leads: Lead[]
  trackers: TrackerEntry[]
  onUpdated: () => void
  settings: { picNames: string[] }
}

export default function AdminTabUpdateFunnel({ leads, trackers, onUpdated, settings }: AdminTabUpdateFunnelProps) {
  const [search, setSearch] = useState('')
  const [filterPic, setFilterPic] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const PER_PAGE = 25
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let result = leads
    if (filterPic) result = result.filter(l => l.ownerName === filterPic)
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(l =>
        l.funnelId.toLowerCase().includes(s) ||
        l.ownerName.toLowerCase().includes(s) ||
        (l.namaPaket || '').toLowerCase().includes(s) ||
        (l.instansi || '').toLowerCase().includes(s)
      )
    }
    return result
  }, [leads, search, filterPic])

  useEffect(() => {
    setPage(1)
  }, [search, filterPic])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginatedRows = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const trackerHistory = useMemo(
    () => selectedLead ? getTrackerHistory(trackers, selectedLead.funnelId) : [],
    [trackers, selectedLead]
  )

  return (
    <>
      <div className="bg-surface rounded-lg border border-line overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-line bg-surface-alt flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-hint" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari funnel ID, PIC, paket, instansi..."
              className="form-input pl-9 text-sm w-full"
            />
          </div>
          <select
            value={filterPic}
            onChange={e => setFilterPic(e.target.value)}
            className="form-select text-sm w-full sm:w-48"
          >
            <option value="">Semua PIC</option>
            {settings.picNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <span className="text-xs text-ink-hint self-center whitespace-nowrap">
            {filtered.length} paket
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-ink-hint uppercase tracking-wider bg-surface-alt border-b border-line">
              <tr>
                <th className="px-3 py-2.5 font-medium">Funnel ID</th>
                <th className="px-3 py-2.5 font-medium">PIC</th>
                <th className="px-3 py-2.5 font-medium">Nama Paket</th>
                <th className="px-3 py-2.5 font-medium">Instansi</th>
                <th className="px-3 py-2.5 font-medium text-center">TK</th>
                <th className="px-3 py-2.5 font-medium text-right">Netto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-hint">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                paginatedRows.map(lead => {
                  const isLocked = lead.tk === 100 || lead.tk === 0
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-surface-alt cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-2.5 font-[family-name:var(--font-dm-mono)] text-xs text-ink-hint">
                        {lead.funnelId}
                        {isLocked && (
                          <span className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            TERKUNCI
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-ink whitespace-nowrap">
                        {lead.ownerName}
                      </td>
                      <td className="px-3 py-2.5 text-ink">
                        {truncateText(lead.namaPaket || '-', 35)}
                      </td>
                      <td className="px-3 py-2.5 text-ink-muted">
                        {truncateText(lead.instansi || '-', 24)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge tk={lead.tk} showLabel={false} />
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-ink">
                        {formatRupiahShort(lead.forecastNetto)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-line bg-surface-alt">
          <p className="text-xs text-ink-hint">
            {filtered.length > 0
              ? `${(safePage - 1) * PER_PAGE + 1}–${Math.min(safePage * PER_PAGE, filtered.length)} dari ${filtered.length}`
              : '0 data'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-1.5 rounded border border-line bg-surface text-ink-muted disabled:opacity-30 hover:bg-page transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-ink-muted font-medium">{safePage} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded border border-line bg-surface text-ink-muted disabled:opacity-30 hover:bg-page transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={open => { if (!open) setSelectedLead(null) }}>
        <DialogContent style={{ width: 'min(960px, 95vw)', maxWidth: 'none', maxHeight: '90vh', overflowY: 'auto', borderRadius: '1rem' }}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-ink">
              Update Funnel
            </DialogTitle>
          </DialogHeader>
          <UpdateForm
            lead={selectedLead}
            trackerHistory={trackerHistory}
            onUpdated={() => { onUpdated(); setSelectedLead(null) }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
