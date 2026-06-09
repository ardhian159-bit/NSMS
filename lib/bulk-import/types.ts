// =============================================================================
// NSMS Bulk Import — shared types untuk engine
// =============================================================================

export type CellStatus = 'ok' | 'suggestion' | 'error'
export type RowStatus = 'valid' | 'suggestion' | 'error'

export interface CellResult {
  raw: string
  value: string
  status: CellStatus
  candidates?: string[]
  message?: string
}

export interface ProcessedRow {
  id: string
  rowNum: number
  /** keyed by header (importable columns) */
  cells: Record<string, CellResult>
  status: RowStatus
  /** resolved owner_id dari PIC match (null kalau belum) */
  ownerId: string | null
  /** ket_penggarap dari role PIC */
  ketPenggarap: string | null
  /** warning duplikat (Layer 1 file / Layer 2 DB) */
  dupWarning?: string
  /** flag: admin pilih tetap insert walau ada dup warning */
  forceInsert?: boolean
}

export interface ReferenceData {
  pics: { id: string; picName: string; role: string }[]
  principals: string[]
  sumberDana: string[]
  existingLeads: { funnelId: string; namaPaket: string; instansi: string; nilaiAnggaran: number }[]
}
