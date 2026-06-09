// =============================================================================
// NSMS Bulk Import — Parser CSV/Excel → raw rows (string semua)
// Client-side. ExcelJS untuk .xlsx, Papa Parse untuk .csv
// =============================================================================

import ExcelJS from 'exceljs'
import Papa from 'papaparse'

export interface ParsedFile {
  headers: string[]
  rows: Record<string, string>[]
}

function cellToString(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') {
    // ExcelJS rich text / hyperlink / formula result
    const o = v as Record<string, unknown>
    if ('text' in o) return String(o.text ?? '')
    if ('result' in o) return String(o.result ?? '')
    if ('hyperlink' in o) return String(o.text ?? o.hyperlink ?? '')
    return ''
  }
  return String(v).trim()
}

async function parseXlsx(file: File): Promise<ParsedFile> {
  const buf = await file.arrayBuffer()
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buf)
  const ws = wb.worksheets[0]
  if (!ws) return { headers: [], rows: [] }

  const headers: string[] = []
  const headerRow = ws.getRow(1)
  headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col - 1] = cellToString(cell.value)
  })

  const rows: Record<string, string>[] = []
  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum === 1) return // skip header
    const obj: Record<string, string> = {}
    let hasData = false
    headers.forEach((h, i) => {
      if (!h) return
      const v = cellToString(row.getCell(i + 1).value)
      obj[h] = v
      if (v) hasData = true
    })
    if (hasData) rows.push(obj)
  })

  return { headers: headers.filter(Boolean), rows }
}

function parseCsv(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        const headers = res.meta.fields ?? []
        const rows = (res.data as Record<string, string>[])
          .map((r) => {
            const obj: Record<string, string> = {}
            headers.forEach((h) => { obj[h] = (r[h] ?? '').toString().trim() })
            return obj
          })
          .filter((r) => Object.values(r).some((v) => v))
        resolve({ headers, rows })
      },
      error: (err) => reject(err),
    })
  })
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) return parseCsv(file)
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return parseXlsx(file)
  throw new Error('Format tidak didukung. Gunakan .xlsx atau .csv')
}
