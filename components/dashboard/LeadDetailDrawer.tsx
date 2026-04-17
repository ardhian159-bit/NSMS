'use client'

import { X } from 'lucide-react'
import type { Lead, TrackerEntry } from '@/lib/types'
import { formatRupiahShort, formatRupiahLong } from '@/lib/dashboard/formatters'
import Badge from './Badge'

interface LeadDetailDrawerProps {
  lead: Lead | null
  trackerHistory: TrackerEntry[]
  open: boolean
  onClose: () => void
}

export default function LeadDetailDrawer({
  lead, trackerHistory, open, onClose,
}: LeadDetailDrawerProps) {
  if (!lead || !open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white border-l border-[#EBEBE7] shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#EBEBE7] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs font-[family-name:var(--font-dm-mono)] text-[#A0A09A]">
              {lead.funnelId}
            </p>
            <h2 className="text-base font-semibold text-[#1A1A18] mt-0.5">
              {lead.namaPaket || '-'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#F5F5F2] text-[#A0A09A] hover:text-[#1A1A18] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Detail Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DetailField label="PIC" value={lead.ownerName} />
            <DetailField label="Principal" value={lead.principal} />
            <DetailField label="Instansi" value={lead.instansi} />
            <DetailField label="Wilayah" value={lead.wilayah || lead.kabKota} />
            <DetailField label="Provinsi" value={lead.provinsi} />
            <DetailField label="Sumber Dana" value={lead.sumberDana} />
            <DetailField label="Quarter" value={lead.quarter} />
            <div>
              <p className="text-[10px] text-[#A0A09A] uppercase tracking-wider mb-1">Stage (TK)</p>
              <Badge tk={lead.tk} />
            </div>
            <DetailField label="Nilai Anggaran" value={formatRupiahLong(lead.nilaiAnggaran)} mono />
            <DetailField label="Forecast Netto" value={formatRupiahLong(lead.forecastNetto)} mono highlight />
            {lead.jenisProduk && <DetailField label="Jenis Produk" value={lead.jenisProduk} />}
            {lead.produk && <DetailField label="Produk" value={lead.produk} />}
          </div>

          {lead.keterangan && (
            <div>
              <p className="text-[10px] text-[#A0A09A] uppercase tracking-wider mb-1">Keterangan</p>
              <p className="text-sm text-[#6B6B65]">{lead.keterangan}</p>
            </div>
          )}

          {/* Tracker History */}
          <div>
            <h3 className="text-sm font-semibold text-[#1A1A18] mb-3">Riwayat Update</h3>
            {trackerHistory.length === 0 ? (
              <p className="text-sm text-[#A0A09A]">Belum ada riwayat update.</p>
            ) : (
              <div className="space-y-3">
                {trackerHistory.map((t) => (
                  <div
                    key={`${t.funnelId}-${t.week}`}
                    className="border border-[#EBEBE7] rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#1A1A18] font-[family-name:var(--font-dm-mono)]">
                        {t.week || '-'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5F5F2] text-[#6B6B65]">
                        {t.statusBaru || '-'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#1A1A18]">
                      {t.forecastNetto ? formatRupiahShort(t.forecastNetto) : '-'}
                    </p>
                    {t.notes && (
                      <p className="text-xs text-[#6B6B65] mt-1">{t.notes}</p>
                    )}
                    {t.adminNotes && (
                      <p className="text-xs text-red-500 mt-1">Admin: {t.adminNotes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function DetailField({
  label, value, mono, highlight,
}: {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] text-[#A0A09A] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm ${highlight ? 'font-semibold text-[#1A1A18]' : 'text-[#6B6B65]'}`}>
        {value || '-'}
      </p>
    </div>
  )
}
