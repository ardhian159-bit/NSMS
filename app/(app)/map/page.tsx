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

  if (!['superadmin', 'admin', 'mp', 'sp', 'dirut', 'am'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Ambil agregasi leads per provinsi
  const { data: leadsRaw } = await supabase
    .from('leads')
    .select('provinsi, forecast_netto, owner_name, nama_paket, status, kab_kota, nilai_anggaran')

  // Agregasi per provinsi
  const provinsiMap: Record<string, {
    totalNetto: number
    count: number
    leads: { ownerName: string; namaPaket: string; kabKota?: string; nilaiAnggaran?: number; status: string; netto: number }[]
  }> = {}

  leadsRaw?.forEach((lead) => {
    const prov = lead.provinsi || 'Tidak Diketahui'
    if (!provinsiMap[prov]) {
      provinsiMap[prov] = { totalNetto: 0, count: 0, leads: [] }
    }
    provinsiMap[prov].totalNetto += lead.forecast_netto || 0
    provinsiMap[prov].count += 1
    provinsiMap[prov].leads.push({
      ownerName: lead.owner_name,
      namaPaket: lead.nama_paket,
      kabKota: lead.kab_kota,
      nilaiAnggaran: lead.nilai_anggaran || 0,
      status: lead.status,
      netto: lead.forecast_netto || 0,
    })
  })

  return <MapClient provinsiData={provinsiMap} profile={profile} />
}
