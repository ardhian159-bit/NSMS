'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { Profile } from '@/lib/types'
import { formatRupiahShort } from '@/lib/dashboard/formatters'
import { X } from 'lucide-react'

interface RegionData {
  totalNetto: number
  count: number
  leads: { ownerName: string; namaPaket: string; kabKota?: string; nilaiAnggaran?: number; status: string; netto: number }[]
}

interface MapClientProps {
  provinsiData: Record<string, RegionData>
  kabKotaData: Record<string, RegionData>
  profile: Profile
}

type MapView = 'provinsi' | 'kabkota'

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

export default function MapClient({ provinsiData, kabKotaData, profile }: MapClientProps) {
  const [mapView, setMapView] = useState<MapView>('provinsi')
  const [selected, setSelected] = useState<string | null>(null)

  const activeData = mapView === 'provinsi' ? provinsiData : kabKotaData
  const maxNetto = Math.max(...Object.values(activeData).map((d) => d.totalNetto), 0)
  const selectedData = selected ? activeData[selected] : null

  const handleViewChange = (v: MapView) => {
    setMapView(v)
    setSelected(null)
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Peta Sebaran</h1>
        <p className="text-sm text-ink-hint mt-0.5">
          Distribusi leads {mapView === 'provinsi' ? 'per provinsi' : 'per kab/kota'}
        </p>
      </div>

      <div className="flex items-center gap-1 bg-page rounded-full p-0.5 w-fit">
        {(['provinsi', 'kabkota'] as const).map((v) => (
          <button
            key={v}
            onClick={() => handleViewChange(v)}
            className={`text-xs px-4 py-1.5 rounded-full transition-all duration-200 font-medium ${
              mapView === v
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {v === 'provinsi' ? 'Per Provinsi' : 'Per Kab/Kota'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-lg border border-line overflow-hidden" style={{ height: '480px' }}>
          <LeafletMap
            data={activeData}
            mode={mapView}
            maxNetto={maxNetto}
            selected={selected}
            onSelect={setSelected}
            getColor={getHeatmapColor}
          />
        </div>

        <div className="bg-surface rounded-lg border border-line p-4">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <p className="text-sm font-medium text-ink">
                Klik {mapView === 'provinsi' ? 'provinsi' : 'kab/kota'}
              </p>
              <p className="text-xs text-ink-hint mt-1">untuk melihat detail leads</p>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{selected}</h3>
                  {selectedData && (
                    <p className="text-xs text-ink-hint mt-0.5">
                      {selectedData.count} leads · {formatRupiahShort(selectedData.totalNetto)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 rounded text-ink-hint hover:text-ink hover:bg-page"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {!selectedData ? (
                <p className="text-xs text-ink-hint text-center py-6">
                  Belum ada leads di {mapView === 'provinsi' ? 'provinsi' : 'kab/kota'} ini
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {selectedData.leads.map((lead, i) => (
                    <div key={i} className="p-3 bg-surface-alt rounded-lg border border-line">
                      <p className="text-xs font-medium text-ink leading-snug">{lead.namaPaket || '-'}</p>
                      <p className="text-xs text-ink-hint">{lead.kabKota || '-'}</p>
                      <p className="text-[10px] text-ink-hint mt-0.5">{lead.ownerName}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-page text-ink-muted">{lead.status}</span>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-ink">{formatRupiahShort(lead.netto)}</span>
                          <p className="text-[10px] text-ink-hint">Brutto: {formatRupiahShort(lead.nilaiAnggaran || 0)}</p>
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
        <span className="text-[10px] text-ink-hint">Rendah</span>
        <div className="flex gap-0.5">
          {['#BBF7D0', '#6EE7B7', '#34D399', '#10B981', '#064E3B'].map((c) => (
            <div key={c} style={{ background: c }} className="w-6 h-2 rounded-sm" />
          ))}
        </div>
        <span className="text-[10px] text-ink-hint">Tinggi</span>
        <div className="ml-3 flex items-center gap-1">
          <div className="w-4 h-2 rounded-sm bg-[#E5E7EB]" />
          <span className="text-[10px] text-ink-hint">Belum ada leads</span>
        </div>
      </div>
    </div>
  )
}
