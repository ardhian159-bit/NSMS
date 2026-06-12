'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Lead, TrackerEntry } from '@/lib/types'
import { TK_STATUS_MAP, TK_VALUES_ALL } from '@/lib/constants'
import { formatRupiahShort } from '@/lib/dashboard/formatters'
import { getWeekLabel } from '@/lib/dashboard/week'
import Badge from '@/components/dashboard/Badge'

interface UpdateFormProps {
  lead: Lead | null
  trackerHistory: TrackerEntry[]
  onUpdated: () => void
}

export default function UpdateForm({ lead, trackerHistory, onUpdated }: UpdateFormProps) {
  const [tk, setTk] = useState('')
  const [notes, setNotes] = useState('')
  const [week, setWeek] = useState(() => getWeekLabel(new Date()))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // When lead changes, reset form
  const [currentLeadId, setCurrentLeadId] = useState<number | null>(null)
  if (lead && lead.id !== currentLeadId) {
    setCurrentLeadId(lead.id)
    setTk(lead.tk.toString())
    setNotes('')
    setWeek(getWeekLabel(new Date()))
    setError('')
    setSuccess('')
  }

  const isLocked = lead ? (lead.tk === 100 || lead.tk === 0) : false

  if (!lead) {
    return (
      <div className="bg-surface rounded-lg border border-line p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-14 h-14 rounded-full bg-page flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <p className="font-semibold text-ink">Pilih project dari daftar kiri</p>
        <p className="text-sm text-ink-hint mt-1">untuk mulai mengisi update mingguan</p>
      </div>
    )
  }

  const status = tk ? (TK_STATUS_MAP[parseInt(tk)] ?? '') : ''

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!tk) return setError('Status baru wajib dipilih')
    if (!week) return setError('Week wajib diisi')

    setLoading(true)

    try {
      const netto = lead.forecastNetto

      // Upsert tracker (funnel_id + week = unique)
      const { error: trackerErr } = await supabase
        .from('tracker')
        .upsert({
          funnel_id: lead.funnelId,
          pic: lead.ownerName,
          nama_paket: lead.namaPaket,
          status_baru: status,
          forecast_netto: netto,
          notes,
          week,
        }, { onConflict: 'funnel_id,week' })

      if (trackerErr) throw trackerErr

      // Update lead status + tk
      const { error: leadErr } = await supabase
        .from('leads')
        .update({
          tk: parseInt(tk),
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)

      if (leadErr) throw leadErr

      setSuccess('Update berhasil disimpan!')
      setNotes('')
      onUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan update')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Lead Info Card */}
      <div className="bg-surface rounded-lg border border-line p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-[10px] font-[family-name:var(--font-dm-mono)] text-ink-hint">{lead.funnelId}</span>
            <h3 className="text-base font-semibold text-ink mt-0.5">{lead.namaPaket || '-'}</h3>
          </div>
          <Badge tk={lead.tk} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-[10px] text-ink-hint uppercase tracking-wider">Instansi</span>
            <p className="text-ink-muted">{lead.instansi || '-'}</p>
          </div>
          <div>
            <span className="text-[10px] text-ink-hint uppercase tracking-wider">Wilayah</span>
            <p className="text-ink-muted">{lead.wilayah || lead.kabKota || '-'}</p>
          </div>
          <div>
            <span className="text-[10px] text-ink-hint uppercase tracking-wider">Brutto</span>
            <p className="text-ink font-semibold">{formatRupiahShort(lead.nilaiAnggaran)}</p>
          </div>
          <div>
            <span className="text-[10px] text-ink-hint uppercase tracking-wider">Netto</span>
            <p className="text-ink font-semibold">{formatRupiahShort(lead.forecastNetto)}</p>
          </div>
        </div>
      </div>

      {/* Update Form */}
      <div className="bg-surface rounded-lg border border-line p-4">
        <h3 className="text-sm font-semibold text-ink mb-4 pb-3 border-b border-line">
          Update Mingguan
        </h3>

        {isLocked && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
            🔒 Lead ini terkunci. Hubungi admin untuk membuka kembali.
          </div>
        )}

        {error && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Status Baru *</label>
            <select value={tk} onChange={(e) => setTk(e.target.value)} className="form-select" disabled={isLocked || loading}>
              {TK_VALUES_ALL.map((t) => (
                <option key={t} value={t}>{t}% — {TK_STATUS_MAP[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Week</label>
            <input
              type="text"
              value={week}
              readOnly
              className="form-input font-[family-name:var(--font-dm-mono)] bg-page cursor-not-allowed text-ink-hint"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Catatan update minggu ini..."
            className="form-input resize-none"
            disabled={isLocked || loading}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLocked || loading}
          className="w-full px-5 py-2.5 rounded-lg text-sm font-semibold text-accent-on bg-accent-solid hover:bg-accent-solid-hover disabled:opacity-50 transition-colors"
        >
          {loading ? 'Menyimpan...' : 'Simpan Update'}
        </button>
      </div>

      {/* Tracker History */}
      <div className="bg-surface rounded-lg border border-line p-4">
        <h3 className="text-sm font-semibold text-ink mb-3">Riwayat Update</h3>
        {trackerHistory.length === 0 ? (
          <p className="text-sm text-ink-hint text-center py-4">Belum ada riwayat update</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-ink-hint uppercase border-b border-line">
                  <th className="text-left px-3 py-2 font-medium">Week</th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                  <th className="text-right px-3 py-2 font-medium">Netto</th>
                  <th className="text-left px-3 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {trackerHistory.map((t) => (
                  <tr key={`${t.funnelId}-${t.week}`} className="hover:bg-surface-alt">
                    <td className="px-3 py-2 font-[family-name:var(--font-dm-mono)] text-xs text-ink">{t.week}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded-full bg-page text-xs text-ink-muted">{t.statusBaru || '-'}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-ink">
                      {t.forecastNetto ? formatRupiahShort(t.forecastNetto) : '-'}
                    </td>
                    <td className="px-3 py-2 text-ink-muted max-w-[200px] truncate">{t.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
