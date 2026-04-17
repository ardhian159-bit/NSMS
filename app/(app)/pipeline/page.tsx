import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { mapLeadRow, mapTrackerRow, mapProfileRow } from '@/lib/types'
import type { LeadRow, TrackerRow, ProfileRow, SettingRowRaw, AppSettings } from '@/lib/types'
import PipelineClient from './pipeline-client'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profileRow) redirect('/login')
  const profile = mapProfileRow(profileRow as ProfileRow)

  // Fetch leads for this user (by owner_name = pic_name)
  const { data: leadRows } = await supabase
    .from('leads')
    .select('*')
    .ilike('owner_name', profile.picName)
    .order('created_at', { ascending: false })

  const leads = (leadRows as LeadRow[] | null)?.map(mapLeadRow) ?? []

  // Fetch trackers for these leads
  const funnelIds = leads.map((l) => l.funnelId)
  let trackerRows: TrackerRow[] = []
  if (funnelIds.length > 0) {
    const { data } = await supabase
      .from('tracker')
      .select('*')
      .in('funnel_id', funnelIds)
      .order('created_at', { ascending: false })
    trackerRows = (data as TrackerRow[] | null) ?? []
  }
  const trackers = trackerRows.map(mapTrackerRow)

  // Fetch settings
  const { data: settingRows } = await supabase
    .from('settings')
    .select('*')
    .order('sort_order', { ascending: true })

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

  return (
    <PipelineClient
      leads={leads}
      trackers={trackers}
      settings={settings}
      profile={profile}
    />
  )
}
