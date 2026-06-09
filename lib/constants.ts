// =============================================================================
// NSMS — Business Constants
// Source: legacy sales.html lines 812-825, dashboard.html badge styles
// =============================================================================

import type { FunnelStatus, TKValue } from './types'

/**
 * Maps TK percentage to human-readable status label.
 * Source: legacy `TK_STATUS_MAP` in sales.html
 */
export const TK_STATUS_MAP: Record<number, FunnelStatus> = {
  0:   'Gagal',
  5:   'Informasi Awal',
  10:  'Informasi Kebutuhan',
  25:  'Presentasi',
  50:  'Peluang 50:50',
  75:  'Hot Prospek',
  100: 'Closing',
}

/** Reverse map: status label → TK percentage */
export const STATUS_TK_MAP: Record<string, TKValue> = {
  'Gagal':                0,
  'Informasi Awal':       5,
  'Informasi Kebutuhan':  10,
  'Presentasi':           25,
  'Peluang 50:50':        50,
  'Hot Prospek':          75,
  'Closing':              100,
}

/** Ordered list of funnel statuses */
export const STATUS_LIST: FunnelStatus[] = [
  'Gagal',
  'Informasi Awal',
  'Informasi Kebutuhan',
  'Presentasi',
  'Peluang 50:50',
  'Hot Prospek',
  'Closing',
]

/** Valid TK values for dropdown selectors (excludes 0/Gagal for input) */
export const TK_VALUES: TKValue[] = [5, 10, 25, 50, 75, 100]

/** All TK values including 0 */
export const TK_VALUES_ALL: TKValue[] = [0, 5, 10, 25, 50, 75, 100]

/** Quarter options */
export const QUARTER_OPTIONS = ['Q1', 'Q2', 'Q3', 'Q4'] as const

/** Default jenis produk list */
export const JENIS_PRODUK_DEFAULT = [
  'Mebel / Furnitur',
  'Alat Tulis Kantor',
  'TIK & Periperal',
  'Buku Non Teks HET',
  'Buku Teks Pendamping HET',
  'Buku Teks Pendamping',
  'Buku Non Teks',
  'Buku PAUD',
  'Cetak, Kertas, dan Buku Tulis',
  'Alat Olahraga',
  'Alat Kesehatan / Kebersihan',
  'Alat Praktik',
  'Alat Praktik SMK',
  'Alat Peraga APE Luar',
  'Alat Peraga APE Dalam',
  'Alat Peraga LAB IPA',
  'Pakaian dan Seragam',
  'Elektronik',
  'Paket Project',
] as const

// =============================================================================
// Badge Color System — Light theme
// Design system: bg-{color}-50 text-{color}-600/700
// =============================================================================

export interface BadgeStyle {
  bg: string
  text: string
  strikethrough?: boolean
}

export const TK_BADGE_STYLES: Record<number, BadgeStyle> = {
  100: { bg: 'bg-green-50',    text: 'text-green-700' },
  75:  { bg: 'bg-red-50',      text: 'text-red-600' },
  50:  { bg: 'bg-orange-50',   text: 'text-orange-600' },
  25:  { bg: 'bg-blue-50',     text: 'text-blue-600' },
  10:  { bg: 'bg-purple-50',   text: 'text-purple-600' },
  5:   { bg: 'bg-neutral-100', text: 'text-neutral-600' },
  0:   { bg: 'bg-neutral-100', text: 'text-neutral-400', strikethrough: true },
}

/** Get badge style for a TK value, with fallback */
export function getTKBadgeStyle(tk: number): BadgeStyle {
  return TK_BADGE_STYLES[tk] ?? { bg: 'bg-neutral-100', text: 'text-neutral-500' }
}

// =============================================================================
// Default filter state
// =============================================================================

export const DEFAULT_FILTER_STATE: import('./types').FilterState = {
  quarter: [],
  tk: [],
  sumberDana: [],
  pic: [],
  wilayah: [],
  principal: [],
  ketPenggarap: [],
  search: '',
}

export const DEFAULT_PER_PAGE = 20
