'use client'

import { useState, useCallback } from 'react'
import { Download, Upload, FileSpreadsheet, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { downloadTemplate } from '@/lib/bulk-import/template'
import { parseFile, type ParsedFile } from '@/lib/bulk-import/parser'
import type { PicRef, ExistingLeadRef } from './page'

interface BulkImportClientProps {
  pics: PicRef[]
  principals: string[]
  sumberDana: string[]
  existingLeads: ExistingLeadRef[]
}

export default function BulkImportClient(_props: BulkImportClientProps) {
  const [parsed, setParsed] = useState<ParsedFile | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setError('')
    setLoading(true)
    try {
      const result = await parseFile(file)
      if (result.rows.length === 0) {
        setError('File kosong atau tidak ada baris data.')
        setParsed(null)
      } else {
        setParsed(result)
        setFileName(file.name)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membaca file')
      setParsed(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    e.target.value = ''
  }

  const reset = () => { setParsed(null); setFileName(''); setError('') }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-1.5 rounded-lg text-[#A0A09A] hover:text-[#1A1A18] hover:bg-[#F5F5F2] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A18]">Import Massal Leads</h1>
          <p className="text-sm text-[#A0A09A] mt-0.5">Upload Excel/CSV → normalisasi → insert ke pipeline</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#EBEBE7] bg-white text-sm font-medium text-[#064E3B] hover:bg-[#F0FDF4] hover:border-[#064E3B] transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>

        <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A1A18] text-white text-sm font-medium hover:bg-[#2A2A28] transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          {parsed ? 'Upload Ulang' : 'Upload File'}
          <input type="file" accept=".xlsx,.xls,.csv" onChange={onInputChange} className="hidden" />
        </label>

        {parsed && (
          <button onClick={reset} className="text-sm text-[#6B6B65] hover:text-[#1A1A18] hover:underline">
            Hapus
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      {loading && (
        <div className="px-4 py-2.5 rounded-lg bg-[#F5F5F2] text-[#6B6B65] text-sm">Memproses file...</div>
      )}

      {/* Empty state */}
      {!parsed && !loading && (
        <div className="border-2 border-dashed border-[#EBEBE7] rounded-xl py-16 flex flex-col items-center justify-center text-center">
          <FileSpreadsheet className="w-10 h-10 text-[#A0A09A] mb-3" />
          <p className="text-sm font-medium text-[#1A1A18]">Belum ada file</p>
          <p className="text-xs text-[#A0A09A] mt-1 max-w-sm">
            Download template dulu, isi data, lalu upload. Header file harus sama dengan template (= hasil Download Leads).
          </p>
        </div>
      )}

      {/* Raw preview */}
      {parsed && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1A1A18]">
              Preview — {fileName}
            </h3>
            <span className="text-xs text-[#A0A09A]">{parsed.rows.length} baris · {parsed.headers.length} kolom</span>
          </div>
          <div className="border border-[#EBEBE7] rounded-lg overflow-auto max-h-[60vh]">
            <table className="text-xs min-w-max">
              <thead className="sticky top-0 bg-[#FAFAF8] z-10">
                <tr className="border-b border-[#EBEBE7]">
                  <th className="px-2 py-2 text-left font-medium text-[#A0A09A] w-10">#</th>
                  {parsed.headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-[#6B6B65] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBE7]">
                {parsed.rows.slice(0, 200).map((row, i) => (
                  <tr key={i} className="hover:bg-[#FAFAF8]">
                    <td className="px-2 py-1.5 text-[#A0A09A]">{i + 1}</td>
                    {parsed.headers.map((h) => (
                      <td key={h} className="px-3 py-1.5 text-[#1A1A18] whitespace-nowrap max-w-[240px] truncate">{row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsed.rows.length > 200 && (
            <p className="text-xs text-[#A0A09A]">Menampilkan 200 dari {parsed.rows.length} baris.</p>
          )}
        </div>
      )}
    </div>
  )
}
