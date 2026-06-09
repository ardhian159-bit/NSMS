import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { ProfileRow, SettingRowRaw } from '@/lib/types'
import BulkImportClient from './bulk-import-client'

export interface PicRef { id: string; picName: string; role: string }
export interface ExistingLeadRef { funnelId: string; namaPaket: string; instansi: string; nilaiAnggaran: number }
export interface KnownOwnerRef { name: string; ownerId: string | null; ketPenggarap: string | null }

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
    supabase.from('leads').select('funnel_id, nama_paket, instansi, nilai_anggaran, owner_name, owner_id, ket_penggarap'),
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

  type LeadRowLite = {
    funnel_id: string; nama_paket: string; instansi: string; nilai_anggaran: number
    owner_name: string | null; owner_id: string | null; ket_penggarap: string | null
  }
  const leadList = (leadRows as LeadRowLite[] | null) ?? []

  const existingLeads: ExistingLeadRef[] = leadList.map((l) => ({
    funnelId: l.funnel_id,
    namaPaket: l.nama_paket ?? '',
    instansi: l.instansi ?? '',
    nilaiAnggaran: l.nilai_anggaran ?? 0,
  }))

  // Agregasi owner_name distinct dari leads → match PIC tanpa akun.
  // ownerId = owner_id non-null pertama; ketPenggarap = ket_penggarap paling sering.
  const ownerAgg = new Map<string, { name: string; ownerId: string | null; ket: Map<string, number> }>()
  leadList.forEach((l) => {
    const name = (l.owner_name ?? '').trim()
    if (!name) return
    const key = name.toLowerCase().replace(/\s+/g, ' ')
    const e = ownerAgg.get(key) ?? { name, ownerId: null, ket: new Map<string, number>() }
    if (l.owner_id) e.ownerId = l.owner_id
    if (l.ket_penggarap) e.ket.set(l.ket_penggarap, (e.ket.get(l.ket_penggarap) ?? 0) + 1)
    ownerAgg.set(key, e)
  })
  const knownOwners: KnownOwnerRef[] = [...ownerAgg.values()].map((e) => {
    let ket: string | null = null
    let max = 0
    e.ket.forEach((count, k) => { if (count > max) { max = count; ket = k } })
    return { name: e.name, ownerId: e.ownerId, ketPenggarap: ket }
  })

  return (
    <BulkImportClient
      pics={pics}
      principals={principals}
      sumberDana={sumberDana}
      existingLeads={existingLeads}
      knownOwners={knownOwners}
    />
  )
}
