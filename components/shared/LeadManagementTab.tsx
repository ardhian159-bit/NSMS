'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Pencil, Trash2 } from 'lucide-react'
import type { Lead, AppSettings, Profile } from '@/lib/types'
import InputLeadForm from '@/components/shared/InputLeadForm'
import Badge from '@/components/dashboard/Badge'
import { formatRupiahShort, truncateText } from '@/lib/dashboard/formatters'

interface LeadManagementTabProps {
  leads: Lead[]
  settings: AppSettings
  profile: Profile
  onRefetch: () => void
  onDelete?: (lead: Lead) => void  // jika undefined, tombol hapus tidak muncul
}

const PAGE_SIZE = 25

export default function LeadManagementTab({
  leads,
  settings,
  profile,
  onRefetch,
  onDelete,
}: LeadManagementTabProps) {
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [search, setSearch] = useState('')
  const [filterPic, setFilterPic] = useState('')
  const [page, setPage] = useState(0)

  const showPicCol = profile.role !== 'sales'

  const filtered = useMemo(() => {
    let result = leads
    if (filterPic) result = result.filter(l => l.ownerName === filterPic)
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(l =>
        (l.namaPaket || '').toLowerCase().includes(s) ||
        l.funnelId.toLowerCase().includes(s) ||
        (l.instansi || '').toLowerCase().includes(s)
      )
    }
    return result
  }, [leads, filterPic, search])

  useEffect(() => { setPage(0) }, [search, filterPic])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <InputLeadForm
        defaultOwnerName={profile.role === 'sales' ? profile.picName : undefined}
        settings={settings}
        profile={profile}
        onSuccess={() => { setEditingLead(null); onRefetch() }}
        editLead={editingLead}
        onCancelEdit={() => setEditingLead(null)}
      />

      <div className="bg-surface rounded-lg border border-line overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-line bg-surface-alt flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-hint" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari funnel ID, nama paket, instansi..."
              className="form-input pl-9 text-sm w-full"
            />
          </div>
          {showPicCol && (
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
          )}
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
                {showPicCol && <th className="px-3 py-2.5 font-medium">PIC</th>}
                <th className="px-3 py-2.5 font-medium">Nama Paket</th>
                {showPicCol && <th className="px-3 py-2.5 font-medium">Instansi</th>}
                <th className="px-3 py-2.5 font-medium text-center">Status</th>
                <th className="px-3 py-2.5 font-medium text-right">Netto</th>
                <th className="px-3 py-2.5 font-medium text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={showPicCol ? 7 : 5} className="px-4 py-10 text-center text-ink-hint">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                paginated.map(lead => {
                  const isLocked = lead.tk === 100 || lead.tk === 0
                  const isEditing = editingLead?.id === lead.id
                  return (
                    <tr
                      key={lead.id}
                      className={`transition-colors ${
                        isEditing
                          ? 'bg-brand-soft border-l-2 border-l-brand'
                          : 'hover:bg-surface-alt'
                      }`}
                    >
                      <td className="px-3 py-2.5 font-[family-name:var(--font-dm-mono)] text-xs text-ink-hint">
                        {lead.funnelId}
                        {isLocked && (
                          <span className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            TERKUNCI
                          </span>
                        )}
                      </td>
                      {showPicCol && (
                        <td className="px-3 py-2.5 font-medium text-ink whitespace-nowrap">
                          {lead.ownerName}
                        </td>
                      )}
                      <td className="px-3 py-2.5 text-ink">
                        {truncateText(lead.namaPaket || '-', 35)}
                      </td>
                      {showPicCol && (
                        <td className="px-3 py-2.5 text-ink-muted">
                          {truncateText(lead.instansi || '-', 24)}
                        </td>
                      )}
                      <td className="px-3 py-2.5 text-center">
                        <Badge tk={lead.tk} />
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-ink">
                        {formatRupiahShort(lead.forecastNetto)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {!isLocked && (
                            <button
                              onClick={() => {
                                setEditingLead(lead)
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }}
                              className="p-1.5 rounded-md text-ink-hint hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit lead"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(lead)}
                              className="p-1.5 rounded-md text-ink-hint hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Hapus lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-line flex items-center justify-between text-xs text-ink-muted">
          <span>
            {filtered.length === 0 ? '0 entri' :
              `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} dari ${filtered.length} entri`}
          </span>
          <div className="flex gap-1">
            {[
              { label: '«', target: 0 },
              { label: '‹', target: page - 1 },
              { label: '›', target: page + 1 },
              { label: '»', target: totalPages - 1 },
            ].map(({ label, target }) => (
              <button
                key={label}
                onClick={() => setPage(Math.max(0, Math.min(target, totalPages - 1)))}
                disabled={
                  (label === '«' || label === '‹') ? page === 0 :
                  page >= totalPages - 1
                }
                className="px-2 py-1 rounded border border-line hover:bg-page disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
