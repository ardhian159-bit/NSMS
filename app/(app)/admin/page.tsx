import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { mapLeadRow } from '@/lib/types'
import type { LeadRow, SettingRowRaw, AppSettings } from '@/lib/types'
import AdminClient from './admin-client'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['superadmin', 'admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Fetch leads
  const { data: leadRows } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch settings
  const { data: settingRows } = await supabase
    .from('settings')
    .select('*')
    .order('sort_order', { ascending: true })

  const leads = (leadRows as LeadRow[] | null)?.map(mapLeadRow) ?? []

  const settings: AppSettings = {
    picNames: [],
    principals: [],
    sumberDana: [],
    jenisProduk: [],
  }

  ;(settingRows as SettingRowRaw[] | null)?.forEach((row) => {
    switch (row.category) {
      case 'picNames':    settings.picNames.push(row.value); break
      case 'principals':  settings.principals.push(row.value); break
      case 'sumberDana':  settings.sumberDana.push(row.value); break
      case 'jenisProduk': settings.jenisProduk.push(row.value); break
    }
  })

  return <AdminClient leads={leads} settings={settings} />
}
