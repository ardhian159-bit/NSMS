'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, Lead } from '@/lib/types'
import Badge from '@/components/dashboard/Badge'
import { formatRupiahShort } from '@/lib/dashboard/formatters'
import { Pencil, Check, X, Unlock } from 'lucide-react'

interface SettingItem {
  id: number
  category: string
  value: string
  sortOrder: number
}

interface ControlClientProps {
  currentProfile: Profile
  profiles: Profile[]
  settingsRaw: SettingItem[]
  lockedLeads: Lead[]
}

type Tab = 'users' | 'settings' | 'unlock'

const TABS: { key: Tab; label: string }[] = [
  { key: 'users', label: 'Users' },
  { key: 'settings', label: 'Dropdown Settings' },
  { key: 'unlock', label: 'Unlock Lead' },
]

const ROLE_OPTIONS = ['superadmin', 'admin', 'sales', 'guest', 'mp', 'sp', 'am', 'dirut']

const CATEGORIES = [
  { key: 'picNames', label: 'PIC Names' },
  { key: 'principals', label: 'Principals' },
  { key: 'sumberDana', label: 'Sumber Dana' },
  { key: 'jenisProduk', label: 'Jenis Produk' },
]

export default function ControlClient({
  profiles,
  settingsRaw,
  lockedLeads,
}: ControlClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('users')

  // === TAB 1: Users ===
  const [localProfiles, setLocalProfiles] = useState(profiles)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editPicName, setEditPicName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSaveProfile = async (id: string) => {
    setSaving(true)
    await supabase
      .from('profiles')
      .update({
        role: editRole,
        pic_name: editPicName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    setLocalProfiles((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, role: editRole as Profile['role'], picName: editPicName } : p
      )
    )
    setEditingId(null)
    setSaving(false)
  }

  // === TAB 2: Settings ===
  const [localSettings, setLocalSettings] = useState(settingsRaw)
  const [activeCategory, setActiveCategory] = useState('picNames')
  const [newValue, setNewValue] = useState('')
  const [addingCategory, setAddingCategory] = useState<string | null>(null)

  const categoryItems = localSettings.filter((s) => s.category === activeCategory)

  const handleAddItem = async (category: string, value: string) => {
    if (!value.trim()) return
    const maxOrder = localSettings.filter((s) => s.category === category).length
    const { data, error } = await supabase
      .from('settings')
      .insert({ category, value: value.trim(), sort_order: maxOrder + 1 })
      .select()
      .single()
    if (!error && data) {
      setLocalSettings((prev) => [
        ...prev,
        { id: data.id, category, value: value.trim(), sortOrder: maxOrder + 1 },
      ])
    }
    setNewValue('')
    setAddingCategory(null)
  }

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Hapus item ini?')) return
    await supabase.from('settings').delete().eq('id', id)
    setLocalSettings((prev) => prev.filter((s) => s.id !== id))
  }

  // === TAB 3: Unlock ===
  const [localLocked, setLocalLocked] = useState(lockedLeads)
  const [unlocking, setUnlocking] = useState<number | null>(null)

  const handleUnlock = async (lead: Lead) => {
    if (!confirm(`Unlock lead ${lead.funnelId}? Status akan direset ke Hot Prospek (75%)`)) return
    setUnlocking(lead.id)
    await supabase
      .from('leads')
      .update({
        tk: 75,
        status: 'Hot Prospek',
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead.id)
    setLocalLocked((prev) => prev.filter((l) => l.id !== lead.id))
    setUnlocking(null)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A18]">Control Panel</h1>
        <p className="text-sm text-[#A0A09A] mt-0.5">Superadmin — Kelola sistem</p>
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
                : 'text-[#6B6B65] hover:bg-[#F5F5F2]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===================== TAB 1: USERS ===================== */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg border border-[#EBEBE7] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[#A0A09A] uppercase tracking-wider bg-[#FAFAF8] border-b border-[#EBEBE7]">
                <tr>
                  <th className="px-4 py-3 font-medium">PIC Name</th>
                  <th className="px-4 py-3 font-medium">Username</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Branch</th>
                  <th className="px-4 py-3 font-medium w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBE7]">
                {localProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAFAF8] transition-colors">
                    {editingId === p.id ? (
                      <>
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            value={editPicName}
                            onChange={(e) => setEditPicName(e.target.value)}
                            className="form-input text-sm"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-[#6B6B65]">{p.username}</td>
                        <td className="px-4 py-2.5">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="form-select text-sm"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2.5 text-[#6B6B65]">{p.branch || '-'}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveProfile(p.id)}
                              disabled={saving}
                              className="p-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors"
                              title="Simpan"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-[#1A1A18] font-medium">{p.picName || '-'}</td>
                        <td className="px-4 py-3 text-[#6B6B65]">{p.username}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5F5F2] text-[#6B6B65] font-medium">
                            {p.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#6B6B65]">{p.branch || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setEditingId(p.id)
                              setEditRole(p.role)
                              setEditPicName(p.picName)
                            }}
                            className="p-1.5 rounded-md text-[#A0A09A] hover:text-[#1A1A18] hover:bg-[#F5F5F2] transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#EBEBE7] bg-[#FAFAF8]">
            <p className="text-xs text-[#A0A09A]">
              Untuk menambah atau menghapus user, gunakan Supabase Dashboard
            </p>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: SETTINGS ===================== */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg border border-[#EBEBE7] p-5">
          {/* Category sub-tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === cat.key
                    ? 'bg-[#1A1A18] text-white'
                    : 'bg-[#F5F5F2] text-[#6B6B65] hover:bg-[#EBEBE7]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Items list */}
          <div className="space-y-1.5 mb-4">
            {categoryItems.length === 0 ? (
              <p className="text-sm text-[#A0A09A] py-4 text-center">Belum ada item</p>
            ) : (
              categoryItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#FAFAF8] group"
                >
                  <span className="text-sm text-[#1A1A18]">{item.value}</span>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 rounded text-[#A0A09A] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    title="Hapus"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add new */}
          {addingCategory === activeCategory ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Nilai baru..."
                className="form-input flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem(activeCategory, newValue)
                  if (e.key === 'Escape') setAddingCategory(null)
                }}
              />
              <button
                onClick={() => handleAddItem(activeCategory, newValue)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#1A1A18] hover:bg-[#2A2A28] transition-colors"
              >
                Tambah
              </button>
              <button
                onClick={() => {
                  setAddingCategory(null)
                  setNewValue('')
                }}
                className="px-3 py-2 rounded-lg text-sm text-[#6B6B65] bg-[#F5F5F2] hover:bg-[#EBEBE7] transition-colors"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingCategory(activeCategory)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#6B6B65] bg-[#F5F5F2] hover:bg-[#EBEBE7] border border-[#EBEBE7] transition-colors"
            >
              + Tambah Item
            </button>
          )}
        </div>
      )}

      {/* ===================== TAB 3: UNLOCK ===================== */}
      {activeTab === 'unlock' && (
        <div className="bg-white rounded-lg border border-[#EBEBE7] overflow-hidden">
          {localLocked.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F5F5F2] flex items-center justify-center mb-4">
                <Unlock className="w-6 h-6 text-[#A0A09A]" />
              </div>
              <p className="font-semibold text-[#1A1A18]">Tidak ada lead yang terkunci</p>
              <p className="text-sm text-[#A0A09A] mt-1">Semua lead aktif dan dapat diupdate</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#A0A09A] uppercase tracking-wider bg-[#FAFAF8] border-b border-[#EBEBE7]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Funnel ID</th>
                    <th className="px-4 py-3 font-medium">Nama Paket</th>
                    <th className="px-4 py-3 font-medium">PIC</th>
                    <th className="px-4 py-3 font-medium text-center">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Netto</th>
                    <th className="px-4 py-3 font-medium text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEBE7]">
                  {localLocked.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="px-4 py-3 font-[family-name:var(--font-dm-mono)] text-xs text-[#A0A09A]">
                        {lead.funnelId}
                      </td>
                      <td className="px-4 py-3 text-[#1A1A18]">{lead.namaPaket || '-'}</td>
                      <td className="px-4 py-3 text-[#6B6B65] font-medium">{lead.ownerName}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge tk={lead.tk} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#1A1A18]">
                        {formatRupiahShort(lead.forecastNetto)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleUnlock(lead)}
                          disabled={unlocking === lead.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 disabled:opacity-50 transition-colors"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          {unlocking === lead.id ? 'Unlocking...' : 'Unlock'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {localLocked.length > 0 && (
            <div className="px-4 py-3 border-t border-[#EBEBE7] bg-[#FAFAF8]">
              <p className="text-xs text-[#A0A09A]">
                {localLocked.length} lead terkunci (Closing / Gagal)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
