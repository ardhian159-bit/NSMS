import { fetchTrackers, fetchCurrentProfile } from '@/lib/api'
import MonitoringClient from './monitoring-client'
import { redirect } from 'next/navigation'

export default async function MonitoringPage() {
  const [profile, trackers] = await Promise.all([
    fetchCurrentProfile(),
    fetchTrackers(),
  ])
  if (!profile) redirect('/login')
  if (!['superadmin', 'admin', 'sales', 'am', 'mp', 'sp', 'dirut'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return <MonitoringClient trackers={trackers} profile={profile} />
}
