import { fetchTrackers, fetchCurrentProfile } from '@/lib/api'
import MonitoringClient from './monitoring-client'
import { redirect } from 'next/navigation'

export default async function MonitoringPage() {
  const profile = await fetchCurrentProfile()
  if (!profile) redirect('/login')
  if (!['superadmin', 'admin', 'mp', 'sp', 'dirut'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const trackers = await fetchTrackers()

  return <MonitoringClient trackers={trackers} profile={profile} />
}
