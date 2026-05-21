import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { mapLeadRow, mapTrackerRow, mapProfileRow } from '@/lib/types'
import type { LeadRow, TrackerRow, ProfileRow } from '@/lib/types'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profileRow) redirect('/login')

  const profile = mapProfileRow(profileRow as ProfileRow)

  // Fetch leads + trackers + company targets in parallel
  const [
    { data: leadRows, error: leadsErr },
    { data: trackerRows, error: trackersErr },
    { data: companyTargets },
  ] = await Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('tracker').select('*').order('created_at', { ascending: false }),
    supabase.from('company_targets').select('quarter, target_bruto, target_netto').eq('year', 2026),
  ])

  if (trackersErr) {
    console.error('Failed to fetch trackers:', trackersErr.message)
  }

  const leads = (leadRows as LeadRow[] | null)?.map(mapLeadRow) ?? []
  const trackers = (trackerRows as TrackerRow[] | null)?.map(mapTrackerRow) ?? []

  return <DashboardClient leads={leads || []} trackers={trackers || []} profile={profile} companyTargets={companyTargets ?? []} />
}
