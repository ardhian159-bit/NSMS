import { fetchCurrentProfile, fetchProfiles, fetchSettingsRaw, fetchLockedLeads } from '@/lib/api'
import ControlClient from './control-client'
import { redirect } from 'next/navigation'

export default async function ControlPage() {
  const profile = await fetchCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'superadmin') redirect('/dashboard')

  const [profiles, settingsRaw, lockedLeads] = await Promise.all([
    fetchProfiles(),
    fetchSettingsRaw(),
    fetchLockedLeads(),
  ])

  return (
    <ControlClient
      currentProfile={profile}
      profiles={profiles}
      settingsRaw={settingsRaw}
      lockedLeads={lockedLeads}
    />
  )
}
