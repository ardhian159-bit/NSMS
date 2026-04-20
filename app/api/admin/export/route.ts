import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get profile for role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Guest cannot export
  if (profile.role === 'guest') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const isAdmin = profile.role === 'admin' || profile.role === 'superadmin'

  // Fetch leads
  let leadsQuery = supabase.from('leads').select('*').order('created_at', { ascending: false })
  if (!isAdmin) {
    leadsQuery = leadsQuery.eq('owner_id', user.id)
  }
  const { data: leads } = await leadsQuery

  // Fetch tracker
  let trackerQuery = supabase.from('tracker').select('*').order('created_at', { ascending: false })
  if (!isAdmin) {
    trackerQuery = trackerQuery.eq('updated_by', user.id)
  }
  const { data: tracker } = await trackerQuery

  // Build workbook
  const wb = new ExcelJS.Workbook()

  const leadsSheet = wb.addWorksheet('Leads')
  if (leads && leads.length > 0) {
    leadsSheet.columns = Object.keys(leads[0]).map(key => ({ header: key, key, width: 18 }))
    leads.forEach(row => leadsSheet.addRow(row))

    // Style header row
    leadsSheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }
    })
  }

  const trackerSheet = wb.addWorksheet('Tracker')
  if (tracker && tracker.length > 0) {
    trackerSheet.columns = Object.keys(tracker[0]).map(key => ({ header: key, key, width: 18 }))
    tracker.forEach(row => trackerSheet.addRow(row))

    // Style header row
    trackerSheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }
    })
  }

  const buf = await wb.xlsx.writeBuffer()

  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const filename = `NSMS_Export_${dateStr}.xlsx`

  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
