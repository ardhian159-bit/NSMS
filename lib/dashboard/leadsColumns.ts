// =============================================================================
// NSMS — Single source of truth kolom leads
// Dipakai oleh: exporters.ts (Download Leads) + bulk-import template
// Header WAJIB identik antara export & template → round-trip mulus.
// =============================================================================

import type { Lead } from '@/lib/types'

export type ImportMode = 'required' | 'optional' | 'ignore'

export interface LeadColumn {
  /** Header human-readable — identik di export & template */
  header: string
  /** Key di objek Lead (untuk export) */
  key: keyof Lead
  width: number
  /** Semantik saat import: wajib / opsional / abaikan (auto-derive) */
  import: ImportMode
}

export const LEADS_COLUMNS: LeadColumn[] = [
  { header: 'Funnel ID',        key: 'funnelId',         width: 14, import: 'ignore'   },
  { header: 'Nama Paket',       key: 'namaPaket',        width: 40, import: 'required' },
  { header: 'Instansi',         key: 'instansi',         width: 30, import: 'required' },
  { header: 'Wilayah',          key: 'wilayah',          width: 24, import: 'required' },
  { header: 'Principal',        key: 'principal',        width: 16, import: 'required' },
  { header: 'Sumber Dana',      key: 'sumberDana',       width: 16, import: 'required' },
  { header: 'Quarter',          key: 'quarter',          width: 10, import: 'required' },
  { header: 'Stage (TK)',       key: 'tk',               width: 10, import: 'required' },
  { header: 'Status',           key: 'status',           width: 20, import: 'ignore'   },
  { header: 'Nilai Anggaran',   key: 'nilaiAnggaran',    width: 18, import: 'required' },
  { header: 'Forecast Netto',   key: 'forecastNetto',    width: 18, import: 'optional' },
  { header: 'Kab/Kota',         key: 'kabKota',          width: 20, import: 'required' },
  { header: 'PPN',              key: 'ppn',              width: 10, import: 'required' },
  { header: 'DPP',              key: 'dpp',              width: 18, import: 'ignore'   },
  { header: 'Perkiraan CB (%)', key: 'perkiraanCb',      width: 16, import: 'required' },
  { header: 'PIC',              key: 'ownerName',        width: 24, import: 'required' },
  { header: 'Target Close',     key: 'targetCloseWeek',  width: 14, import: 'optional' },
  { header: 'Input Week',       key: 'inputWeekLabel',   width: 12, import: 'ignore'   },
]

/** Kolom currency (format #,##0) */
export const CURRENCY_KEYS: (keyof Lead)[] = ['nilaiAnggaran', 'forecastNetto', 'dpp']

/** Header yang dipakai import (required + optional), urut sesuai kolom */
export const IMPORTABLE_HEADERS = LEADS_COLUMNS.filter((c) => c.import !== 'ignore').map((c) => c.header)
