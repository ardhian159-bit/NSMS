// =============================================================================
// NSMS Bulk Import — Template Excel generator (ExcelJS)
// Header identik dgn Download Leads (leadsColumns.ts). Kolom wajib highlight kuning.
// =============================================================================

import ExcelJS from 'exceljs'
import { LEADS_COLUMNS } from '@/lib/dashboard/leadsColumns'

// 2 baris contoh data dummy yang benar (keyed by header)
const SAMPLE_ROWS: Record<string, string | number>[] = [
  {
    'Nama Paket': 'Paket Pengadaan Buku Teks SD',
    'Instansi': 'Dinas Pendidikan Kabupaten Sleman',
    'Wilayah': 'Kab. Sleman',
    'Principal': 'IPE',
    'Sumber Dana': 'APBD',
    'Quarter': 'Q2',
    'Stage (TK)': 75,
    'Nilai Anggaran': 150000000,
    'Forecast Netto': '',
    'Kab/Kota': 'Kab. Sleman',
    'PPN': 'PPN',
    'Perkiraan CB (%)': 20,
    'PIC': 'Giri Suryanto',
    'Target Close': 'W26-2026',
  },
  {
    'Nama Paket': 'Paket Pengadaan Meubelair',
    'Instansi': 'SPPG Pontianak Kota',
    'Wilayah': 'Kota Pontianak',
    'Principal': 'ATS',
    'Sumber Dana': 'BELANJA MANDIRI',
    'Quarter': 'Q1',
    'Stage (TK)': 100,
    'Nilai Anggaran': 75000000,
    'Forecast Netto': 60000000,
    'Kab/Kota': 'Kota Pontianak',
    'PPN': 'Non PPN',
    'Perkiraan CB (%)': '',
    'PIC': 'Muhammad Rasyid Ridha',
    'Target Close': 'W5-2026',
  },
]

export async function downloadTemplate() {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Template Import')

  ws.columns = LEADS_COLUMNS.map((c) => ({ header: c.header, key: c.header, width: c.width }))

  // Baris contoh
  SAMPLE_ROWS.forEach((r) => ws.addRow(r))

  // Style header: highlight kolom wajib kuning cerah, opsional abu terang, auto abu gelap
  const headerRow = ws.getRow(1)
  LEADS_COLUMNS.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1)
    const fill =
      c.import === 'required' ? 'FFFFD43B' :   // kuning cerah — WAJIB
      c.import === 'optional' ? 'FFE7F5E9' :    // hijau pucat — opsional
      'FFD4D4CE'                                // abu gelap — auto/jangan diisi
    const fontColor = c.import === 'ignore' ? 'FF8A8A82' : 'FF1A1A18'
    cell.font = { bold: true, color: { argb: fontColor }, italic: c.import === 'ignore' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFBFBFB8' } } }
  })
  headerRow.height = 22

  // Currency format
  ;['Nilai Anggaran', 'Forecast Netto'].forEach((h) => {
    const idx = LEADS_COLUMNS.findIndex((c) => c.header === h)
    if (idx >= 0) ws.getColumn(idx + 1).numFmt = '#,##0'
  })

  // ===== Sheet Petunjuk (legenda) =====
  const guide = wb.addWorksheet('Petunjuk')
  guide.columns = [{ width: 22 }, { width: 60 }]
  const title = guide.addRow(['Petunjuk Pengisian'])
  title.getCell(1).font = { bold: true, size: 14 }
  guide.addRow([])

  const legend: [string, string, string][] = [
    ['FFFFD43B', 'WAJIB', 'Header kuning cerah — harus diisi, baris tidak bisa di-insert kalau kosong.'],
    ['FFE7F5E9', 'Opsional', 'Header hijau pucat — boleh dikosongkan.'],
    ['FFD4D4CE', 'Otomatis', 'Header abu (miring) — JANGAN diisi, dihitung sistem (Status, DPP, Funnel ID, Input Week).'],
  ]
  legend.forEach(([argb, label, desc]) => {
    const row = guide.addRow([label, desc])
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } }
    row.getCell(1).font = { bold: true }
    row.getCell(1).alignment = { horizontal: 'center' }
  })
  guide.addRow([])

  const wajib = LEADS_COLUMNS.filter((c) => c.import === 'required').map((c) => c.header)
  const opsional = LEADS_COLUMNS.filter((c) => c.import === 'optional').map((c) => c.header)
  guide.addRow(['Field wajib:', wajib.join(', ')]).getCell(1).font = { bold: true }
  guide.addRow(['Field opsional:', opsional.join(', ')]).getCell(1).font = { bold: true }
  guide.addRow([])
  const notes = [
    'Status dihitung otomatis dari Stage (TK).',
    'DPP & Forecast Netto dihitung otomatis dari Nilai Anggaran, PPN, dan Perkiraan CB (%).',
    'Provinsi dihitung otomatis dari Kab/Kota.',
    'PIC tanpa akun (rekanan) tetap bisa diisi — nama akan dipakai apa adanya.',
    'Header boleh beda kapital/spasi, tapi nama kolom harus sama.',
  ]
  notes.forEach((n) => guide.addRow(['•', n]))

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'NSMS_Template_Import_Leads.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}
