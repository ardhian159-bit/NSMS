import ExcelJS from 'exceljs'
import type { Lead } from '@/lib/types'
import { LEADS_COLUMNS, CURRENCY_KEYS } from './leadsColumns'

export async function exportFilteredLeads(leads: Lead[], filters?: string) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Pipeline')

  // Kolom dari single source of truth (selaras dgn template bulk-import)
  ws.columns = LEADS_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }))

  leads.forEach(l => ws.addRow(l))

  // Style header
  ws.getRow(1).eachCell(cell => {
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }
  })

  // Number format untuk currency columns (full value, bukan truncated)
  CURRENCY_KEYS.forEach(key => {
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
