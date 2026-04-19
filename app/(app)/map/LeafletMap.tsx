'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface LeafletMapProps {
  provinsiData: Record<string, { totalNetto: number; count: number; leads: any[] }>
  maxNetto: number
  selectedProvinsi: string | null
  onSelect: (name: string | null) => void
  getColor: (netto: number, maxNetto: number) => string
}

export default function LeafletMap({ provinsiData, maxNetto, selectedProvinsi, onSelect, getColor }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const geoLayerRef = useRef<L.GeoJSON | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const map = L.map(containerRef.current, {
      center: [-2, 118],
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    })

    mapRef.current = map

    fetch('/indonesia-provinces.geojson')
      .then((res) => res.json())
      .then((data) => {
        if (!mapRef.current) return
        const layer = L.geoJSON(data, {
          style: (feature: any) => {
            const name = feature?.properties?.PROVINSI
            const pData = provinsiData[name]
            return {
              fillColor: pData ? getColor(pData.totalNetto, maxNetto) : '#E5E7EB',
              fillOpacity: 0.8,
              color: '#fff',
              weight: 1,
            }
          },
          onEachFeature: (feature: any, layer: any) => {
            const name = feature?.properties?.PROVINSI
            layer.on({
              mouseover: (e: any) => { e.target.setStyle({ weight: 2, color: '#064E3B' }) },
              mouseout: (e: any) => { geoLayerRef.current?.resetStyle(e.target) },
              click: () => { onSelect(name) },
            })
          },
        }).addTo(map)

        geoLayerRef.current = layer
        map.fitBounds(layer.getBounds(), { padding: [20, 20] })
      })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
