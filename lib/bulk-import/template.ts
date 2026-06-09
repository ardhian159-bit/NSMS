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

  // Style header: bold + highlight kolom wajib kuning, opsional abu, ignore abu gelap
  const headerRow = ws.getRow(1)
  LEADS_COLUMNS.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.font = { bold: true }
    const argb =
      c.import === 'required' ? 'FFFFF3C4' :   // kuning — wajib
      c.import === 'optional' ? 'FFEFEFEC' :    // abu terang — opsional
      'FFE0E0DC'                                // abu — auto/abaikan
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } }
    cell.alignment = { vertical: 'middle' }
  })
  headerRow.height = 20

  // Currency format
  ;['Nilai Anggaran', 'Forecast Netto'].forEach((h) => {
    const idx = LEADS_COLUMNS.findIndex((c) => c.header === h)
    if (idx >= 0) ws.getColumn(idx + 1).numFmt = '#,##0'
  })

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
