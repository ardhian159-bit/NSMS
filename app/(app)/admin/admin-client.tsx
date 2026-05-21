'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Lead, TrackerEntry, AppSettings, Profile } from '@/lib/types'
import DeleteConfirmDialog from '@/components/admin/DeleteConfirmDialog'
import AdminTabUpdateFunnel from '@/components/admin/AdminTabUpdateFunnel'
import LeadManagementTab from '@/components/shared/LeadManagementTab'

interface AdminClientProps {
  leads: Lead[]
  trackers: TrackerEntry[]
  settings: AppSettings
  profile: Profile
}

const TABS = [
  { key: 'update', label: '🔄 Update Funnel' },
  { key: 'kelola', label: '🗂️ Kelola Lead' },
] as const

type TabKey = typeof TABS[number]['key']

export default function AdminClient({ leads, trackers, settings, profile }: AdminClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('update')
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null)

  const refetch = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A18]">Admin Panel</h1>
        <p className="text-sm text-[#A0A09A] mt-0.5">Kelola pipeline dan data funnel</p>
      </div>

      {/* Tab Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
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
        <AdminTabUpdateFunnel
          leads={leads}
          trackers={trackers}
          settings={settings}
          onUpdated={refetch}
        />
      )}

      {/* Tab: Kelola Lead */}
      {activeTab === 'kelola' && (
        <>
          <LeadManagementTab
            leads={leads}
            settings={settings}
            profile={profile}
            onRefetch={refetch}
            onDelete={setDeleteLead}
          />
          <DeleteConfirmDialog
            lead={deleteLead}
            open={!!deleteLead}
            onClose={() => setDeleteLead(null)}
            onDeleted={refetch}
          />
        </>
      )}
    </div>
  )
}
