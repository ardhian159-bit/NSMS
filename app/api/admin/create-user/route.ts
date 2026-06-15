import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // 1. Verifikasi caller = superadmin (pakai session cookie, BUKAN service role)
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'superadmin') {
    return NextResponse.json({ error: 'Hanya superadmin yang boleh membuat user' }, { status: 403 })
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { email, password, picName, role, branch, penggarap } = await req.json()

  if (!email || !password || !picName || !role) {
    return NextResponse.json({ error: 'Field tidak lengkap' }, { status: 400 })
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Gagal buat auth user' }, { status: 500 })
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: authData.user.id,
      username: email,
      pic_name: picName,
      role,
      penggarap: penggarap || null,
      branch: branch || null,
    }, { onConflict: 'id' })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId: authData.user.id })
}
