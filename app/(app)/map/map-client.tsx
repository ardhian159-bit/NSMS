'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { Profile } from '@/lib/types'
import { formatRupiahShort } from '@/lib/dashboard/formatters'
import { X } from 'lucide-react'

interface ProvinsiData {
  totalNetto: number
  count: number
  leads: { ownerName: string; namaPaket: string; kabKota?: string; nilaiAnggaran?: number; status: string; netto: number }[]
}

interface MapClientProps {
  provinsiData: Record<string, ProvinsiData>
  profile: Profile
}

function getHeatmapColor(netto: number, maxNetto: number): string {
  if (netto === 0 || maxNetto === 0) return '#E5E7EB'
  const intensity = netto / maxNetto
  if (intensity < 0.2) return '#BBF7D0'
  if (intensity < 0.4) return '#6EE7B7'
  if (intensity < 0.6) return '#34D399'
  if (intensity < 0.8) return '#10B981'
  return '#064E3B'
}

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false })

export default function MapClient({ provinsiData, profile }: MapClientProps) {
  const [selectedProvinsi, setSelectedProvinsi] = useState<string | null>(null)
  const maxNetto = Math.max(...Object.values(provinsiData).map((d) => d.totalNetto), 0)
  const selectedData = selectedProvinsi ? provinsiData[selectedProvinsi] : null

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A18]">Peta Sebaran</h1>
        <p className="text-sm text-[#A0A09A] mt-0.5">Distribusi leads per provinsi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-[#EBEBE7] overflow-hidden" style={{ height: '480px' }}>
          <LeafletMap
            provinsiData={provinsiData}
            maxNetto={maxNetto}
            selectedProvinsi={selectedProvinsi}
            onSelect={setSelectedProvinsi}
            getColor={getHeatmapColor}
          />
        </div>

        <div className="bg-white rounded-lg border border-[#EBEBE7] p-4">
          {!selectedProvinsi ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <p className="text-sm font-medium text-[#1A1A18]">Klik provinsi</p>
              <p className="text-xs text-[#A0A09A] mt-1">untuk melihat detail leads</p>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#1A1A18]">{selectedProvinsi}</h3>
                  {selectedData && (
                    <p className="text-xs text-[#A0A09A] mt-0.5">
                      {selectedData.count} leads · {formatRupiahShort(selectedData.totalNetto)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedProvinsi(null)}
                  className="p-1 rounded text-[#A0A09A] hover:text-[#1A1A18] hover:bg-[#F5F5F2]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {!selectedData ? (
                <p className="text-xs text-[#A0A09A] text-center py-6">Belum ada leads di provinsi ini</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {selectedData.leads.map((lead, i) => (
                    <div key={i} className="p-3 bg-[#FAFAF8] rounded-lg border border-[#EBEBE7]">
                      <p className="text-xs font-medium text-[#1A1A18] leading-snug">{lead.namaPaket || '-'}</p>
                      <p className="text-xs text-[#A0A09A]">{lead.kabKota || '-'}</p>
                      <p className="text-[10px] text-[#A0A09A] mt-0.5">{lead.ownerName}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F5F2] text-[#6B6B65]">{lead.status}</span>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-[#1A1A18]">{formatRupiahShort(lead.netto)}</span>
                          <p className="text-[10px] text-[#A0A09A]">Brutto: {formatRupiahShort(lead.nilaiAnggaran || 0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#A0A09A]">Rendah</span>
        <div className="flex gap-0.5">
          {['#BBF7D0', '#6EE7B7', '#34D399', '#10B981', '#064E3B'].map((c) => (
            <div key={c} style={{ background: c }} className="w-6 h-2 rounded-sm" />
          ))}
        </div>
        <span className="text-[10px] text-[#A0A09A]">Tinggi</span>
        <div className="ml-3 flex items-center gap-1">
          <div className="w-4 h-2 rounded-sm bg-[#E5E7EB]" />
          <span className="text-[10px] text-[#A0A09A]">Belum ada leads</span>
        </div>
      </div>
    </div>
  )
}
