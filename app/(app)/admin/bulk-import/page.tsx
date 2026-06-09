import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { ProfileRow, SettingRowRaw } from '@/lib/types'
import BulkImportClient from './bulk-import-client'

export interface PicRef { id: string; picName: string; role: string }
export interface ExistingLeadRef { funnelId: string; namaPaket: string; instansi: string; nilaiAnggaran: number }

export default async function BulkImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profileRow || !['superadmin', 'admin'].includes((profileRow as ProfileRow).role ?? '')) {
    redirect('/dashboard')
  }

  const [{ data: profileRows }, { data: settingRows }, { data: leadRows }] = await Promise.all([
    supabase.from('profiles').select('id, pic_name, role').not('pic_name', 'is', null),
    supabase.from('settings').select('*').order('sort_order', { ascending: true }),
    supabase.from('leads').select('funnel_id, nama_paket, instansi, nilai_anggaran'),
  ])

  const pics: PicRef[] = (profileRows as { id: string; pic_name: string; role: string }[] | null ?? [])
    .filter((p) => p.pic_name)
    .map((p) => ({ id: p.id, picName: p.pic_name, role: p.role ?? '' }))

  const principals: string[] = []
  const sumberDana: string[] = []
  ;(settingRows as SettingRowRaw[] | null ?? []).forEach((r) => {
    if (r.category === 'principals') principals.push(r.value)
    else if (r.category === 'sumberDana') sumberDana.push(r.value)
  })

  const existingLeads: ExistingLeadRef[] = (leadRows as { funnel_id: string; nama_paket: string; instansi: string; nilai_anggaran: number }[] | null ?? [])
    .map((l) => ({
      funnelId: l.funnel_id,
      namaPaket: l.nama_paket ?? '',
      instansi: l.instansi ?? '',
      nilaiAnggaran: l.nilai_anggaran ?? 0,
    }))

  return (
    <BulkImportClient
      pics={pics}
      principals={principals}
      sumberDana={sumberDana}
      existingLeads={existingLeads}
    />
  )
}
