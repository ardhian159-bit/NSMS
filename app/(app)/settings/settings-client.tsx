'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'
import { KeyRound, User } from 'lucide-react'

interface SettingsClientProps {
  profile: Profile
  email: string
}

export default function SettingsClient({ profile, email }: SettingsClientProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    <div className="p-4 md:p-6 space-y-6 max-w-xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A18]">Pengaturan</h1>
        <p className="text-sm text-[#A0A09A] mt-0.5">Kelola akun kamu</p>
      </div>

      {/* Info Akun */}
      <div className="bg-white rounded-lg border border-[#EBEBE7] p-5">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#EBEBE7]">
          <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-[#064E3B]" />
          </div>
          <div>
            <p className="font-medium text-[#1A1A18]">{profile.picName || profile.username}</p>
            <p className="text-xs text-[#A0A09A] capitalize">{profile.role}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[10px] text-[#A0A09A] uppercase tracking-wider">Email</span>
            <p className="text-[#6B6B65] mt-0.5">{email}</p>
          </div>
          <div>
            <span className="text-[10px] text-[#A0A09A] uppercase tracking-wider">Role</span>
            <p className="mt-0.5">
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5F5F2] text-[#6B6B65] font-medium capitalize">
                {profile.role}
              </span>
            </p>
          </div>
          {profile.branch && (
            <div>
              <span className="text-[10px] text-[#A0A09A] uppercase tracking-wider">Branch</span>
              <p className="text-[#6B6B65] mt-0.5">{profile.branch}</p>
            </div>
          )}
        </div>
      </div>

      {/* Ganti Password */}
      <div className="bg-white rounded-lg border border-[#EBEBE7] p-5">
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#EBEBE7]">
          <KeyRound className="w-4 h-4 text-[#6B6B65]" />
          <h2 className="text-sm font-semibold text-[#1A1A18]">Ganti Password</h2>
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
            <label className="block text-xs font-medium text-[#6B6B65] mb-1.5">
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
            <label className="block text-xs font-medium text-[#6B6B65] mb-1.5">
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
            <label className="block text-xs font-medium text-[#6B6B65] mb-1.5">
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
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#064E3B] hover:bg-[#065F46] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Menyimpan...' : 'Ubah Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
