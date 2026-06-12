'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload } from 'lucide-react'
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Admin Panel</h1>
          <p className="text-sm text-ink-hint mt-0.5">Kelola pipeline dan data funnel</p>
        </div>
        <Link
          href="/admin/bulk-import"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line bg-surface text-sm font-medium text-brand hover:bg-brand-soft hover:border-brand transition-colors flex-shrink-0"
        >
          <Upload className="w-4 h-4" />
          Import Massal
        </Link>
      </div>

      {/* Tab Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
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
