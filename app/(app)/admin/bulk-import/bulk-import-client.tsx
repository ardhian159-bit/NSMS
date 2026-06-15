'use client'

import { useState, useCallback, useMemo } from 'react'
import { Download, Upload, FileSpreadsheet, ArrowLeft, Check, AlertTriangle, X, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { downloadTemplate } from '@/lib/bulk-import/template'
import { parseFile } from '@/lib/bulk-import/parser'
import { processRows, computeStatus } from '@/lib/bulk-import/validator'
import { detectFileDuplicates, detectDbDuplicates } from '@/lib/bulk-import/dedupe'
import { bulkInsert, downloadInsertReport, type InsertResultRow } from '@/lib/bulk-import/insert'
import { LEADS_COLUMNS } from '@/lib/dashboard/leadsColumns'
// Header normalisasi: case-insensitive, abaikan spasi & titik/underscore
const normHeader = (h: string) => h.toLowerCase().replace(/\s+/g, '').replace(/[._]/g, '')
const HEADER_CANON = new Map(LEADS_COLUMNS.map((c) => [normHeader(c.header), c.header]))
const REQUIRED_HEADERS = LEADS_COLUMNS.filter((c) => c.import === 'required').map((c) => c.header)
import { normStr } from '@/lib/bulk-import/normalizer'
import type { ProcessedRow, ReferenceData } from '@/lib/bulk-import/types'
import type { PicRef, ExistingLeadRef, KnownOwnerRef } from './page'

interface BulkImportClientProps {
  pics: PicRef[]
  principals: string[]
  sumberDana: string[]
  existingLeads: ExistingLeadRef[]
  knownOwners: KnownOwnerRef[]
}

const DISPLAY_HEADERS = LEADS_COLUMNS.filter((c) => c.import !== 'ignore').map((c) => c.header)
const FUZZY_HEADERS = new Set(['Principal', 'Sumber Dana', 'Kab/Kota', 'Wilayah', 'PIC'])

export default function BulkImportClient({ pics, principals, sumberDana, existingLeads, knownOwners }: BulkImportClientProps) {
  const ref: ReferenceData = useMemo(() => ({ pics, principals, sumberDana, existingLeads, knownOwners }), [pics, principals, sumberDana, existingLeads, knownOwners])
  const picByName = useMemo(() => new Map(pics.map((p) => [normStr(p.picName), p])), [pics])
  const knownOwnerByName = useMemo(() => new Map(knownOwners.map((o) => [normStr(o.name), o])), [knownOwners])

  // Cascade PIC: profiles (akun) → nama di DB → nama baru (rekanan).
  const resolvePicInfo = useCallback((value: string): { ownerId: string | null; ket: string | null } => {
    const norm = normStr(value)
    const prof = picByName.get(norm)
    if (prof) return { ownerId: prof.id, ket: prof.penggarap ?? null }
    const known = knownOwnerByName.get(norm)
    if (known) return { ownerId: known.ownerId, ket: known.ketPenggarap }
    return { ownerId: null, ket: 'REKANAN' }
  }, [picByName, knownOwnerByName])

  const [rows, setRows] = useState<ProcessedRow[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'review' | 'error'>('all')
  const [editing, setEditing] = useState<{ rowId: string; header: string } | null>(null)
  const [inserting, setInserting] = useState(false)
  const [results, setResults] = useState<InsertResultRow[] | null>(null)

  // --- parse + process ---
  const handleFile = useCallback(async (file: File) => {
    setError(''); setLoading(true); setResults(null)
    try {
      const parsed = await parseFile(file)
      if (parsed.rows.length === 0) { setError('File kosong / tidak ada baris data.'); setRows(null); return }

      // Validasi kolom wajib (header dinormalisasi)
      const presentCanon = new Set<string>()
      parsed.headers.forEach((h) => { const c = HEADER_CANON.get(normHeader(h)); if (c) presentCanon.add(c) })
      const missing = REQUIRED_HEADERS.filter((h) => !presentCanon.has(h))
      if (missing.length > 0) {
        setError(`Kolom wajib tidak ditemukan di file: ${missing.join(', ')}. Pastikan header sama persis dengan template (Download Template).`)
        setRows(null); return
      }

      // Remap header ke nama kanonik (toleran spasi/kapital)
      const remapped = parsed.rows.map((row) => {
        const o: Record<string, string> = {}
        for (const [k, v] of Object.entries(row)) o[HEADER_CANON.get(normHeader(k)) ?? k] = v
        return o
      })
      setRows(processRows(remapped, ref))
      setFileName(file.name)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membaca file'); setRows(null)
    } finally { setLoading(false) }
  }, [ref])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''
  }

  // --- recompute dedupe + status setelah edit ---
  const recompute = (draft: ProcessedRow[]) => {
    draft.forEach((r) => { r.dupWarning = undefined })
    detectFileDuplicates(draft)
    detectDbDuplicates(draft, existingLeads)
    draft.forEach((r) => { r.status = computeStatus(r) })
  }

  const cloneRows = (rs: ProcessedRow[]) => rs.map((r) => ({ ...r, cells: { ...r.cells } }))

  const resolveCell = (rowId: string, header: string, value: string) => {
    if (!rows) return
    const draft = cloneRows(rows)
    const row = draft.find((r) => r.id === rowId)
    if (row) {
      row.cells[header] = { ...row.cells[header], value, status: 'ok', message: undefined }
      if (header === 'PIC') {
        const info = resolvePicInfo(value)
        row.ownerId = info.ownerId
        row.ketPenggarap = info.ket
      }
    }
    recompute(draft)
    setRows(draft); setEditing(null)
  }

  const acceptDup = (rowId: string) => {
    if (!rows) return
    const draft = cloneRows(rows)
    const row = draft.find((r) => r.id === rowId)
    if (row) row.forceInsert = true
    draft.forEach((r) => { r.status = computeStatus(r) })
    setRows(draft)
  }

  const acceptAllSuggestions = () => {
    if (!rows) return
    const draft = cloneRows(rows)
    draft.forEach((r) => {
      Object.entries(r.cells).forEach(([h, c]) => {
        if (c.status === 'suggestion') {
          const v = c.candidates?.[0] ?? c.value
          r.cells[h] = { ...c, value: v, status: 'ok', message: undefined }
          if (h === 'PIC') {
            const info = resolvePicInfo(v)
            r.ownerId = info.ownerId
            r.ketPenggarap = info.ket
          }
        }
      })
      if (r.dupWarning) r.forceInsert = true
    })
    recompute(draft)
    setRows(draft)
  }

  const removeRow = (rowId: string) => {
    if (!rows) return
    const draft = cloneRows(rows).filter((r) => r.id !== rowId)
    recompute(draft); setRows(draft)
  }

  const removeAllErrors = () => {
    if (!rows) return
    const draft = cloneRows(rows).filter((r) => r.status !== 'error')
    recompute(draft); setRows(draft)
  }

  const reset = () => { setRows(null); setFileName(''); setError(''); setResults(null) }

  // --- counts ---
  const counts = useMemo(() => {
    const c = { valid: 0, suggestion: 0, error: 0 }
    rows?.forEach((r) => { c[r.status]++ })
    return c
  }, [rows])

  const canInsert = rows !== null && counts.error === 0 && counts.suggestion === 0 && rows.length > 0

  const doInsert = async () => {
    if (!rows) return
    setInserting(true)
    try {
      const valid = rows.filter((r) => r.status === 'valid')
      const res = await bulkInsert(valid)
      setResults(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal insert')
    } finally { setInserting(false) }
  }

  const visibleRows = useMemo(() => {
    if (!rows) return []
    if (filter === 'review') return rows.filter((r) => r.status === 'suggestion')
    if (filter === 'error') return rows.filter((r) => r.status === 'error')
    return rows
  }, [rows, filter])

  // ============================ RENDER ============================
  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-1.5 rounded-lg text-ink-hint hover:text-ink hover:bg-page"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-xl font-semibold text-ink">Import Massal Leads</h1>
          <p className="text-sm text-ink-hint mt-0.5">Upload Excel/CSV → normalisasi → insert ke pipeline</p>
        </div>
      </div>

      {/* Toolbar */}
      {!results && (
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line bg-surface text-sm font-medium text-brand hover:bg-brand-soft hover:border-brand">
            <Download className="w-4 h-4" /> Download Template
          </button>
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-solid text-accent-on text-sm font-medium hover:bg-accent-solid-hover cursor-pointer">
            <Upload className="w-4 h-4" /> {rows ? 'Upload Ulang' : 'Upload File'}
            <input type="file" accept=".xlsx,.xls,.csv" onChange={onInputChange} className="hidden" />
          </label>
          {rows && <button onClick={reset} className="text-sm text-ink-muted hover:text-ink hover:underline">Hapus</button>}
        </div>
      )}

      {error && <div className="px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
      {loading && <div className="px-4 py-2.5 rounded-lg bg-page text-ink-muted text-sm">Memproses file...</div>}

      {/* Empty state */}
      {!rows && !loading && !results && (
        <div className="border-2 border-dashed border-line rounded-xl py-16 flex flex-col items-center justify-center text-center">
          <FileSpreadsheet className="w-10 h-10 text-ink-hint mb-3" />
          <p className="text-sm font-medium text-ink">Belum ada file</p>
          <p className="text-xs text-ink-hint mt-1 max-w-sm">Download template, isi data, lalu upload. Header file harus sama dengan template (= hasil Download Leads).</p>
        </div>
      )}

      {/* ===== RESULT REPORT (Stage 4) ===== */}
      {results && (
        <div className="space-y-4">
          {(() => {
            const ok = results.filter((r) => r.ok).length
            const fail = results.length - ok
            return (
              <div className={`rounded-lg border p-4 ${fail === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <p className="text-sm font-semibold text-ink">Insert selesai — {ok} berhasil, {fail} gagal</p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <button onClick={() => downloadInsertReport(results)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-medium text-brand hover:bg-brand-soft">
                    <Download className="w-3.5 h-3.5" /> Download Report
                  </button>
                  <button onClick={reset} className="px-3 py-1.5 rounded-lg bg-accent-solid text-accent-on text-xs font-medium hover:bg-accent-solid-hover">Import Lagi</button>
                  <Link href="/monitoring" className="px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-medium text-ink-muted hover:bg-page">Lihat Monitoring</Link>
                </div>
              </div>
            )
          })()}
          {results.some((r) => !r.ok) && (
            <div className="border border-line rounded-lg overflow-auto max-h-[40vh]">
              <table className="text-xs w-full">
                <thead className="bg-surface-alt sticky top-0"><tr className="border-b border-line text-left text-ink-muted">
                  <th className="px-3 py-2">Baris</th><th className="px-3 py-2">Funnel ID</th><th className="px-3 py-2">Nama Paket</th><th className="px-3 py-2">Error</th>
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {results.filter((r) => !r.ok).map((r) => (
                    <tr key={r.rowNum}><td className="px-3 py-1.5">{r.rowNum}</td><td className="px-3 py-1.5 font-mono">{r.funnelId}</td><td className="px-3 py-1.5">{r.namaPaket}</td><td className="px-3 py-1.5 text-red-600">{r.error}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== SUMMARY + TABLE (Stage 3) ===== */}
      {rows && !results && (
        <>
          {/* Summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface rounded-lg border border-line p-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-ink-hint">{fileName}</span>
              <span className="flex items-center gap-1.5 text-green-700"><Check className="w-4 h-4" /> {counts.valid} valid</span>
              <span className="flex items-center gap-1.5 text-amber-600"><AlertTriangle className="w-4 h-4" /> {counts.suggestion} review</span>
              <span className="flex items-center gap-1.5 text-red-600"><X className="w-4 h-4" /> {counts.error} error</span>
            </div>
            <div className="flex items-center gap-2">
              {counts.suggestion > 0 && <button onClick={acceptAllSuggestions} className="px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-medium text-ink-muted hover:bg-page">Terima semua suggestion</button>}
              {counts.error > 0 && <button onClick={removeAllErrors} className="px-3 py-1.5 rounded-lg border border-red-200 bg-surface text-xs font-medium text-red-600 hover:bg-red-50">Hapus semua error</button>}
              <button onClick={doInsert} disabled={!canInsert || inserting} className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-brand-solid text-white text-sm font-semibold hover:bg-brand-solid-hover disabled:opacity-40 disabled:cursor-not-allowed">
                {inserting && <Loader2 className="w-4 h-4 animate-spin" />}
                Insert {counts.valid} Leads
              </button>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1 bg-page rounded-full p-0.5 w-fit">
            {([['all', 'Semua'], ['review', 'Perlu Review'], ['error', 'Error']] as const).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)} className={`text-xs px-3 py-1 rounded-full font-medium ${filter === k ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}>{label}</button>
            ))}
          </div>

          {/* Table */}
          <div className="border border-line rounded-lg overflow-auto max-h-[60vh]">
            <table className="text-xs min-w-max">
              <thead className="sticky top-0 bg-surface-alt z-10">
                <tr className="border-b border-line">
                  <th className="px-2 py-2 text-left font-medium text-ink-hint w-8">#</th>
                  <th className="px-2 py-2 text-left font-medium text-ink-hint w-8"></th>
                  {DISPLAY_HEADERS.map((h) => <th key={h} className="px-3 py-2 text-left font-medium text-ink-muted whitespace-nowrap">{h}</th>)}
                  <th className="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleRows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-alt">
                    <td className="px-2 py-1.5 text-ink-hint">{row.rowNum}</td>
                    <td className="px-2 py-1.5">
                      {row.status === 'valid' && <Check className="w-3.5 h-3.5 text-green-600" />}
                      {row.status === 'suggestion' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      {row.status === 'error' && <X className="w-3.5 h-3.5 text-red-500" />}
                    </td>
                    {DISPLAY_HEADERS.map((h) => {
                      const cell = row.cells[h]
                      const isEditing = editing?.rowId === row.id && editing?.header === h
                      const bg = cell?.status === 'error' ? 'bg-red-50' : cell?.status === 'suggestion' ? 'bg-amber-50' : ''
                      const needsFix = cell && cell.status !== 'ok'
                      return (
                        <td key={h} className={`px-3 py-1.5 relative whitespace-nowrap max-w-[220px] ${bg}`}>
                          <button
                            onClick={() => setEditing({ rowId: row.id, header: h })}
                            className={`text-left truncate block max-w-[210px] cursor-pointer hover:underline decoration-dotted ${needsFix ? 'underline decoration-ink-hint' : 'decoration-line'} ${cell?.value ? 'text-ink' : 'text-ink-hint italic'}`}
                            title={cell?.message}
                          >
                            {cell?.value || cell?.raw || '—'}
                          </button>
                          {isEditing && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setEditing(null)} />
                              <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-surface border border-line rounded-lg shadow-lg p-2 space-y-1">
                                {cell?.message && <p className="text-[10px] text-red-500 px-1">{cell.message}</p>}
                                {FUZZY_HEADERS.has(h) && cell?.candidates?.map((cand) => (
                                  <button key={cand} onClick={() => resolveCell(row.id, h, cand)} className="block w-full text-left px-2 py-1.5 rounded hover:bg-page text-ink">{cand}</button>
                                ))}
                                <input
                                  autoFocus
                                  defaultValue={cell?.value || cell?.raw || ''}
                                  onKeyDown={(e) => { if (e.key === 'Enter') resolveCell(row.id, h, (e.target as HTMLInputElement).value.trim()) }}
                                  placeholder="Ketik manual + Enter"
                                  className="w-full rounded border border-line px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent-solid"
                                />
                              </div>
                            </>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-2 py-1.5">
                      <button onClick={() => removeRow(row.id)} className="text-ink-hint hover:text-red-500" title="Hapus baris"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dup warnings */}
          {rows.some((r) => r.dupWarning) && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-amber-600">⚠ Kemungkinan duplikat ({rows.filter((r) => r.dupWarning).length})</p>
              {rows.filter((r) => r.dupWarning).slice(0, 50).map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                  <span className="text-ink-muted">Baris {r.rowNum}: {r.cells['Nama Paket']?.value} — {r.dupWarning}</span>
                  {!r.forceInsert
                    ? <button onClick={() => acceptDup(r.id)} className="text-brand font-medium hover:underline">Tetap insert</button>
                    : <span className="text-green-700 font-medium">✓ akan di-insert</span>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
