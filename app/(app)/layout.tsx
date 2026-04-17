import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { mapProfileRow } from '@/lib/types'
import type { ProfileRow } from '@/lib/types'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  return (
    <div className="min-h-screen bg-[#F5F5F2]">
      <Sidebar profile={profile} />
      <main className="flex-1 min-w-0 min-h-screen pb-20 md:pb-0 transition-all duration-200 md:ml-[var(--sidebar-width,220px)]">
        {children}
      </main>
      <BottomNav profile={profile} />
    </div>
  )
}
