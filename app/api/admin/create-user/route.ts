import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { email, password, picName, role, branch } = await req.json()

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
      branch: branch || null,
    }, { onConflict: 'id' })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId: authData.user.id })
}
