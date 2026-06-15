import { fetchCurrentProfile } from '@/lib/api'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import MapClient from './map-client'

export default async function MapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchCurrentProfile()
  if (!profile) redirect('/login')

  if (!['superadmin', 'admin', 'sales', 'managerial'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Ambil agregasi leads per provinsi — hanya sales yang dibatasi ke leads miliknya
  const isRestricted = profile.role === 'sales'
  let query = supabase
    .from('leads')
    .select('provinsi, forecast_netto, owner_name, nama_paket, status, kab_kota, nilai_anggaran')
  if (isRestricted) {
    query = query.eq('owner_id', user.id)
  }
  const { data: leadsRaw } = await query

  type RegionData = {
    totalNetto: number
    count: number
    leads: { ownerName: string; namaPaket: string; kabKota?: string; nilaiAnggaran?: number; status: string; netto: number }[]
  }

  // Agregasi per provinsi
  const provinsiMap: Record<string, RegionData> = {}
  // Agregasi per kab/kota
  const kabKotaMap: Record<string, RegionData> = {}

  leadsRaw?.forEach((lead) => {
    const detail = {
      ownerName: lead.owner_name,
      namaPaket: lead.nama_paket,
      kabKota: lead.kab_kota,
      nilaiAnggaran: lead.nilai_anggaran || 0,
      status: lead.status,
      netto: lead.forecast_netto || 0,
    }

    const prov = lead.provinsi || 'Tidak Diketahui'
    if (!provinsiMap[prov]) provinsiMap[prov] = { totalNetto: 0, count: 0, leads: [] }
    provinsiMap[prov].totalNetto += lead.forecast_netto || 0
    provinsiMap[prov].count += 1
    provinsiMap[prov].leads.push(detail)

    // Kab/kota — skip yang kosong atau scope nasional ("Indonesia")
    const kk = lead.kab_kota
    if (kk && kk !== 'Indonesia') {
      if (!kabKotaMap[kk]) kabKotaMap[kk] = { totalNetto: 0, count: 0, leads: [] }
      kabKotaMap[kk].totalNetto += lead.forecast_netto || 0
      kabKotaMap[kk].count += 1
      kabKotaMap[kk].leads.push(detail)
    }
  })

  return <MapClient provinsiData={provinsiMap} kabKotaData={kabKotaMap} profile={profile} />
}
