// =============================================================================
// NSMS Bulk Import — insert ke Supabase + report
// Bulk-safe funnel_id generation (in-memory increment, anti-collision).
// =============================================================================

import ExcelJS from 'exceljs'
import { supabase } from '@/lib/supabase'
import { FUNNEL_PREFIX_MAP } from '@/lib/funnel/prefixMap'
import { TK_STATUS_MAP } from '@/lib/constants'
import { calcDPP, calcForecastNetto } from '@/lib/dashboard/formatters'
import { getWeekLabel } from '@/lib/dashboard/week'
import { provinsiOf } from './validator'
import type { ProcessedRow } from './types'

export interface InsertResultRow {
  rowNum: number
  funnelId: string
  namaPaket: string
  ok: boolean
  error?: string
}

async function buildFunnelGenerator() {
  const { data } = await supabase.from('leads').select('funnel_id')
  const prefixSeq = new Map<string, number>()
  ;(data ?? []).forEach((r: { funnel_id: string }) => {
    const m = (r.funnel_id || '').match(/^(.+)-(\d+)$/)
    if (m) {
      const p = m[1].toUpperCase()
      prefixSeq.set(p, Math.max(prefixSeq.get(p) ?? 0, parseInt(m[2], 10)))
    }
  })
  return function nextFunnel(picName: string): string {
    const upper = (picName || 'UNKNOWN').toUpperCase().trim()
    let prefix = FUNNEL_PREFIX_MAP[upper] ?? upper.split(' ')[0].substring(0, 3)
    prefix = prefix.toUpperCase()
    const next = (prefixSeq.get(prefix) ?? 0) + 1
    prefixSeq.set(prefix, next)
    return `${prefix}-${String(next).padStart(4, '0')}`
  }
}

export async function bulkInsert(rows: ProcessedRow[]): Promise<InsertResultRow[]> {
  const nextFunnel = await buildFunnelGenerator()
  const now = new Date()
  const weekLabel = getWeekLabel(now)
  const inputWeek = parseInt(weekLabel.replace('W', '').split('-')[0], 10)

  const items = rows.map((r) => {
    const g = (k: string) => r.cells[k]?.value ?? ''
    const tk = parseInt(g('Stage (TK)'), 10) || 0
    const ppn = g('PPN') || 'PPN'
    const nilai = parseFloat(g('Nilai Anggaran')) || 0
    const cb = parseFloat(g('Perkiraan CB (%)')) || 0
    const dpp = calcDPP(nilai, ppn)
    const nettoManual = g('Forecast Netto')
    const netto = nettoManual ? parseFloat(nettoManual) || 0 : calcForecastNetto(nilai, ppn, cb)
    const kabKota = g('Kab/Kota')
    const funnelId = nextFunnel(g('PIC'))
    return {
      rowNum: r.rowNum,
      namaPaket: g('Nama Paket'),
      funnelId,
      payload: {
        funnel_id: funnelId,
        nama_paket: g('Nama Paket'),
        instansi: g('Instansi'),
        wilayah: g('Wilayah'),
        provinsi: provinsiOf(kabKota),
        kab_kota: kabKota,
        principal: g('Principal'),
        sumber_dana: g('Sumber Dana'),
        quarter: g('Quarter'),
        tk,
        status: TK_STATUS_MAP[tk] ?? '',
        nilai_anggaran: nilai,
        dpp,
        forecast_netto: netto,
        ppn,
        perkiraan_cb: cb,
        owner_name: g('PIC'),
        owner_id: r.ownerId,
        ket_penggarap: r.ketPenggarap,
        target_close_week: g('Target Close') || null,
        target_close_quarter: g('Quarter'),
        input_week_label: weekLabel,
        input_week: inputWeek,
        input_year: now.getFullYear(),
        input_date: now.toISOString().split('T')[0],
        keterangan: 'Bulk import',
      },
    }
  })

  const results: InsertResultRow[] = []
  const BATCH = 100
  for (let i = 0; i < items.length; i += BATCH) {
    const chunk = items.slice(i, i + BATCH)
    const { error } = await supabase.from('leads').insert(chunk.map((c) => c.payload))
    if (error) {
      // retry per-baris untuk tahu yang gagal
      for (const c of chunk) {
        const { error: e2 } = await supabase.from('leads').insert(c.payload)
        results.push({ rowNum: c.rowNum, funnelId: c.funnelId, namaPaket: c.namaPaket, ok: !e2, error: e2?.message })
      }
    } else {
      chunk.forEach((c) => results.push({ rowNum: c.rowNum, funnelId: c.funnelId, namaPaket: c.namaPaket, ok: true }))
    }
  }
  return results
}

export async function downloadInsertReport(results: InsertResultRow[]) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Report')
  ws.columns = [
    { header: 'Baris', key: 'rowNum', width: 8 },
    { header: 'Funnel ID', key: 'funnelId', width: 14 },
    { header: 'Nama Paket', key: 'namaPaket', width: 40 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Error', key: 'error', width: 50 },
  ]
  results.forEach((r) => ws.addRow({ ...r, status: r.ok ? 'OK' : 'GAGAL', error: r.error ?? '' }))
  ws.getRow(1).eachCell((c) => { c.font = { bold: true } })
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `NSMS_Import_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
