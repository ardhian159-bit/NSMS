import { supabase } from '@/lib/supabase'
import { FUNNEL_PREFIX_MAP } from './prefixMap'

export async function generateFunnelId(picName: string): Promise<string> {
  const upper = picName.toUpperCase().trim()

  // 1. Lookup dari map dulu
  let prefix = FUNNEL_PREFIX_MAP[upper]

  // 2. Fallback: auto dari nama depan (untuk user baru yang belum ada di map)
  if (!prefix) {
    const firstName = upper.split(' ')[0]
    prefix = firstName.substring(0, 3)

    // Cek collision dengan prefix milik owner lain
    const { data: existing } = await supabase
      .from('leads')
      .select('funnel_id, owner_name')
      .ilike('funnel_id', `${prefix}-%`)

    const hasCollision = (existing ?? []).some(
      (row) => (row.owner_name ?? '').toUpperCase().trim() !== upper
    )

    if (hasCollision) {
      prefix = firstName.substring(0, 4)
    }
  }

  // 3. Hitung sequence — pakai MAX bukan COUNT untuk hindari gap issue
  const { data: existing } = await supabase
    .from('leads')
    .select('funnel_id')
    .ilike('funnel_id', `${prefix}-%`)
    .order('funnel_id', { ascending: false })
    .limit(1)

  let seq = 1
  if (existing && existing.length > 0) {
    const lastId = existing[0].funnel_id
    const lastNum = parseInt(lastId.split('-')[1] ?? '0', 10)
    seq = lastNum + 1
  }

  return `${prefix}-${seq.toString().padStart(4, '0')}`
}
