import { fetchCurrentProfile } from '@/lib/api'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchCurrentProfile()
  if (!profile) redirect('/login')

  return <SettingsClient profile={profile} email={user.email ?? ''} />
}
