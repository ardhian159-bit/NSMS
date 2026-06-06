// =============================================================================
// NSMS — TypeScript Interfaces
// Source: Supabase schema + legacy Code.gs column mappings
// =============================================================================

// --- Enums ---

export type UserRole =
  | 'superadmin'
  | 'admin'
  | 'sales'
  | 'guest'
  | 'mp'
  | 'sp'
  | 'am'
  | 'rekanan'
  | 'dirut'

export type FunnelStatus =
  | 'Gagal'
  | 'Informasi Awal'
  | 'Informasi Kebutuhan'
  | 'Presentasi'
  | 'Peluang 50:50'
  | 'Hot Prospek'
  | 'Closing'

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export type TKValue = 0 | 5 | 10 | 25 | 50 | 75 | 100

// --- Core Models ---

/** Maps to Supabase `leads` table */
export interface Lead {
  id: number
  funnelId: string
  namaPaket: string
  instansi: string
  provinsi: string
  kabKota: string
  wilayah: string
  principal: string
  sumberDana: string
  nilaiAnggaran: number
  dpp: number
  forecastNetto: number
  ppn: string
  perkiraanCb: number
  produk: string
  qty: number
  satuan: string
  jenisProduk: string
  status: string
  tk: number
  quarter: string
  ownerName: string
  ownerId: string | null
  spId: string | null
  mpId: string | null
  inputWeekLabel: string
  inputWeek: number
  inputYear: number
  targetCloseWeek: string
  targetCloseQuarter: string
  isTayang: boolean
  isShadow: boolean
  parentLeadId: number | null
  keterangan: string
  ketPenggarap: string
  inputDate: string | null
  createdAt: string
  updatedAt: string
}

/** Maps to Supabase `tracker` table */
export interface TrackerEntry {
  id: number
  funnelId: string
  pic: string
  namaPaket: string
  statusBaru: string
  forecastNetto: number
  notes: string
  week: string
  adminNotes: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

/** Maps to Supabase `profiles` table */
export interface Profile {
  id: string
  username: string
  role: UserRole
  picName: string
  branch: string
  superiorId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** Maps to Supabase `settings` table */
export interface SettingRow {
  id: number
  category: string
  value: string
  sortOrder: number
}

/** Aggregated settings grouped by category */
export interface AppSettings {
  picNames: string[]
  principals: string[]
  sumberDana: string[]
  jenisProduk: string[]
}

/** Maps to Supabase `targets` table */
export interface Target {
  id: number
  profileId: string
  year: number
  targetBrutto: number
  createdAt: string
}

// --- Dashboard State ---

export interface FilterState {
  quarter: string      // 'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4' (single — pill)
  tk: string           // 'ALL' | '0' | '5' | ... (single — pill)
  sumberDana: string[] // [] = semua, multi-select
  pic: string[]        // [] = semua, multi-select
  wilayah: string[]    // [] = semua, multi-select
  principal: string[]  // [] = semua, multi-select
  ketPenggarap: string[] // [] = semua, multi-select
  search: string
}

export interface SortState {
  column: string
  ascending: boolean
}

export interface PaginationState {
  page: number
  perPage: number
}

export interface KPIData {
  totalBrutto: number
  totalNetto: number
  totalPipeline: number
  closingCount: number
  closingNetto: number
  gagalBrutto: number
  gagalPercent: number
}

// --- Supabase Row ↔ TypeScript Mappers ---

/** Raw row shape from Supabase `leads` table (snake_case) */
export interface LeadRow {
  id: number
  funnel_id: string
  nama_paket: string | null
  instansi: string | null
  provinsi: string | null
  kab_kota: string | null
  wilayah: string | null
  principal: string | null
  sumber_dana: string | null
  nilai_anggaran: number | null
  dpp: number | null
  forecast_netto: number | null
  ppn: string | null
  perkiraan_cb: number | null
  produk: string | null
  qty: number | null
  satuan: string | null
  jenis_produk: string | null
  status: string | null
  tk: number | null
  quarter: string | null
  owner_name: string | null
  owner_id: string | null
  sp_id: string | null
  mp_id: string | null
  input_week_label: string | null
  input_week: number | null
  input_year: number | null
  target_close_week: string | null
  target_close_quarter: string | null
  is_tayang: boolean | null
  is_shadow: boolean | null
  parent_lead_id: number | null
  keterangan: string | null
  ket_penggarap: string | null
  input_date: string | null
  created_at: string
  updated_at: string
}

/** Raw row shape from Supabase `tracker` table (snake_case) */
export interface TrackerRow {
  id: number
  funnel_id: string
  pic: string | null
  nama_paket: string | null
  status_baru: string | null
  forecast_netto: number | null
  notes: string | null
  week: string | null
  admin_notes: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

/** Raw row shape from Supabase `profiles` table (snake_case) */
export interface ProfileRow {
  id: string
  username: string | null
  role: string | null
  pic_name: string | null
  branch: string | null
  superior_id: string | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}

/** Raw row shape from Supabase `settings` table (snake_case) */
export interface SettingRowRaw {
  id: number
  category: string
  value: string
  sort_order: number | null
}

/** Raw row shape from Supabase `targets` table (snake_case) */
export interface TargetRow {
  id: number
  profile_id: string
  year: number
  target_brutto: number | null
  created_at: string
}

// --- Mapper Functions ---

export function mapLeadRow(row: LeadRow): Lead {
  return {
    id: row.id,
    funnelId: row.funnel_id,
    namaPaket: row.nama_paket ?? '',
    instansi: row.instansi ?? '',
    provinsi: row.provinsi ?? '',
    kabKota: row.kab_kota ?? '',
    wilayah: row.wilayah ?? '',
    principal: row.principal ?? '',
    sumberDana: row.sumber_dana ?? '',
    nilaiAnggaran: row.nilai_anggaran ?? 0,
    dpp: row.dpp ?? 0,
    forecastNetto: row.forecast_netto ?? 0,
    ppn: row.ppn ?? '',
    perkiraanCb: row.perkiraan_cb ?? 0,
    produk: row.produk ?? '',
    qty: row.qty ?? 0,
    satuan: row.satuan ?? '',
    jenisProduk: row.jenis_produk ?? '',
    status: row.status ?? '',
    tk: row.tk ?? 0,
    quarter: row.quarter ?? '',
    ownerName: row.owner_name ?? '',
    ownerId: row.owner_id,
    spId: row.sp_id,
    mpId: row.mp_id,
    inputWeekLabel: row.input_week_label ?? '',
    inputWeek: row.input_week ?? 0,
    inputYear: row.input_year ?? 0,
    targetCloseWeek: row.target_close_week ?? '',
    targetCloseQuarter: row.target_close_quarter ?? '',
    isTayang: row.is_tayang ?? false,
    isShadow: row.is_shadow ?? false,
    parentLeadId: row.parent_lead_id,
    keterangan: row.keterangan ?? '',
    ketPenggarap: row.ket_penggarap ?? '',
    inputDate: row.input_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapTrackerRow(row: TrackerRow): TrackerEntry {
  return {
    id: row.id,
    funnelId: row.funnel_id,
    pic: row.pic ?? '',
    namaPaket: row.nama_paket ?? '',
    statusBaru: row.status_baru ?? '',
    forecastNetto: row.forecast_netto ?? 0,
    notes: row.notes ?? '',
    week: row.week ?? '',
    adminNotes: row.admin_notes ?? '',
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username ?? '',
    role: (row.role ?? 'guest') as UserRole,
    picName: row.pic_name ?? '',
    branch: row.branch ?? '',
    superiorId: row.superior_id,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
