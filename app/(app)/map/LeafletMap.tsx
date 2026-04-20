'use client'

import { useState, useEffect, useRef } from 'react'
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

  // Effect 2: GeoJSON layer — runs after map is ready
  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    const map = mapRef.current

    // Remove previous layer if any
    if (geoLayerRef.current) {
      geoLayerRef.current.remove()
      geoLayerRef.current = null
    }

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
        const bounds = map.getBounds().pad(0.2)
        map.setMaxBounds(bounds)
        map.setMinZoom(4)
      })
  }, [mapReady, provinsiData])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
