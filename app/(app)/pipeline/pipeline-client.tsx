'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import type { Lead, TrackerEntry, AppSettings, Profile } from '@/lib/types'
import { getTrackerHistory } from '@/lib/dashboard/detail'
import { formatRupiahShort } from '@/lib/dashboard/formatters'
import LeadListItem from '@/components/pipeline/LeadListItem'
import UpdateForm from '@/components/pipeline/UpdateForm'
import LeadManagementTab from '@/components/shared/LeadManagementTab'

interface PipelineClientProps {
  leads: Lead[]
  trackers: TrackerEntry[]
  settings: AppSettings
  profile: Profile
}

const TABS = [
  { key: 'update', label: '🔄 Update Funnel' },
  { key: 'input', label: '📝 Input Lead' },
] as const

type TabKey = typeof TABS[number]['key']

export default function PipelineClient({ leads, trackers, settings, profile }: PipelineClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('update')
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterPicUpdate, setFilterPicUpdate] = useState('')

  const filteredLeads = useMemo(() => {
    let result = leads
    if (filterPicUpdate) result = result.filter((l) => l.ownerName === filterPicUpdate)
    if (!search) return result
    const s = search.toLowerCase()
    return result.filter(
      (l) =>
        l.namaPaket.toLowerCase().includes(s) ||
        l.funnelId.toLowerCase().includes(s) ||
        l.instansi.toLowerCase().includes(s)
    )
  }, [leads, search, filterPicUpdate])

  // KPI personal — ringkasan leads milik PIC ini
  const kpis = useMemo(() => {
    let totalNetto = 0, closingCount = 0, closingNetto = 0, hotCount = 0, gagalCount = 0
    leads.forEach((l) => {
      totalNetto += l.forecastNetto || 0
      if (l.tk === 100) { closingCount++; closingNetto += l.forecastNetto || 0 }
      else if (l.tk === 75) hotCount++
      else if (l.tk === 0) gagalCount++
    })
    return { totalNetto, closingCount, closingNetto, hotCount, gagalCount }
  }, [leads])

  const selectedLead = useMemo(
    () => (selectedFunnelId ? leads.find((l) => l.funnelId === selectedFunnelId) ?? null : null),
    [leads, selectedFunnelId]
  )

  const selectedHistory = useMemo(
    () => (selectedFunnelId ? getTrackerHistory(trackers, selectedFunnelId) : []),
    [trackers, selectedFunnelId]
  )

  const refetch = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-ink">
          Pipeline — {profile.picName || profile.username}
        </h1>
        <p className="text-sm text-ink-hint mt-0.5">{leads.length} paket aktif</p>
      </div>

      {/* KPI Strip — ringkasan personal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface rounded-lg border border-line p-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-hint">Total Netto</p>
          <p className="text-lg font-semibold text-ink mt-0.5 font-[family-name:var(--font-dm-mono)]">
            {formatRupiahShort(kpis.totalNetto)}
          </p>
        </div>
        <div className="bg-surface rounded-lg border border-line p-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-hint">Closing</p>
          <p className="text-lg font-semibold text-green-700 mt-0.5">
            {kpis.closingCount}
            <span className="text-[11px] font-normal text-ink-hint ml-1.5 font-[family-name:var(--font-dm-mono)]">
              {formatRupiahShort(kpis.closingNetto)}
            </span>
          </p>
        </div>
        <div className="bg-surface rounded-lg border border-line p-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-hint">Hot Prospek</p>
          <p className="text-lg font-semibold text-red-600 mt-0.5">{kpis.hotCount}</p>
        </div>
        <div className="bg-surface rounded-lg border border-line p-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-hint">Gagal</p>
          <p className="text-lg font-semibold text-ink-hint mt-0.5">{kpis.gagalCount}</p>
        </div>
      </div>

      {/* Tab Pills */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-accent-solid text-accent-on'
                : 'bg-surface text-ink-muted border border-line hover:bg-page'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Update Funnel */}
      {activeTab === 'update' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Project List */}
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-lg border border-line p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-ink-hint uppercase tracking-wider">
                  Daftar Project
                </h3>
                <span className="text-xs text-ink-hint">{filteredLeads.length}</span>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-hint" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari..."
                  className="form-input pl-9 text-sm"
                />
              </div>
              {profile.role !== 'sales' && (
                <select
                  value={filterPicUpdate}
                  onChange={(e) => setFilterPicUpdate(e.target.value)}
                  className="form-select text-sm w-full mb-3"
                >
                  <option value="">Semua PIC</option>
                  {settings.picNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}
              <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                {filteredLeads.length === 0 ? (
                  <p className="text-sm text-ink-hint text-center py-6">Tidak ada data</p>
                ) : (
                  filteredLeads.map((lead) => (
                    <LeadListItem
                      key={lead.funnelId}
                      lead={lead}
                      selected={selectedFunnelId === lead.funnelId}
                      onClick={() => setSelectedFunnelId(lead.funnelId)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Update Form */}
          <div className="lg:col-span-3">
            <UpdateForm
              lead={selectedLead}
              trackerHistory={selectedHistory}
              onUpdated={refetch}
            />
          </div>
        </div>
      )}

      {/* Tab: Input Lead */}
      {activeTab === 'input' && (
        <LeadManagementTab
          leads={leads}
          settings={settings}
          profile={profile}
          onRefetch={refetch}
        />
      )}
    </div>
  )
}
