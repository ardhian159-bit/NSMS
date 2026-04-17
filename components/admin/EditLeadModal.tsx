'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/lib/types'
import { TK_STATUS_MAP, TK_VALUES_ALL } from '@/lib/constants'
import { formatDotted, parseCurrency, calcDPP, calcForecastNetto } from '@/lib/dashboard/formatters'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface EditLeadModalProps {
  lead: Lead | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export default function EditLeadModal({ lead, open, onClose, onSaved }: EditLeadModalProps) {
  const [namaPaket, setNamaPaket] = useState('')
  const [instansi, setInstansi] = useState('')
  const [tk, setTk] = useState('')
  const [nilaiAnggaranStr, setNilaiAnggaranStr] = useState('')
  const [ppn, setPpn] = useState('PPN')
  const [perkiraanCb, setPerkiraanCb] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (lead) {
      setNamaPaket(lead.namaPaket)
      setInstansi(lead.instansi)
      setTk(lead.tk.toString())
      setNilaiAnggaranStr(lead.nilaiAnggaran > 0 ? formatDotted(lead.nilaiAnggaran) : '')
      setPpn(lead.ppn || 'PPN')
      setPerkiraanCb(lead.perkiraanCb > 0 ? lead.perkiraanCb.toString() : '')
      setKeterangan(lead.keterangan)
      setError('')
    }
  }, [lead])

  const brutto = parseCurrency(nilaiAnggaranStr)
  const cb = parseFloat(perkiraanCb) || 0
  const dpp = calcDPP(brutto, ppn)
  const forecastNetto = calcForecastNetto(brutto, ppn, cb)
  const status = tk ? (TK_STATUS_MAP[parseInt(tk)] ?? '') : ''

  const handleBruttoChange = (raw: string) => {
    const cleaned = raw.replace(/[^\d]/g, '')
    const num = parseInt(cleaned, 10) || 0
    setNilaiAnggaranStr(num > 0 ? formatDotted(num) : '')
  }

  const handleSave = async () => {
    if (!lead) return
    setError('')
    setLoading(true)

    try {
      const { error: updateErr } = await supabase
        .from('leads')
        .update({
          nama_paket: namaPaket,
          instansi,
          tk: parseInt(tk) || 0,
          status,
          nilai_anggaran: brutto,
          dpp,
          ppn,
          perkiraan_cb: cb,
          forecast_netto: forecastNetto,
          keterangan,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)

      if (updateErr) throw updateErr

      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Edit Lead
            {lead && (
              <span className="ml-2 text-xs font-[family-name:var(--font-dm-mono)] text-[#A0A09A]">
                {lead.funnelId}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 py-2">
          <div>
            <label className="block text-xs font-medium text-[#6B6B65] mb-1">Nama Paket</label>
            <input
              type="text"
              value={namaPaket}
              onChange={(e) => setNamaPaket(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B65] mb-1">Instansi</label>
            <input
              type="text"
              value={instansi}
              onChange={(e) => setInstansi(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B6B65] mb-1">TK (%)</label>
              <select value={tk} onChange={(e) => setTk(e.target.value)} className="form-select">
                {TK_VALUES_ALL.map((t) => (
                  <option key={t} value={t}>{t}% — {TK_STATUS_MAP[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B65] mb-1">Status</label>
              <input type="text" value={status} readOnly className="form-input bg-[#F5F5F2] text-[#A0A09A] cursor-not-allowed" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B6B65] mb-1">PPN</label>
              <select value={ppn} onChange={(e) => setPpn(e.target.value)} className="form-select">
                <option value="PPN">PPN</option>
                <option value="Non PPN">Non PPN</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B65] mb-1">CB (%)</label>
              <input
                type="number"
                value={perkiraanCb}
                onChange={(e) => setPerkiraanCb(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B65] mb-1">Brutto (Rp)</label>
              <input
                type="text"
                value={nilaiAnggaranStr}
                onChange={(e) => handleBruttoChange(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B65] mb-1">
              Forecast Netto <span className="text-green-600 text-[10px]">AUTO</span>
            </label>
            <input
              type="text"
              value={forecastNetto > 0 ? formatDotted(forecastNetto) : '0'}
              readOnly
              className="form-input bg-[#F5F5F2] text-[#A0A09A] cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B65] mb-1">Keterangan</label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={2}
              className="form-input resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#6B6B65] bg-[#F5F5F2] hover:bg-[#EBEBE7] border border-[#EBEBE7] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#1A1A18] hover:bg-[#2A2A28] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
