'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Lead, AppSettings, Profile } from '@/lib/types'
import InputLeadForm from '@/components/shared/InputLeadForm'
import AdminLeadTable from '@/components/admin/AdminLeadTable'
import EditLeadModal from '@/components/admin/EditLeadModal'
import DeleteConfirmDialog from '@/components/admin/DeleteConfirmDialog'

interface AdminClientProps {
  leads: Lead[]
  settings: AppSettings
  profile: Profile
}

const TABS = [
  { key: 'input', label: 'Input Lead' },
  { key: 'kelola', label: 'Kelola Lead' },
] as const

type TabKey = typeof TABS[number]['key']

export default function AdminClient({ leads, settings, profile }: AdminClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('input')
  const [editLead, setEditLead] = useState<Lead | null>(null)
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

      {/* Tab Content */}
      {activeTab === 'input' && (
        <InputLeadForm
          picOptions={settings.picNames}
          settings={settings}
          profile={profile}
          onSuccess={refetch}
        />
      )}

      {activeTab === 'kelola' && (
        <>
          <AdminLeadTable
            leads={leads}
            onEdit={setEditLead}
            onDelete={setDeleteLead}
          />

          <EditLeadModal
            lead={editLead}
            open={!!editLead}
            onClose={() => setEditLead(null)}
            onSaved={refetch}
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
