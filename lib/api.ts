// =============================================================================
// NSMS — Supabase Data Access Layer
// Replaces legacy apiGet() calls to Google Apps Script
// Uses createClient() from @/lib/supabase-server for SSR
// =============================================================================

import { createClient } from '@/lib/supabase-server'
import type {
  Lead, LeadRow, TrackerEntry, TrackerRow,
  Profile, ProfileRow, AppSettings, SettingRowRaw,
  Target, TargetRow,
} from './types'
import {
  mapLeadRow as toLead,
  mapTrackerRow as toTracker,
  mapProfileRow as toProfile,
} from './types'

// =============================================================================
// LEADS
// =============================================================================

/** Fetch all leads (or filtered by owner for sales role) */
export async function fetchLeads(options?: {
  role?: string
  userId?: string
  ownerName?: string
}): Promise<Lead[]> {
  const supabase = await createClient()
  let query = supabase.from('leads').select('*').order('created_at', { ascending: false })

  // Sales role: only their own leads
  if (options?.role === 'sales' && options?.ownerName) {
    query = query.ilike('owner_name', options.ownerName)
  }

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch leads: ${error.message}`)
  return (data as LeadRow[]).map(toLead)
}

/** Fetch a single lead by funnel_id */
export async function fetchLeadByFunnelId(funnelId: string): Promise<Lead | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('funnel_id', funnelId)
    .single()

  if (error) return null
  return toLead(data as LeadRow)
}

// =============================================================================
// TRACKER
// =============================================================================

/** Fetch all tracker entries, optionally filtered by funnel_id */
export async function fetchTrackers(funnelId?: string): Promise<TrackerEntry[]> {
  const supabase = await createClient()
  let query = supabase.from('tracker').select('*').order('created_at', { ascending: false })

  if (funnelId) {
    query = query.eq('funnel_id', funnelId)
  }

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch trackers: ${error.message}`)
  return (data as TrackerRow[]).map(toTracker)
}

// =============================================================================
// PROFILES
// =============================================================================

/** Fetch the current user's profile */
export async function fetchCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return null
  return toProfile(data as ProfileRow)
}

/** Fetch all profiles */
export async function fetchProfiles(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('pic_name', { ascending: true })

  if (error) throw new Error(`Failed to fetch profiles: ${error.message}`)
  return (data as ProfileRow[]).map(toProfile)
}

// =============================================================================
// SETTINGS
// =============================================================================

/** Fetch settings grouped by category */
export async function fetchSettings(): Promise<AppSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to fetch settings: ${error.message}`)

  const rows = data as SettingRowRaw[]
  const result: AppSettings = {
    picNames: [],
    principals: [],
    sumberDana: [],
    jenisProduk: [],
  }

  rows.forEach((row) => {
    switch (row.category) {
      case 'picNames':    result.picNames.push(row.value); break
      case 'principals':  result.principals.push(row.value); break
      case 'sumberDana':  result.sumberDana.push(row.value); break
      case 'jenisProduk': result.jenisProduk.push(row.value); break
    }
  })

  return result
}

// =============================================================================
// TARGETS
// =============================================================================

/** Fetch target for a specific profile and year */
export async function fetchTarget(profileId: string, year: number): Promise<Target | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('targets')
    .select('*')
    .eq('profile_id', profileId)
    .eq('year', year)
    .single()

  if (error) return null
  const row = data as TargetRow
  return {
    id: row.id,
    profileId: row.profile_id,
    year: row.year,
    targetBrutto: row.target_brutto ?? 0,
    createdAt: row.created_at,
  }
}

// =============================================================================
// PROFILES — MUTATIONS
// =============================================================================

/** Update profile role + picName (admin/superadmin only) */
export async function updateProfile(
  id: string,
  updates: { role?: string; picName?: string; branch?: string; isActive?: boolean }
): Promise<void> {
  const supabase = await createClient()
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.role !== undefined) payload.role = updates.role
  if (updates.picName !== undefined) payload.pic_name = updates.picName
  if (updates.branch !== undefined) payload.branch = updates.branch
  if (updates.isActive !== undefined) payload.is_active = updates.isActive
  const { error } = await supabase.from('profiles').update(payload).eq('id', id)
  if (error) throw new Error(`Failed to update profile: ${error.message}`)
}

// =============================================================================
// SETTINGS — MUTATIONS
// =============================================================================

/** Add a new settings item */
export async function addSettingItem(category: string, value: string): Promise<void> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('settings')
    .select('sort_order')
    .eq('category', category)
    .order('sort_order', { ascending: false })
    .limit(1)
  const maxOrder = existing?.[0]?.sort_order ?? 0
  const { error } = await supabase
    .from('settings')
    .insert({ category, value, sort_order: maxOrder + 1 })
  if (error) throw new Error(`Failed to add setting: ${error.message}`)
}

/** Delete a settings item by id */
export async function deleteSettingItem(id: number): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('settings').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete setting: ${error.message}`)
}

/** Fetch raw settings rows (with id, for delete operations) */
export async function fetchSettingsRaw(): Promise<{ id: number; category: string; value: string; sortOrder: number }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw new Error(`Failed to fetch settings: ${error.message}`)
  return (data as SettingRowRaw[]).map(r => ({
    id: r.id,
    category: r.category,
    value: r.value,
    sortOrder: r.sort_order ?? 0,
  }))
}

// =============================================================================
// LEADS — UNLOCK
// =============================================================================

/** Fetch all locked leads (tk === 0 or tk === 100) */
export async function fetchLockedLeads(): Promise<Lead[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .in('tk', [0, 100])
    .order('updated_at', { ascending: false })
  if (error) throw new Error(`Failed to fetch locked leads: ${error.message}`)
  return (data as LeadRow[]).map(toLead)
}

/** Unlock a lead — reset tk to 75 (Hot Prospek) and status accordingly */
export async function unlockLead(id: number): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('leads')
    .update({
      tk: 75,
      status: 'Hot Prospek',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(`Failed to unlock lead: ${error.message}`)
}

// =============================================================================
// COMPANY TARGETS
// =============================================================================

export interface CompanyTarget {
  id: number
  year: number
  quarter: string
  targetBruto: number
  targetNetto: number
}

export async function fetchCompanyTargets(year?: number): Promise<CompanyTarget[]> {
  const supabase = await createClient()
  let query = supabase
    .from('company_targets')
    .select('*')
    .order('quarter', { ascending: true })
  if (year) query = query.eq('year', year)
  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch company targets: ${error.message}`)
  return (data ?? []).map((r: any) => ({
    id: r.id,
    year: r.year,
    quarter: r.quarter,
    targetBruto: r.target_bruto ?? 0,
    targetNetto: r.target_netto ?? 0,
  }))
}
