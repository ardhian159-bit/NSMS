import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Generate password sementara yang readable (hindari char ambigu)
function genTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `Nsms-${s}`
}

export async function POST(req: Request) {
  // 1. Verifikasi caller = superadmin (pakai session cookie, BUKAN service role)
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'superadmin') {
    return NextResponse.json({ error: 'Hanya superadmin yang boleh reset password' }, { status: 403 })
  }

  const { targetId } = await req.json()
  if (!targetId) return NextResponse.json({ error: 'targetId wajib' }, { status: 400 })

  // 2. Reset via service role
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const tempPassword = genTempPassword()
  const { error } = await admin.auth.admin.updateUserById(targetId, {
    password: tempPassword,
    user_metadata: { must_change_password: true },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, tempPassword })
}
