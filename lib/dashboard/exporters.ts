import ExcelJS from 'exceljs'
import type { Lead } from '@/lib/types'

export async function exportFilteredLeads(leads: Lead[], filters?: string) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Pipeline')

  ws.columns = [
    { header: 'Funnel ID', key: 'funnelId', width: 14 },
    { header: 'Nama Paket', key: 'namaPaket', width: 40 },
    { header: 'Instansi', key: 'instansi', width: 30 },
    { header: 'Wilayah', key: 'wilayah', width: 24 },
    { header: 'Principal', key: 'principal', width: 16 },
    { header: 'Sumber Dana', key: 'sumberDana', width: 16 },
    { header: 'Quarter', key: 'quarter', width: 10 },
    { header: 'Stage (TK)', key: 'tk', width: 10 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Nilai Anggaran', key: 'nilaiAnggaran', width: 18 },
    { header: 'Forecast Netto', key: 'forecastNetto', width: 18 },
    { header: 'Kab/Kota', key: 'kabKota', width: 20 },
    { header: 'PPN', key: 'ppn', width: 10 },
    { header: 'DPP', key: 'dpp', width: 18 },
    { header: 'Perkiraan CB (%)', key: 'perkiraanCb', width: 16 },
    { header: 'PIC', key: 'ownerName', width: 24 },
    { header: 'Target Close', key: 'targetCloseWeek', width: 14 },
    { header: 'Input Week', key: 'inputWeekLabel', width: 12 },
  ]

  leads.forEach(l => ws.addRow(l))

  // Style header
  ws.getRow(1).eachCell(cell => {
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }
  })

  // Number format untuk currency columns (full value, bukan truncated)
  const currencyCols = ['nilaiAnggaran', 'forecastNetto', 'dpp']
  currencyCols.forEach(key => {
    const col = ws.getColumn(key)
    col.numFmt = '#,##0'
  })

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })

  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const suffix = filters ? `_${filters}` : ''
  const filename = `NSMS_Dashboard${suffix}_${dateStr}.xlsx`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
