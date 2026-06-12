'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'
import { KeyRound, User, Download, LogOut, BookOpen, Palette } from 'lucide-react'
import ThemeToggle from '@/components/theme/ThemeToggle'

interface SettingsClientProps {
  profile: Profile
  email: string
}

export default function SettingsClient({ profile, email }: SettingsClientProps) {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const isAdmin = profile.role === 'admin' || profile.role === 'superadmin'

  const handleExport = () => {
    setIsExporting(true)
    window.location.href = '/api/admin/export'
    setTimeout(() => setIsExporting(false), 3000)
  }

  const handleChangePassword = async () => {
    setError('')
    setSuccess('')

    if (!newPassword) return setError('Password baru wajib diisi')
    if (newPassword.length < 6) return setError('Password minimal 6 karakter')
    if (newPassword !== confirmPassword) return setError('Konfirmasi password tidak cocok')

    setLoading(true)

    try {
      // Re-authenticate dulu dengan current password
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (signInErr) throw new Error('Password saat ini salah')

      // Update password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (updateErr) throw updateErr

      setSuccess('Password berhasil diubah!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-ink">Pengaturan</h1>
        <p className="text-sm text-ink-hint mt-0.5">Kelola akun kamu</p>
      </div>

      {/* Info Akun */}
      <div className="bg-surface rounded-lg border border-line p-5">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-line">
          <div className="w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="font-medium text-ink">{profile.picName || profile.username}</p>
            <p className="text-xs text-ink-hint capitalize">{profile.role}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[10px] text-ink-hint uppercase tracking-wider">Email</span>
            <p className="text-ink-muted mt-0.5">{email}</p>
          </div>
          <div>
            <span className="text-[10px] text-ink-hint uppercase tracking-wider">Role</span>
            <p className="mt-0.5">
              <span className="text-xs px-2 py-0.5 rounded-full bg-page text-ink-muted font-medium capitalize">
                {profile.role}
              </span>
            </p>
          </div>
          {profile.branch && (
            <div>
              <span className="text-[10px] text-ink-hint uppercase tracking-wider">Branch</span>
              <p className="text-ink-muted mt-0.5">{profile.branch}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tampilan */}
      <div className="bg-surface rounded-lg border border-line p-5">
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-line">
          <Palette className="w-4 h-4 text-ink-muted" />
          <h2 className="text-sm font-semibold text-ink">Tampilan</h2>
        </div>
        <p className="text-sm text-ink-muted mb-4">Pilih mode terang atau gelap. Default mengikuti pengaturan sistem.</p>
        <ThemeToggle variant="row" />
      </div>

      {/* Ganti Password */}
      <div className="bg-surface rounded-lg border border-line p-5">
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-line">
          <KeyRound className="w-4 h-4 text-ink-muted" />
          <h2 className="text-sm font-semibold text-ink">Ganti Password</h2>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            {success}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">
              Password Saat Ini *
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">
              Password Baru *
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 karakter"
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">
              Konfirmasi Password Baru *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              className="form-input"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleChangePassword}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-solid hover:bg-brand-solid-hover disabled:opacity-50 transition-colors"
          >
            {loading ? 'Menyimpan...' : 'Ubah Password'}
          </button>
        </div>
      </div>

      {/* Export Data */}
      {profile.role !== 'guest' && (
        <div className="bg-surface rounded-lg border border-line p-5">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-line">
            <Download className="w-4 h-4 text-ink-muted" />
            <h2 className="text-sm font-semibold text-ink">Export Data</h2>
          </div>
          <p className="text-sm text-ink-muted mb-4">
            {isAdmin
              ? 'Download semua data leads dan tracker dalam format Excel.'
              : 'Download data leads dan tracker milik Anda dalam format Excel.'}
          </p>
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-solid hover:bg-brand-solid-hover disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Menyiapkan file...' : 'Export Excel'}
            </button>
          </div>
        </div>
      )}

      {/* Panduan */}
      <div className="bg-surface rounded-lg border border-line p-5">
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-line">
          <BookOpen className="w-4 h-4 text-ink-muted" />
          <h2 className="text-sm font-semibold text-ink">Panduan</h2>
        </div>
        <p className="text-sm text-ink-muted mb-4">Buka kembali panduan penggunaan NSMS.</p>
        <div className="flex justify-end">
          <button
            onClick={() => window.dispatchEvent(new Event('nsms-show-onboarding'))}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-solid hover:bg-brand-solid-hover transition-colors flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Buka Panduan
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="bg-surface rounded-lg border border-line p-5">
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-line">
          <LogOut className="w-4 h-4 text-ink-muted" />
          <h2 className="text-sm font-semibold text-ink">Akun</h2>
        </div>
        <p className="text-sm text-ink-muted mb-4">Keluar dari akun NSMS Anda.</p>
        <div className="flex justify-end">
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/')
            }}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  )
}
