'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, Lead } from '@/lib/types'
import type { CompanyTarget } from '@/lib/api'
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
  companyTargets: CompanyTarget[]
}

type Tab = 'users' | 'settings' | 'unlock' | 'targets'

const TABS: { key: Tab; label: string }[] = [
  { key: 'users', label: 'Users' },
  { key: 'settings', label: 'Dropdown Settings' },
  { key: 'unlock', label: 'Unlock Lead' },
  { key: 'targets', label: 'Quarter Target' },
]

const ROLE_OPTIONS = ['superadmin', 'admin', 'sales', 'guest', 'mp', 'sp', 'am', 'dirut']

const CATEGORIES = [
  { key: 'picNames', label: 'PIC Names' },
  { key: 'principals', label: 'Principals' },
  { key: 'sumberDana', label: 'Sumber Dana' },
  { key: 'jenisProduk', label: 'Jenis Produk' },
  { key: 'ketPenggarap', label: 'Ket Penggarap' },
]

export default function ControlClient({
  profiles,
  settingsRaw,
  lockedLeads,
  companyTargets,
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

  // Add User
  const [showAddUser, setShowAddUser] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPicName, setNewPicName] = useState('')
  const [newRole, setNewRole] = useState('sales')
  const [newBranch, setNewBranch] = useState('')
  const [addingUser, setAddingUser] = useState(false)
  const [addUserError, setAddUserError] = useState('')

  const handleAddUser = async () => {
    setAddingUser(true)
    setAddUserError('')
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newEmail,
        password: newPassword,
        picName: newPicName,
        role: newRole,
        branch: newBranch,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setAddUserError(json.error ?? 'Terjadi kesalahan')
      setAddingUser(false)
      return
    }
    setLocalProfiles((prev) => [
      ...prev,
      {
        id: json.userId,
        username: newEmail,
        picName: newPicName,
        role: newRole as Profile['role'],
        branch: newBranch || null,
      } as Profile,
    ])
    setShowAddUser(false)
    setNewEmail('')
    setNewPassword('')
    setNewPicName('')
    setNewRole('sales')
    setNewBranch('')
    setAddingUser(false)
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

  // === TAB 4: Quarter Target ===
  const currentYear = new Date().getFullYear()
  const [localTargets, setLocalTargets] = useState(companyTargets)
  const [editingTarget, setEditingTarget] = useState<string | null>(null)
  const [editBruto, setEditBruto] = useState('')
  const [editNetto, setEditNetto] = useState('')
  const [savingTarget, setSavingTarget] = useState(false)

  const handleSaveTarget = async (id: number) => {
    setSavingTarget(true)
    const bruto = parseFloat(editBruto.replace(/\./g, '').replace(',', '.'))
    const netto = parseFloat(editNetto.replace(/\./g, '').replace(',', '.'))
    await supabase
      .from('company_targets')
      .update({
        target_bruto: bruto,
        target_netto: netto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    setLocalTargets((prev) =>
      prev.map((t) => t.id === id ? { ...t, targetBruto: bruto, targetNetto: netto } : t)
    )
    setEditingTarget(null)
    setSavingTarget(false)
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
          <div className="px-4 py-3 border-t border-[#EBEBE7] bg-[#FAFAF8] flex items-center justify-between">
            <p className="text-xs text-[#A0A09A]">{localProfiles.length} user terdaftar</p>
            <button
              onClick={() => setShowAddUser(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#064E3B] hover:bg-[#065F46] transition-colors"
            >
              + Tambah User
            </button>
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

      {/* ===================== TAB 4: QUARTER TARGET ===================== */}
      {activeTab === 'targets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6B6B65]">Target perusahaan tahun {currentYear}</p>
          </div>
          <div className="bg-white rounded-lg border border-[#EBEBE7] overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[#A0A09A] uppercase tracking-wider bg-[#FAFAF8] border-b border-[#EBEBE7]">
                <tr>
                  <th className="px-4 py-3 font-medium">Quarter</th>
                  <th className="px-4 py-3 font-medium text-right">Target Bruto</th>
                  <th className="px-4 py-3 font-medium text-right">Target Netto</th>
                  <th className="px-4 py-3 font-medium text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBE7]">
                {localTargets.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#1A1A18]">{t.quarter}</td>
                    {editingTarget === t.quarter ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={editBruto}
                            onChange={(e) => setEditBruto(e.target.value)}
                            className="form-input w-full text-right"
                            placeholder="Target Bruto"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={editNetto}
                            onChange={(e) => setEditNetto(e.target.value)}
                            className="form-input w-full text-right"
                            placeholder="Target Netto"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveTarget(t.id)}
                              disabled={savingTarget}
                              className="p-1.5 rounded-md text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingTarget(null)}
                              className="p-1.5 rounded-md text-[#6B6B65] bg-[#F5F5F2] hover:bg-[#EBEBE7] border border-[#EBEBE7] transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-right font-[family-name:var(--font-dm-mono)] text-[#1A1A18]">
                          {formatRupiahShort(t.targetBruto)}
                        </td>
                        <td className="px-4 py-3 text-right font-[family-name:var(--font-dm-mono)] text-[#064E3B] font-semibold">
                          {formatRupiahShort(t.targetNetto)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setEditingTarget(t.quarter)
                              setEditBruto(t.targetBruto.toString())
                              setEditNetto(t.targetNetto.toString())
                            }}
                            className="p-1.5 rounded-md text-[#6B6B65] hover:text-[#1A1A18] hover:bg-[#F5F5F2] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-[#EBEBE7] bg-[#FAFAF8]">
                <tr>
                  <td className="px-4 py-3 text-xs font-semibold text-[#A0A09A] uppercase">Total</td>
                  <td className="px-4 py-3 text-right font-[family-name:var(--font-dm-mono)] font-semibold text-[#1A1A18]">
                    {formatRupiahShort(localTargets.reduce((s, t) => s + t.targetBruto, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-[family-name:var(--font-dm-mono)] font-semibold text-[#064E3B]">
                    {formatRupiahShort(localTargets.reduce((s, t) => s + t.targetNetto, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowAddUser(false)}
        >
          <div
            className="bg-white rounded-xl border border-[#EBEBE7] shadow-lg w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-[#1A1A18]">Tambah User Baru</h3>
              <button
                onClick={() => setShowAddUser(false)}
                className="p-1.5 rounded-md text-[#A0A09A] hover:text-[#1A1A18] hover:bg-[#F5F5F2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#A0A09A] uppercase tracking-wider">Email *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@email.com"
                  className="form-input mt-1 w-full"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#A0A09A] uppercase tracking-wider">Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="form-input mt-1 w-full"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#A0A09A] uppercase tracking-wider">PIC Name *</label>
                <input
                  type="text"
                  value={newPicName}
                  onChange={(e) => setNewPicName(e.target.value)}
                  placeholder="Nama lengkap"
                  className="form-input mt-1 w-full"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#A0A09A] uppercase tracking-wider">Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="form-select mt-1 w-full"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#A0A09A] uppercase tracking-wider">Branch</label>
                <input
                  type="text"
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  placeholder="Opsional"
                  className="form-input mt-1 w-full"
                />
              </div>
            </div>

            {addUserError && (
              <p className="mt-3 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {addUserError}
              </p>
            )}

            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 rounded-lg text-sm text-[#6B6B65] bg-[#F5F5F2] hover:bg-[#EBEBE7] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleAddUser}
                disabled={addingUser || !newEmail || !newPassword || !newPicName}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#064E3B] hover:bg-[#065F46] disabled:opacity-50 transition-colors"
              >
                {addingUser ? 'Membuat...' : 'Buat User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
