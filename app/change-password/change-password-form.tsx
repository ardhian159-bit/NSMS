'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function ChangePasswordForm({ mustChange }: { mustChange: boolean }) {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async () => {
    setError('')
    if (pw.length < 8) return setError('Password minimal 8 karakter')
    if (pw !== confirm) return setError('Konfirmasi password tidak cocok')
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({
      password: pw,
      data: { must_change_password: false },
    })
    if (err) { setError(err.message); setLoading(false); return }
    setDone(true)
    // Full reload supaya middleware membaca metadata terbaru
    setTimeout(() => { window.location.href = '/dashboard' }, 1200)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F2] p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#EBEBE7] shadow-sm p-6">
        <div className="w-11 h-11 rounded-xl bg-[#064E3B] flex items-center justify-center mb-4">
          <Lock className="w-5 h-5 text-[#D1FAE5]" />
        </div>
        <h1 className="text-lg font-semibold text-[#1A1A18]">Ganti Password</h1>
        <p className="text-sm text-[#6B6B65] mt-1">
          {mustChange
            ? 'Password kamu baru di-reset admin. Buat password baru untuk melanjutkan.'
            : 'Buat password baru untuk akun kamu.'}
        </p>

        {done ? (
          <div className="mt-5 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            Password berhasil diubah. Mengarahkan ke dashboard...
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
            )}
            <div>
              <label className="block text-xs font-medium text-[#6B6B65] mb-1.5">Password Baru</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full rounded-lg border border-[#EBEBE7] bg-white text-sm px-3 py-2 pr-9 focus:outline-none focus:ring-1 focus:ring-[#1A1A18]"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A0A09A] hover:text-[#1A1A18]">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B65] mb-1.5">Konfirmasi Password</label>
              <input
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
                placeholder="Ulangi password baru"
                className="w-full rounded-lg border border-[#EBEBE7] bg-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1A1A18]"
              />
            </div>
            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#1A1A18] text-white text-sm font-semibold hover:bg-[#2A2A28] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
