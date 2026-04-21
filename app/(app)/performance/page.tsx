import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { mapProfileRow } from '@/lib/types'
import type { ProfileRow } from '@/lib/types'
import PerformanceClient from './performance-client'

export default async function PerformancePage() {
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

  // Only superadmin & admin
  if (profile.role !== 'superadmin' && profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch leads with netto > 0
  const { data: leads } = await supabase
    .from('leads')
    .select('owner_name, forecast_netto')
    .gt('forecast_netto', 0)

  return <PerformanceClient initialLeads={leads || []} />
}
