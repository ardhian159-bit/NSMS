import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { mapProfileRow } from '@/lib/types'
import type { ProfileRow, SettingRowRaw, AppSettings } from '@/lib/types'
import InputLeadForm from '@/components/shared/InputLeadForm'

export default async function NewLeadPage() {
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
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A18]">Input Lead Baru</h1>
        <p className="text-sm text-[#A0A09A] mt-0.5">PIC: {profile.picName}</p>
      </div>
      <InputLeadForm
        defaultOwnerName={profile.picName}
        settings={settings}
      />
    </div>
  )
}
