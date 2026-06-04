'use client'

import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type MapView = 'provinsi' | 'kabkota'

interface LeafletMapProps {
  data: Record<string, { totalNetto: number; count: number; leads: any[] }>
  mode: MapView
  maxNetto: number
  selected: string | null
  onSelect: (name: string | null) => void
  getColor: (netto: number, maxNetto: number) => string
}

// Nama WADMKK di GeoJSON ≠ nama kab_kota di DB (region-data.ts).
// Key = raw WADMKK, value = nama final di DB. Diterapkan SEBELUM normalisasi.
const KAB_KOTA_ALIAS: Record<string, string> = {
  'Kota Padang Sidempuan': 'Kota Padangsidimpuan',
  'Pahuwato': 'Kab. Pohuwato',
  'Muko Muko': 'Kab. Mukomuko',
  'Toli Toli': 'Kab. Toli-Toli',
  'Kota Pare Pare': 'Kota Parepare',
  'Pangkajene Kepulauan': 'Kab. Pangkajene dan Kepulauan',
  'Kota Tanjung Balai': 'Kota Tanjungbalai',
  'Sumbawa/Sumbawa Barat': 'Kab. Sumbawa',
  'Minahasa Selatan/Bolaang Mongondwo Timur': 'Kab. Minahasa Selatan',
}

function getDataKey(feature: any, mode: MapView): string | null {
  if (mode === 'provinsi') {
    return feature?.properties?.PROVINSI ?? null
  }
  const raw = feature?.properties?.WADMKK as string | undefined
  if (!raw) return null
  if (KAB_KOTA_ALIAS[raw]) return KAB_KOTA_ALIAS[raw]
  return raw.startsWith('Kota ') ? raw : 'Kab. ' + raw
}

export default function LeafletMap({ data, mode, maxNetto, selected, onSelect, getColor }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const geoLayerRef = useRef<L.GeoJSON | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Effect 1: Map initialization only
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [-2, 118],
      zoom: 5,
      minZoom: 4,
      maxBoundsViscosity: 1.0,
      zoomControl: true,
      attributionControl: false,
    })

    mapRef.current = map
    setMapReady(true)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      setMapReady(false)
    }
  }, [])

  // Effect 2: GeoJSON layer — re-runs when data or mode changes
  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    const map = mapRef.current

    if (geoLayerRef.current) {
      geoLayerRef.current.remove()
      geoLayerRef.current = null
    }

    const geoUrl = mode === 'provinsi'
      ? '/indonesia-provinces.geojson'
      : '/indonesia-kabkota.geojson'

    let cancelled = false

    fetch(geoUrl)
      .then((res) => res.json())
      .then((geo) => {
        if (cancelled || !mapRef.current) return
        const layer = L.geoJSON(geo, {
          style: (feature: any) => {
            const key = getDataKey(feature, mode)
            const d = key ? data[key] : undefined
            return {
              fillColor: d ? getColor(d.totalNetto, maxNetto) : '#E5E7EB',
              fillOpacity: 0.8,
              color: '#fff',
              weight: mode === 'kabkota' ? 0.5 : 1,
            }
          },
          onEachFeature: (feature: any, lyr: any) => {
            const key = getDataKey(feature, mode)
            const d = key ? data[key] : undefined
            if (key) {
              lyr.bindTooltip(
                `${key}${d ? ` · ${d.count} leads` : ''}`,
                { sticky: true, direction: 'top', className: 'nsms-map-tooltip' }
              )
            }
            lyr.on({
              mouseover: (e: any) => { e.target.setStyle({ weight: 2, color: '#064E3B' }) },
              mouseout: (e: any) => { geoLayerRef.current?.resetStyle(e.target) },
              click: () => { if (key) onSelect(key) },
            })
          },
        }).addTo(map)

        geoLayerRef.current = layer
        map.fitBounds(layer.getBounds(), { padding: [20, 20] })
        const bounds = map.getBounds().pad(0.2)
        map.setMaxBounds(bounds)
        map.setMinZoom(4)
      })

    return () => { cancelled = true }
  }, [mapReady, data, mode, maxNetto])

  // Effect 3: highlight selected region
  useEffect(() => {
    const layer = geoLayerRef.current
    if (!layer) return
    layer.eachLayer((lyr: any) => {
      const key = getDataKey(lyr.feature, mode)
      if (key && key === selected) {
        lyr.setStyle({ weight: 2.5, color: '#064E3B' })
        lyr.bringToFront()
      } else {
        layer.resetStyle(lyr)
      }
    })
  }, [selected, mode])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
