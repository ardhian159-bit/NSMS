import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { mapLeadRow, mapProfileRow, mapTrackerRow } from '@/lib/types'
import type { LeadRow, ProfileRow, TrackerRow, SettingRowRaw, AppSettings } from '@/lib/types'
import { fetchPicOptions } from '@/lib/api'
import AdminClient from './admin-client'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check role
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profileRow || !['superadmin', 'admin'].includes((profileRow as ProfileRow).role ?? '')) {
    redirect('/dashboard')
  }

  const profile = mapProfileRow(profileRow as ProfileRow)

  // Fetch leads
  const { data: leadRows } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch trackers
  const { data: trackerRows } = await supabase
    .from('tracker')
    .select('funnel_id, week, status_baru, forecast_netto, notes, pic, nama_paket')
    .order('week', { ascending: false })

  // Fetch settings
  const { data: settingRows } = await supabase
    .from('settings')
    .select('*')
    .order('sort_order', { ascending: true })

  const leads = (leadRows as LeadRow[] | null)?.map(mapLeadRow) ?? []
  const trackers = (trackerRows as TrackerRow[] | null)?.map(mapTrackerRow) ?? []

  const settings: AppSettings = {
    picNames: [],
    principals: [],
    sumberDana: [],
    jenisProduk: [],
    ketPenggarap: [],
  }

  ;(settingRows as SettingRowRaw[] | null)?.forEach((row) => {
    switch (row.category) {
      case 'picNames':    settings.picNames.push(row.value); break
      case 'principals':  settings.principals.push(row.value); break
      case 'sumberDana':  settings.sumberDana.push(row.value); break
      case 'jenisProduk': settings.jenisProduk.push(row.value); break
      case 'ketPenggarap': settings.ketPenggarap.push(row.value); break
    }
  })
  settings.picNames = await fetchPicOptions(settings.picNames)

  return <AdminClient leads={leads} trackers={trackers} settings={settings} profile={profile} />
}
