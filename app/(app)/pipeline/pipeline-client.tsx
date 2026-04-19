'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Pencil } from 'lucide-react'
import type { Lead, TrackerEntry, AppSettings, Profile } from '@/lib/types'
import { getTrackerHistory } from '@/lib/dashboard/detail'
import LeadListItem from '@/components/pipeline/LeadListItem'
import UpdateForm from '@/components/pipeline/UpdateForm'
import InputLeadForm from '@/components/shared/InputLeadForm'
import Badge from '@/components/dashboard/Badge'
import { formatRupiahShort } from '@/lib/dashboard/formatters'

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
  const [editingLead, setEditingLead] = useState<Lead | null>(null)

  const filteredLeads = useMemo(() => {
    if (!search) return leads
    const s = search.toLowerCase()
    return leads.filter(
      (l) =>
        l.namaPaket.toLowerCase().includes(s) ||
        l.funnelId.toLowerCase().includes(s) ||
        l.instansi.toLowerCase().includes(s)
    )
  }, [leads, search])

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
        <h1 className="text-xl font-semibold text-[#1A1A18]">
          Pipeline — {profile.picName || profile.username}
        </h1>
        <p className="text-sm text-[#A0A09A] mt-0.5">{leads.length} paket aktif</p>
      </div>

      {/* Tab Pills */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-[#1A1A18] text-white'
                : 'bg-white text-[#6B6B65] border border-[#EBEBE7] hover:bg-[#F5F5F2]'
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
            <div className="bg-white rounded-lg border border-[#EBEBE7] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-[#A0A09A] uppercase tracking-wider">
                  Daftar Project
                </h3>
                <span className="text-xs text-[#A0A09A]">{filteredLeads.length}</span>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A09A]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari..."
                  className="form-input pl-9 text-sm"
                />
              </div>
              <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                {filteredLeads.length === 0 ? (
                  <p className="text-sm text-[#A0A09A] text-center py-6">Tidak ada data</p>
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
        <div className="space-y-6">
          <InputLeadForm
            defaultOwnerName={profile.picName}
            settings={settings}
            onSuccess={() => { setEditingLead(null); refetch() }}
            editLead={editingLead}
            onCancelEdit={() => setEditingLead(null)}
          />

          {/* Tabel leads untuk edit */}
          <div className="bg-white rounded-lg border border-[#EBEBE7] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#EBEBE7] bg-[#FAFAF8]">
              <h3 className="text-xs font-semibold text-[#A0A09A] uppercase tracking-wider">
                Daftar Lead — {leads.length} paket
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#A0A09A] uppercase tracking-wider bg-[#FAFAF8] border-b border-[#EBEBE7]">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Funnel ID</th>
                    <th className="px-3 py-2.5 font-medium">Nama Paket</th>
                    <th className="px-3 py-2.5 font-medium text-center">Status</th>
                    <th className="px-3 py-2.5 font-medium text-right">Netto</th>
                    <th className="px-3 py-2.5 font-medium text-center w-16">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEBE7]">
                  {leads.map((lead) => {
                    const isLocked = lead.tk === 100 || lead.tk === 0
                    const isEditing = editingLead?.id === lead.id
                    return (
                      <tr
                        key={lead.id}
                        className={`transition-colors ${
                          isEditing
                            ? 'bg-green-50 border-l-2 border-l-[#064E3B]'
                            : 'hover:bg-[#FAFAF8]'
                        }`}
                      >
                        <td className="px-3 py-2.5 font-[family-name:var(--font-dm-mono)] text-xs text-[#A0A09A]">
                          {lead.funnelId}
                          {isLocked && (
                            <span className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              TERKUNCI
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-[#1A1A18]">{lead.namaPaket || '-'}</td>
                        <td className="px-3 py-2.5 text-center"><Badge tk={lead.tk} /></td>
                        <td className="px-3 py-2.5 text-right font-semibold text-[#1A1A18]">
                          {formatRupiahShort(lead.forecastNetto)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {!isLocked && (
                            <button
                              onClick={() => {
                                setEditingLead(lead)
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }}
                              className="p-1.5 rounded-md text-[#A0A09A] hover:text-[#1A1A18] hover:bg-[#F5F5F2] transition-colors"
                              title="Edit lead ini"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
