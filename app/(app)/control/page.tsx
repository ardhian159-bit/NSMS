import { fetchCurrentProfile, fetchProfiles, fetchSettingsRaw, fetchLockedLeads, fetchCompanyTargets } from '@/lib/api'
import ControlClient from './control-client'
import { redirect } from 'next/navigation'

export default async function ControlPage() {
  const profile = await fetchCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'superadmin') redirect('/dashboard')

  const [profiles, settingsRaw, lockedLeads, companyTargets] = await Promise.all([
    fetchProfiles(),
    fetchSettingsRaw(),
    fetchLockedLeads(),
    fetchCompanyTargets(new Date().getFullYear()),
  ])

  return (
    <ControlClient
      currentProfile={profile}
      profiles={profiles}
      settingsRaw={settingsRaw}
      lockedLeads={lockedLeads}
      companyTargets={companyTargets}
    />
  )
}
