'use client'

import { useState, useMemo, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { TrackerEntry, Profile } from '@/lib/types'
import Badge from '@/components/dashboard/Badge'
import { formatRupiahShort, truncateText } from '@/lib/dashboard/formatters'
import { getISOWeekInfo } from '@/lib/dashboard/week'
import { weekRank } from '@/lib/dashboard/detail'
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

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => { setPage(0) }, [search, filterPic, filterWeek, filterStatus, filterQuarter])

  const [selectedEntry, setSelectedEntry] = useState<TrackerEntry | null>(null)
  const [editingNotes, setEditingNotes] = useState(false)
  const [draftNotes, setDraftNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const isAdmin = profile.role === 'superadmin' || profile.role === 'admin'

  const [activeTab, setActiveTab] = useState<'detail' | 'history'>('detail')
  const [nettoLog, setNettoLog] = useState<{
    id: number
    old_netto: number
    new_netto: number
    changed_at: string
    changed_by: string
    changedByName: string
  }[]>([])
  const [loadingLog, setLoadingLog] = useState(false)

  useEffect(() => {
    if (!selectedEntry) return
    setActiveTab('detail')
    setNettoLog([])
    setLoadingLog(true)

    supabase
      .from('leads_netto_log')
      .select('id, old_netto, new_netto, changed_at, changed_by')
      .eq('funnel_id', selectedEntry.funnelId)
      .order('changed_at', { ascending: false })
      .then(async ({ data }) => {
        if (!data || data.length === 0) {
          setNettoLog([])
          setLoadingLog(false)
          return
        }
        const uids = [...new Set(data.map((d) => d.changed_by).filter(Boolean))]
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, pic_name')
          .in('id', uids)
        const nameMap: Record<string, string> = {}
        profilesData?.forEach((p) => { nameMap[p.id] = p.pic_name })

        setNettoLog(
          data.map((d) => ({
            ...d,
            changedByName: nameMap[d.changed_by] ?? 'Unknown',
          }))
        )
        setLoadingLog(false)
      })
  }, [selectedEntry])

  // Derived filter options
  const picOptions = useMemo(
    () => ['ALL', ...Array.from(new Set(localTrackers.map((t) => t.pic).filter(Boolean))).sort()],
    [localTrackers]
  )
  const weekOptions = useMemo(
    () => ['ALL', ...Array.from(new Set(localTrackers.map((t) => t.week).filter(Boolean))).sort((a, b) => weekRank(b) - weekRank(a))],
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

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize)

  // Sort handler
  const handleSort = (col: keyof TrackerEntry) => {
    if (sortCol === col) setSortAsc(!sortAsc)
    else {
      setSortCol(col)
      setSortAsc(true)
    }
  }

  const SortIcon = ({ col }: { col: keyof TrackerEntry }) => {
    if (sortCol !== col) return <span className="text-ink-hint">↕</span>
    return <span>{sortAsc ? '↑' : '↓'}</span>
  }

  const handleSaveAdminNotes = async () => {
    if (!selectedEntry) return
    setSavingNotes(true)
    await supabase
      .from('tracker')
      .update({ admin_notes: draftNotes })
      .eq('id', selectedEntry.id)
    setLocalTrackers((prev) =>
      prev.map((t) => t.id === selectedEntry.id ? { ...t, adminNotes: draftNotes } : t)
    )
    setSelectedEntry((prev) => prev ? { ...prev, adminNotes: draftNotes } : prev)
    setSavingNotes(false)
    setEditingNotes(false)
  }



  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      {(() => {
        const { week, year, dateLabel } = getISOWeekInfo()
        return (
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-ink">Monitoring</h1>
              <span className="text-xs font-[family-name:var(--font-dm-mono)] bg-brand-soft text-brand border border-brand-soft rounded-full px-2 py-0.5">W{week} · {year}</span>
            </div>
            <p className="text-sm text-ink-hint mt-0.5">Pantau update mingguan semua PIC</p>
            <p className="text-xs text-ink-muted mt-0.5">{dateLabel}</p>
          </div>
        )
      })()}

      {/* Filter Bar */}
      <div className="bg-surface rounded-lg border border-line p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-hint" />
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
      <div className="bg-surface rounded-lg border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-ink-hint uppercase tracking-wider bg-surface-alt border-b border-line">
              <tr>
                <th
                  className="px-3 py-3 font-medium cursor-pointer hover:text-ink transition-colors"
                  onClick={() => handleSort('week')}
                >
                  <span className="flex items-center gap-1">
                    Week <SortIcon col="week" />
                  </span>
                </th>
                <th
                  className="px-3 py-3 font-medium cursor-pointer hover:text-ink transition-colors"
                  onClick={() => handleSort('funnelId')}
                >
                  <span className="flex items-center gap-1">
                    Funnel ID <SortIcon col="funnelId" />
                  </span>
                </th>
                <th
                  className="px-3 py-3 font-medium cursor-pointer hover:text-ink transition-colors"
                  onClick={() => handleSort('pic')}
                >
                  <span className="flex items-center gap-1">
                    PIC <SortIcon col="pic" />
                  </span>
                </th>
                <th className="px-3 py-3 font-medium">Nama Paket</th>
                <th
                  className="px-3 py-3 font-medium cursor-pointer hover:text-ink transition-colors"
                  onClick={() => handleSort('statusBaru')}
                >
                  <span className="flex items-center gap-1">
                    Status <SortIcon col="statusBaru" />
                  </span>
                </th>
                <th
                  className="px-3 py-3 font-medium text-right cursor-pointer hover:text-ink transition-colors"
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
            <tbody className="divide-y divide-line">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-ink-hint">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                paginated.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-alt transition-colors group cursor-pointer" onClick={() => setSelectedEntry(t)}>
                    <td className="px-3 py-3 font-[family-name:var(--font-dm-mono)] text-xs text-ink whitespace-nowrap">
                      {t.week}
                    </td>
                    <td className="px-3 py-3 font-[family-name:var(--font-dm-mono)] text-xs text-ink-hint whitespace-nowrap">
                      {t.funnelId}
                    </td>
                    <td className="px-3 py-3 text-ink font-medium whitespace-nowrap">
                      {t.pic}
                    </td>
                    <td className="px-3 py-3 text-ink" title={t.namaPaket}>
                      {truncateText(t.namaPaket, 30)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tk={STATUS_TO_TK[t.statusBaru] ?? 0} />
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-ink">
                      {formatRupiahShort(t.forecastNetto)}
                    </td>
                    <td className="px-3 py-3 text-ink-muted max-w-[150px] truncate" title={t.notes}>
                      {t.notes || '-'}
                    </td>
                    <td className="px-3 py-3 min-w-[180px]">
                      <span className="text-ink-muted truncate max-w-[150px]" title={t.adminNotes}>
                        {t.adminNotes || '-'}
                      </span>
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
            onClick={() => { setSelectedEntry(null); setEditingNotes(false) }}
          >
            <div
              className="bg-surface rounded-xl border border-line shadow-lg w-full max-w-lg mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-[10px] font-[family-name:var(--font-dm-mono)] text-ink-hint">
                    {selectedEntry.funnelId}
                  </span>
                  <h3 className="text-base font-semibold text-ink mt-0.5">
                    {selectedEntry.namaPaket}
                  </h3>
                </div>
                <button
                  onClick={() => { setSelectedEntry(null); setEditingNotes(false) }}
                  className="p-1.5 rounded-md text-ink-hint hover:text-ink hover:bg-page"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Bar */}
              <div className="flex gap-1 mb-4 border-b border-line">
                {(['detail', 'history'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeTab === tab
                        ? 'text-brand border-b-2 border-brand -mb-px'
                        : 'text-ink-hint hover:text-ink-muted'
                    }`}
                  >
                    {tab === 'detail' ? 'Detail' : 'Netto History'}
                  </button>
                ))}
              </div>

              {/* Detail Tab */}
              {activeTab === 'detail' && (
                <div className="space-y-4">
                  {/* Meta grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-[10px] text-ink-hint uppercase tracking-wider">PIC</span>
                      <p className="text-ink font-medium">{selectedEntry.pic}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-hint uppercase tracking-wider">Week</span>
                      <p className="font-[family-name:var(--font-dm-mono)] text-ink">{selectedEntry.week}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-hint uppercase tracking-wider">Status</span>
                      <div className="mt-0.5">
                        <Badge tk={STATUS_TO_TK[selectedEntry.statusBaru] ?? 0} />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-hint uppercase tracking-wider">Forecast Netto</span>
                      <p className="text-ink font-semibold">{formatRupiahShort(selectedEntry.forecastNetto)}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <span className="text-[10px] text-ink-hint uppercase tracking-wider">Notes</span>
                    <p className="mt-1 text-sm text-ink-muted whitespace-pre-wrap">
                      {selectedEntry.notes || '-'}
                    </p>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-ink-hint uppercase tracking-wider">Admin Notes</span>
                      {isAdmin && !editingNotes && (
                        <button
                          onClick={() => { setDraftNotes(selectedEntry.adminNotes || ''); setEditingNotes(true) }}
                          className="p-1 rounded text-ink-hint hover:text-ink hover:bg-page transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {editingNotes ? (
                      <div className="space-y-2">
                        <textarea
                          value={draftNotes}
                          onChange={(e) => setDraftNotes(e.target.value)}
                          rows={4}
                          className="form-input text-sm resize-none w-full"
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingNotes(false)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-line text-ink-muted hover:bg-page transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleSaveAdminNotes}
                            disabled={savingNotes}
                            className="px-3 py-1.5 text-xs rounded-lg bg-brand-solid text-white hover:bg-brand-solid-hover transition-colors disabled:opacity-50"
                          >
                            {savingNotes ? 'Menyimpan...' : 'Simpan'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-ink-muted whitespace-pre-wrap">
                        {selectedEntry.adminNotes || '-'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {loadingLog ? (
                    <p className="text-xs text-ink-hint text-center py-6">Memuat...</p>
                  ) : nettoLog.length === 0 ? (
                    <p className="text-xs text-ink-hint text-center py-6">
                      Belum ada perubahan netto tercatat.
                    </p>
                  ) : (
                    nettoLog.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 bg-surface-alt rounded-lg border border-line"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-ink-hint line-through">
                              {formatRupiahShort(log.old_netto)}
                            </span>
                            <span className="text-ink-hint">→</span>
                            <span className="font-semibold text-brand">
                              {formatRupiahShort(log.new_netto)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-ink-hint">
                              {log.changedByName}
                            </span>
                            <span className="text-[10px] text-ink-hint">·</span>
                            <span className="text-[10px] font-[family-name:var(--font-dm-mono)] text-ink-hint">
                              {new Date(log.changed_at).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-line bg-surface-alt flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ink-hint">
            Menampilkan {filtered.length === 0 ? 0 : page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} dari {filtered.length} entri
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-hint">Per halaman</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}
                className="text-xs border border-line rounded-md px-2 py-1 bg-surface text-ink focus:outline-none"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="px-2 py-1 text-xs rounded-md border border-line text-ink-muted hover:bg-page disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >«</button>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2 py-1 text-xs rounded-md border border-line text-ink-muted hover:bg-page disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >‹</button>
              <span className="px-3 py-1 text-xs text-ink">
                {page + 1} / {Math.max(1, totalPages)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-2 py-1 text-xs rounded-md border border-line text-ink-muted hover:bg-page disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >›</button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className="px-2 py-1 text-xs rounded-md border border-line text-ink-muted hover:bg-page disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >»</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
