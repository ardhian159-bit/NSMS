'use client'

import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { TrackerEntry, Profile } from '@/lib/types'
import Badge from '@/components/dashboard/Badge'
import { formatRupiahShort, truncateText } from '@/lib/dashboard/formatters'
import { Pencil, Check, X, Search } from 'lucide-react'

interface MonitoringClientProps {
  trackers: TrackerEntry[]
  profile: Profile
}

const STATUS_TO_TK: Record<string, number> = {
  'Gagal': 0,
  'Informasi Awal': 5,
  'Informasi Kebutuhan': 10,
  'Presentasi': 25,
  'Peluang 50:50': 50,
  'Hot Prospek': 75,
  'Closing': 100,
}

function getQuarterFromWeek(weekLabel: string): string {
  const match = weekLabel.match(/W(\d+)-/)
  if (!match) return ''
  const w = parseInt(match[1])
  if (w <= 13) return 'Q1'
  if (w <= 26) return 'Q2'
  if (w <= 39) return 'Q3'
  return 'Q4'
}

export default function MonitoringClient({ trackers, profile }: MonitoringClientProps) {
  const [localTrackers, setLocalTrackers] = useState(trackers)

  const [search, setSearch] = useState('')
  const [filterPic, setFilterPic] = useState('ALL')
  const [filterWeek, setFilterWeek] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterQuarter, setFilterQuarter] = useState('ALL')
  const [sortCol, setSortCol] = useState<keyof TrackerEntry>('createdAt')
  const [sortAsc, setSortAsc] = useState(false)

  // Admin notes inline edit
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<TrackerEntry | null>(null)

  const isAdmin = profile.role === 'superadmin' || profile.role === 'admin'

  // Derived filter options
  const picOptions = useMemo(
    () => ['ALL', ...Array.from(new Set(localTrackers.map((t) => t.pic).filter(Boolean))).sort()],
    [localTrackers]
  )
  const weekOptions = useMemo(
    () => ['ALL', ...Array.from(new Set(localTrackers.map((t) => t.week).filter(Boolean))).sort().reverse()],
    [localTrackers]
  )
  const statusOptions = useMemo(
    () => ['ALL', ...Array.from(new Set(localTrackers.map((t) => t.statusBaru).filter(Boolean))).sort()],
    [localTrackers]
  )

  // Filtered + sorted
  const filtered = useMemo(() => {
    const data = localTrackers.filter((t) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q || t.funnelId.toLowerCase().includes(q) || t.namaPaket.toLowerCase().includes(q)
      const matchPic = filterPic === 'ALL' || t.pic === filterPic
      const matchWeek = filterWeek === 'ALL' || t.week === filterWeek
      const matchStatus = filterStatus === 'ALL' || t.statusBaru === filterStatus
      const matchQuarter = filterQuarter === 'ALL' || getQuarterFromWeek(t.week) === filterQuarter
      return matchSearch && matchPic && matchWeek && matchStatus && matchQuarter
    })

    data.sort((a, b) => {
      const av = a[sortCol] ?? ''
      const bv = b[sortCol] ?? ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortAsc ? cmp : -cmp
    })

    return data
  }, [localTrackers, search, filterPic, filterWeek, filterStatus, filterQuarter, sortCol, sortAsc])

  // Sort handler
  const handleSort = (col: keyof TrackerEntry) => {
    if (sortCol === col) setSortAsc(!sortAsc)
    else {
      setSortCol(col)
      setSortAsc(true)
    }
  }

  const SortIcon = ({ col }: { col: keyof TrackerEntry }) => {
    if (sortCol !== col) return <span className="text-[#A0A09A]">↕</span>
    return <span>{sortAsc ? '↑' : '↓'}</span>
  }

  // Admin notes save
  const handleSaveNotes = async (id: number) => {
    setSavingId(id)
    await supabase.from('tracker').update({ admin_notes: editNotes }).eq('id', id)
    setLocalTrackers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, adminNotes: editNotes } : t))
    )
    setSavingId(null)
    setEditingId(null)
  }



  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A18]">Monitoring</h1>
        <p className="text-sm text-[#A0A09A] mt-0.5">Pantau update mingguan semua PIC</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-[#EBEBE7] p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A09A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari funnel ID / paket..."
              className="form-input pl-9"
            />
          </div>
          <select
            value={filterQuarter}
            onChange={(e) => setFilterQuarter(e.target.value)}
            className="form-select"
          >
            <option value="ALL">Semua Quarter</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
          </select>
          <select
            value={filterPic}
            onChange={(e) => setFilterPic(e.target.value)}
            className="form-select"
          >
            {picOptions.map((p) => (
              <option key={p} value={p}>
                {p === 'ALL' ? 'Semua PIC' : p}
              </option>
            ))}
          </select>
          <select
            value={filterWeek}
            onChange={(e) => setFilterWeek(e.target.value)}
            className="form-select"
          >
            {weekOptions.map((w) => (
              <option key={w} value={w}>
                {w === 'ALL' ? 'Semua Week' : w}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-select"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'Semua Status' : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-[#EBEBE7] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#A0A09A] uppercase tracking-wider bg-[#FAFAF8] border-b border-[#EBEBE7]">
              <tr>
                <th
                  className="px-3 py-3 font-medium cursor-pointer hover:text-[#1A1A18] transition-colors"
                  onClick={() => handleSort('week')}
                >
                  <span className="flex items-center gap-1">
                    Week <SortIcon col="week" />
                  </span>
                </th>
                <th
                  className="px-3 py-3 font-medium cursor-pointer hover:text-[#1A1A18] transition-colors"
                  onClick={() => handleSort('funnelId')}
                >
                  <span className="flex items-center gap-1">
                    Funnel ID <SortIcon col="funnelId" />
                  </span>
                </th>
                <th
                  className="px-3 py-3 font-medium cursor-pointer hover:text-[#1A1A18] transition-colors"
                  onClick={() => handleSort('pic')}
                >
                  <span className="flex items-center gap-1">
                    PIC <SortIcon col="pic" />
                  </span>
                </th>
                <th className="px-3 py-3 font-medium">Nama Paket</th>
                <th
                  className="px-3 py-3 font-medium cursor-pointer hover:text-[#1A1A18] transition-colors"
                  onClick={() => handleSort('statusBaru')}
                >
                  <span className="flex items-center gap-1">
                    Status <SortIcon col="statusBaru" />
                  </span>
                </th>
                <th
                  className="px-3 py-3 font-medium text-right cursor-pointer hover:text-[#1A1A18] transition-colors"
                  onClick={() => handleSort('forecastNetto')}
                >
                  <span className="flex items-center justify-end gap-1">
                    Netto <SortIcon col="forecastNetto" />
                  </span>
                </th>
                <th className="px-3 py-3 font-medium">Notes</th>
                <th className="px-3 py-3 font-medium">Admin Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBE7]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[#A0A09A]">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAFAF8] transition-colors group cursor-pointer" onClick={() => setSelectedEntry(t)}>
                    <td className="px-3 py-3 font-[family-name:var(--font-dm-mono)] text-xs text-[#1A1A18] whitespace-nowrap">
                      {t.week}
                    </td>
                    <td className="px-3 py-3 font-[family-name:var(--font-dm-mono)] text-xs text-[#A0A09A] whitespace-nowrap">
                      {t.funnelId}
                    </td>
                    <td className="px-3 py-3 text-[#1A1A18] font-medium whitespace-nowrap">
                      {t.pic}
                    </td>
                    <td className="px-3 py-3 text-[#1A1A18]" title={t.namaPaket}>
                      {truncateText(t.namaPaket, 30)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tk={STATUS_TO_TK[t.statusBaru] ?? 0} />
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-[#1A1A18]">
                      {formatRupiahShort(t.forecastNetto)}
                    </td>
                    <td className="px-3 py-3 text-[#6B6B65] max-w-[150px] truncate" title={t.notes}>
                      {t.notes || '-'}
                    </td>
                    <td className="px-3 py-3 min-w-[180px]">
                      {isAdmin ? (
                        editingId === t.id ? (
                          <div className="flex items-center gap-1">
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              rows={2}
                              className="form-input text-xs resize-none flex-1"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveNotes(t.id)}
                              disabled={savingId === t.id}
                              className="p-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span
                              className="text-[#6B6B65] truncate max-w-[130px]"
                              title={t.adminNotes}
                            >
                              {t.adminNotes || '-'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingId(t.id)
                                setEditNotes(t.adminNotes)
                              }}
                              className="p-1 rounded-md text-[#A0A09A] hover:text-[#1A1A18] hover:bg-[#F5F5F2] opacity-0 group-hover:opacity-100 transition-all"
                              title="Edit admin notes"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      ) : (
                        <span className="text-[#6B6B65] truncate max-w-[150px]" title={t.adminNotes}>
                          {t.adminNotes || '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Modal */}
        {selectedEntry && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            onClick={() => setSelectedEntry(null)}
          >
            <div
              className="bg-white rounded-xl border border-[#EBEBE7] shadow-lg w-full max-w-lg mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-[10px] font-[family-name:var(--font-dm-mono)] text-[#A0A09A]">
                    {selectedEntry.funnelId}
                  </span>
                  <h3 className="text-base font-semibold text-[#1A1A18] mt-0.5">
                    {selectedEntry.namaPaket}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-1.5 rounded-md text-[#A0A09A] hover:text-[#1A1A18] hover:bg-[#F5F5F2]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div>
                  <span className="text-[10px] text-[#A0A09A] uppercase tracking-wider">PIC</span>
                  <p className="text-[#1A1A18] font-medium">{selectedEntry.pic}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#A0A09A] uppercase tracking-wider">Week</span>
                  <p className="font-[family-name:var(--font-dm-mono)] text-[#1A1A18]">{selectedEntry.week}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#A0A09A] uppercase tracking-wider">Status</span>
                  <div className="mt-0.5">
                    <Badge tk={STATUS_TO_TK[selectedEntry.statusBaru] ?? 0} />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#A0A09A] uppercase tracking-wider">Forecast Netto</span>
                  <p className="text-[#1A1A18] font-semibold">{formatRupiahShort(selectedEntry.forecastNetto)}</p>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-3">
                <span className="text-[10px] text-[#A0A09A] uppercase tracking-wider">Notes</span>
                <p className="mt-1 text-sm text-[#6B6B65] whitespace-pre-wrap">
                  {selectedEntry.notes || '-'}
                </p>
              </div>

              {/* Admin Notes */}
              <div>
                <span className="text-[10px] text-[#A0A09A] uppercase tracking-wider">Admin Notes</span>
                <p className="mt-1 text-sm text-[#6B6B65] whitespace-pre-wrap">
                  {selectedEntry.adminNotes || '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#EBEBE7] bg-[#FAFAF8]">
          <p className="text-xs text-[#A0A09A]">
            Menampilkan {filtered.length} dari {localTrackers.length} entri
          </p>
        </div>
      </div>
    </div>
  )
}
