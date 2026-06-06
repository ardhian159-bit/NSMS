'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TK_STATUS_MAP, TK_VALUES, QUARTER_OPTIONS } from '@/lib/constants'
import { calcDPP, calcForecastNetto, formatDotted, parseCurrency } from '@/lib/dashboard/formatters'
import { getWeekLabel } from '@/lib/dashboard/week'
import { PROVINSI_LIST, getKabKotaList } from '@/lib/region-data'
import { generateFunnelId } from '@/lib/funnel/generateFunnelId'
import type { AppSettings, Lead, Profile } from '@/lib/types'

interface InputLeadFormProps {
  /** Pre-fill PIC as read-only (pipeline/sales mode) */
  defaultOwnerName?: string
  /** Show PIC as dropdown with these options (admin mode) */
  picOptions?: string[]
  /** Settings for dropdowns */
  settings: AppSettings
  /** Current user profile */
  profile: Profile
  /** Callback after successful submit */
  onSuccess?: () => void
  /** Lead to edit (switches to edit mode) */
  editLead?: Lead | null
  /** Cancel edit callback */
  onCancelEdit?: () => void
}

interface FormData {
  namaPaket: string
  instansi: string
  provinsi: string
  kabKota: string
  wilayah: string
  sumberDana: string
  quarter: string
  tk: string
  principal: string
  jenisProduk: string
  produk: string
  qty: string
  satuan: string
  ppn: string
  perkiraanCb: string
  nilaiAnggaran: string
  keterangan: string
  ownerName: string
}

// Auto-label penggarap dari role user — invisible ke user, di-set saat insert.
// admin/superadmin → null (bisa di-set manual via Control Panel/PUSAT).
const KET_PENGGARAP_MAP: Record<string, string> = {
  sales: 'SP',
  mp: 'MP',
  am: 'MP',
  dirut: 'MP',
  rekanan: 'REKANAN',
}

const INITIAL_FORM: FormData = {
  namaPaket: '',
  instansi: '',
  provinsi: '',
  kabKota: '',
  wilayah: '',
  sumberDana: '',
  quarter: '',
  tk: '',
  principal: '',
  jenisProduk: '',
  produk: '',
  qty: '',
  satuan: '',
  ppn: 'PPN',
  perkiraanCb: '',
  nilaiAnggaran: '',
  keterangan: '',
  ownerName: '',
}

export default function InputLeadForm({
  defaultOwnerName,
  picOptions,
  settings,
  profile,
  onSuccess,
  editLead,
  onCancelEdit,
}: InputLeadFormProps) {
  const [form, setForm] = useState<FormData>({
    ...INITIAL_FORM,
    ownerName: defaultOwnerName ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isEditMode = !!editLead

  useEffect(() => {
    if (editLead) {
      setForm({
        namaPaket: editLead.namaPaket || '',
        instansi: editLead.instansi || '',
        provinsi: editLead.provinsi || '',
        kabKota: editLead.kabKota || '',
        wilayah: editLead.wilayah || editLead.kabKota || '',
        sumberDana: editLead.sumberDana || '',
        quarter: editLead.quarter || '',
        tk: editLead.tk.toString(),
        principal: editLead.principal || '',
        jenisProduk: editLead.jenisProduk || '',
        produk: editLead.produk || '',
        qty: editLead.qty ? editLead.qty.toString() : '',
        satuan: editLead.satuan || '',
        ppn: editLead.ppn || 'PPN',
        perkiraanCb: editLead.perkiraanCb ? editLead.perkiraanCb.toString() : '',
        nilaiAnggaran: editLead.nilaiAnggaran > 0 ? formatDotted(editLead.nilaiAnggaran) : '',
        keterangan: editLead.keterangan || '',
        ownerName: editLead.ownerName || defaultOwnerName || '',
      })
      setError('')
      setSuccess('')
    }
  }, [editLead])

  // Auto-calc netto
  const brutto = parseCurrency(form.nilaiAnggaran)
  const cb = parseFloat(form.perkiraanCb) || 0
  const dpp = calcDPP(brutto, form.ppn)
  const forecastNetto = calcForecastNetto(brutto, form.ppn, cb)

  // Auto-set status from TK
  const status = form.tk ? (TK_STATUS_MAP[parseInt(form.tk)] ?? '') : ''

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleProvinsiChange = (provinsi: string) => {
    setForm((prev) => ({ ...prev, provinsi, kabKota: '', wilayah: '' }))
  }

  const handleKabKotaChange = (kabKota: string) => {
    setForm((prev) => ({ ...prev, kabKota, wilayah: kabKota }))
  }

  const kabKotaOptions = getKabKotaList(form.provinsi)

  const handleBruttoChange = (raw: string) => {
    // Allow only digits and dots
    const cleaned = raw.replace(/[^\d]/g, '')
    const num = parseInt(cleaned, 10) || 0
    update('nilaiAnggaran', num > 0 ? formatDotted(num) : '')
  }

  const reset = () => {
    setForm({ ...INITIAL_FORM, ownerName: defaultOwnerName ?? '' })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    // Validation
    if (!form.ownerName) return setError('PIC wajib diisi')
    if (!form.namaPaket) return setError('Nama Paket wajib diisi')
    if (!form.instansi) return setError('Instansi wajib diisi')
    if (!form.sumberDana) return setError('Sumber Dana wajib diisi')
    if (!form.quarter) return setError('Quarter wajib diisi')
    if (!form.tk) return setError('TK wajib diisi')
    if (!form.principal) return setError('Principal wajib diisi')
    if (!form.jenisProduk) return setError('Jenis Produk wajib diisi')
    if (brutto <= 0) return setError('Nilai Anggaran wajib diisi')

    setLoading(true)

    try {
      if (isEditMode && editLead) {
        // === EDIT MODE ===
        const { error: updateErr } = await supabase
          .from('leads')
          .update({
            nama_paket: form.namaPaket,
            instansi: form.instansi,
            provinsi: form.provinsi,
            kab_kota: form.kabKota,
            wilayah: form.wilayah,
            sumber_dana: form.sumberDana,
            quarter: form.quarter,
            tk: parseInt(form.tk),
            status,
            principal: form.principal,
            jenis_produk: form.jenisProduk,
            produk: form.produk,
            qty: form.qty ? parseInt(form.qty) : null,
            satuan: form.satuan,
            ppn: form.ppn,
            perkiraan_cb: cb,
            nilai_anggaran: brutto,
            dpp,
            forecast_netto: forecastNetto,
            keterangan: form.keterangan,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editLead.id)

        if (updateErr) throw updateErr

        setSuccess(`Lead ${editLead.funnelId} berhasil diupdate!`)
        onCancelEdit?.()
        onSuccess?.()
      } else {
        // === INSERT MODE ===
        const funnelId = await generateFunnelId(form.ownerName)
        const { data: { user } } = await supabase.auth.getUser()
        const now = new Date()
        const weekLabel = getWeekLabel(now)

        const { error: insertErr } = await supabase.from('leads').insert({
          funnel_id: funnelId,
          nama_paket: form.namaPaket,
          instansi: form.instansi,
          provinsi: form.provinsi,
          kab_kota: form.kabKota,
          wilayah: form.wilayah,
          sumber_dana: form.sumberDana,
          quarter: form.quarter,
          tk: parseInt(form.tk),
          status,
          principal: form.principal,
          jenis_produk: form.jenisProduk,
          produk: form.produk,
          qty: form.qty ? parseInt(form.qty) : null,
          satuan: form.satuan,
          ppn: form.ppn,
          perkiraan_cb: cb,
          nilai_anggaran: brutto,
          dpp,
          forecast_netto: forecastNetto,
          keterangan: form.keterangan,
          ket_penggarap: KET_PENGGARAP_MAP[profile.role] ?? null,
          owner_name: form.ownerName,
          owner_id: user?.id ?? null,
          mp_id: profile.role === 'mp' ? user?.id ?? null : null,
          input_week_label: weekLabel,
          input_week: parseInt(weekLabel.replace('W', '').split('-')[0]),
          input_year: now.getFullYear(),
          input_date: now.toISOString().split('T')[0],
        })

        if (insertErr) throw insertErr

        setSuccess(`Lead ${funnelId} berhasil ditambahkan!`)
        reset()
        onSuccess?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-[#EBEBE7] p-5">
      <h3 className="text-sm font-semibold text-[#1A1A18] mb-5 pb-3 border-b border-[#EBEBE7]">
        {isEditMode ? `Edit Lead — ${editLead?.funnelId}` : 'Input Funnel Baru'}
      </h3>

      {error && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* PIC */}
        <div>
          <Label>PIC *</Label>
          {profile.role === 'sales' ? (
            <input
              type="text"
              value={form.ownerName}
              readOnly
              className="form-input bg-[#F5F5F2] cursor-not-allowed text-[#6B6B65]"
            />
          ) : (
            <select value={form.ownerName} onChange={(e) => update('ownerName', e.target.value)} className="form-select">
              <option value="">-- Pilih PIC --</option>
              {settings.picNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </div>

        {/* Nama Paket */}
        <div>
          <Label>Nama Paket *</Label>
          <input
            type="text"
            value={form.namaPaket}
            onChange={(e) => update('namaPaket', e.target.value)}
            placeholder="Nama paket pengadaan..."
            className="form-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <Label>Instansi *</Label>
          <input
            type="text"
            value={form.instansi}
            onChange={(e) => update('instansi', e.target.value)}
            placeholder="Nama instansi..."
            className="form-input"
          />
        </div>
        <div>
          <Label>Principal *</Label>
          <select
            value={form.principal}
            onChange={(e) => update('principal', e.target.value)}
            className="form-select"
          >
            <option value="">-- Pilih Principal --</option>
            {settings.principals.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <Label>Provinsi</Label>
          <select
            value={form.provinsi}
            onChange={(e) => handleProvinsiChange(e.target.value)}
            className="form-select"
          >
            <option value="">-- Pilih Provinsi --</option>
            {PROVINSI_LIST.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Kabupaten / Kota</Label>
          <select
            value={form.kabKota}
            onChange={(e) => handleKabKotaChange(e.target.value)}
            className="form-select"
            disabled={!form.provinsi}
          >
            <option value="">-- Pilih Kab/Kota --</option>
            {kabKotaOptions.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Wilayah</Label>
          <input
            type="text"
            value={form.wilayah}
            onChange={(e) => update('wilayah', e.target.value)}
            placeholder="Auto dari Kab/Kota"
            className="form-input"
          />
        </div>
        <div>
          <Label>Sumber Dana *</Label>
          <select
            value={form.sumberDana}
            onChange={(e) => update('sumberDana', e.target.value)}
            className="form-select"
          >
            <option value="">-- Pilih --</option>
            {settings.sumberDana.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <Label>Quarter *</Label>
          <select
            value={form.quarter}
            onChange={(e) => update('quarter', e.target.value)}
            className="form-select"
          >
            <option value="">-- Pilih --</option>
            {QUARTER_OPTIONS.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>TK (%) *</Label>
          <select
            value={form.tk}
            onChange={(e) => update('tk', e.target.value)}
            className="form-select"
          >
            <option value="">-- Pilih --</option>
            {TK_VALUES.map((t) => (
              <option key={t} value={t}>{t}% — {TK_STATUS_MAP[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Status <span className="text-[#A0A09A] text-[10px] normal-case">(otomatis dari TK)</span></Label>
          <input
            type="text"
            value={status}
            readOnly
            className="form-input bg-[#F5F5F2] text-[#A0A09A] cursor-not-allowed"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <Label>Jenis Produk *</Label>
          <select
            value={form.jenisProduk}
            onChange={(e) => update('jenisProduk', e.target.value)}
            className="form-select"
          >
            <option value="">-- Pilih --</option>
            {settings.jenisProduk.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Produk Spesifik</Label>
          <input
            type="text"
            value={form.produk}
            onChange={(e) => update('produk', e.target.value)}
            placeholder="Nama produk spesifik..."
            className="form-input"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>QTY</Label>
            <input
              type="number"
              value={form.qty}
              onChange={(e) => update('qty', e.target.value)}
              placeholder="0"
              min="0"
              className="form-input"
            />
          </div>
          <div>
            <Label>Satuan</Label>
            <input
              type="text"
              value={form.satuan}
              onChange={(e) => update('satuan', e.target.value)}
              placeholder="Unit, Set..."
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <Label>PPN</Label>
          <select
            value={form.ppn}
            onChange={(e) => update('ppn', e.target.value)}
            className="form-select"
          >
            <option value="PPN">PPN</option>
            <option value="Non PPN">Non PPN</option>
          </select>
        </div>
        <div>
          <Label>Perkiraan CB (%)</Label>
          <input
            type="number"
            value={form.perkiraanCb}
            onChange={(e) => update('perkiraanCb', e.target.value)}
            placeholder="Contoh: 20"
            className="form-input"
          />
        </div>
        <div>
          <Label>Nilai Brutto (Rp) *</Label>
          <input
            type="text"
            value={form.nilaiAnggaran}
            onChange={(e) => handleBruttoChange(e.target.value)}
            placeholder="0"
            className="form-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <Label>Forecast Netto (Rp) <span className="text-green-600 text-[10px]">AUTO</span></Label>
          <input
            type="text"
            value={forecastNetto > 0 ? formatDotted(forecastNetto) : ''}
            readOnly
            placeholder="0"
            className="form-input bg-[#F5F5F2] text-[#A0A09A] cursor-not-allowed"
          />
          {brutto > 0 && (
            <p className="text-[11px] text-[#A0A09A] mt-1">
              DPP: {formatDotted(dpp)} | CB: {cb}% | Netto: {formatDotted(forecastNetto)}
            </p>
          )}
        </div>
        <div>
          <Label>Keterangan</Label>
          <textarea
            value={form.keterangan}
            onChange={(e) => update('keterangan', e.target.value)}
            rows={2}
            placeholder="Catatan tambahan..."
            className="form-input resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-3 border-t border-[#EBEBE7]">
        {isEditMode && (
          <button
            onClick={() => { reset(); onCancelEdit?.() }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#6B6B65] bg-[#F5F5F2] hover:bg-[#EBEBE7] border border-[#EBEBE7] transition-colors"
          >
            Batal Edit
          </button>
        )}
        {!isEditMode && (
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#6B6B65] bg-[#F5F5F2] hover:bg-[#EBEBE7] border border-[#EBEBE7] transition-colors"
          >
            Reset
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#1A1A18] hover:bg-[#2A2A28] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Tambah ke Pipeline'}
        </button>
      </div>
    </div>
  )
}

// --- Helpers ---

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-[#6B6B65] mb-1.5">{children}</label>
  )
}
