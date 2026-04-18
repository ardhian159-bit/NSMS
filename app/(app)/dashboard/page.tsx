import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { mapLeadRow, mapTrackerRow } from '@/lib/types'
import type { LeadRow, TrackerRow } from '@/lib/types'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: roleCheck } = await supabase.rpc('get_my_role')

  // Ganti fetch leads di page.tsx dengan ini:
  const { data: leadRows, error: leadsErr } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  // Fetch trackers
  const { data: trackerRows, error: trackersErr } = await supabase
    .from('tracker')
    .select('*')
    .order('created_at', { ascending: false })

  if (trackersErr) {
    console.error('Failed to fetch trackers:', trackersErr.message)
  }

  const leads = (leadRows as LeadRow[] | null)?.map(mapLeadRow) ?? []
  const trackers = (trackerRows as TrackerRow[] | null)?.map(mapTrackerRow) ?? []

  return <DashboardClient leads={leads} trackers={trackers} />
}
