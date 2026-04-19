'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F2] px-4">
      <div className="bg-white p-8 rounded-[12px] border border-[#EBEBE7] w-full max-w-sm">
        <div className="mb-8 text-center space-y-1">
          <h1 className="font-[family-name:var(--font-dm-mono)] font-bold text-xl tracking-[0.2em] text-[#064E3B]">
            NS MS
          </h1>
          <p className="text-xs text-[#A0A09A]">National Sales Management System</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#6B6B65] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-[#EBEBE7] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#064E3B] focus:border-[#064E3B] transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-[#6B6B65] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-[#EBEBE7] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#064E3B] focus:border-[#064E3B] transition-colors"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#064E3B] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#065F46] disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Masuk...' : 'Login'}
          </button>
        </form>
      </div>
      
      <p className="text-xs text-[#A0A09A] text-center mt-6">
        made with 🔥 by Adrian
      </p>
    </div>
  )
}
