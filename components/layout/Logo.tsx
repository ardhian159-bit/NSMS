'use client'

import { useEffect, useState } from 'react'

interface LogoProps {
  collapsed: boolean
}

export default function Logo({ collapsed }: LogoProps) {
  const [showFull, setShowFull] = useState(!collapsed)

  useEffect(() => {
    if (!collapsed) {
      // Delay full text appearance slightly after sidebar expands
      const t = setTimeout(() => setShowFull(true), 80)
      return () => clearTimeout(t)
    } else {
      setShowFull(false)
    }
  }, [collapsed])

  return (
    <div className="flex items-center overflow-hidden">
      {/* Icon mark — always visible */}
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center rounded-lg transition-all duration-200"
        style={{
          width: collapsed ? 36 : 32,
          height: collapsed ? 36 : 32,
          background: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
        }}
      >
        <div className="flex gap-[1px] leading-none">
          <span style={{ fontSize: collapsed ? 10 : 9, fontWeight: 700, color: '#D1FAE5', lineHeight: 1.15, fontFamily: 'var(--font-dm-sans)' }}>N</span>
          <span style={{ fontSize: collapsed ? 10 : 9, fontWeight: 700, color: 'rgba(209,250,229,0.35)', lineHeight: 1.15, fontFamily: 'var(--font-dm-sans)' }}>S</span>
        </div>
        <div className="flex gap-[1px] leading-none">
          <span style={{ fontSize: collapsed ? 10 : 9, fontWeight: 700, color: 'rgba(209,250,229,0.35)', lineHeight: 1.15, fontFamily: 'var(--font-dm-sans)' }}>M</span>
          <span style={{ fontSize: collapsed ? 10 : 9, fontWeight: 700, color: '#D1FAE5', lineHeight: 1.15, fontFamily: 'var(--font-dm-sans)' }}>S</span>
        </div>
      </div>

      {/* Full text — accordion slide */}
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{
          maxWidth: collapsed ? 0 : 160,
          opacity: showFull ? 1 : 0,
          marginLeft: collapsed ? 0 : 10,
          transition: 'max-width 200ms ease-in-out, opacity 150ms ease-in-out, margin-left 200ms ease-in-out',
        }}
      >
        <div style={{ whiteSpace: 'nowrap' }}>
          <p style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#1A1A18',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            fontFamily: 'var(--font-dm-sans)',
          }}>
            National Sales
          </p>
          <p style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#1A1A18',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            fontFamily: 'var(--font-dm-sans)',
          }}>
            Management System
          </p>
          <p style={{
            fontSize: 9,
            fontWeight: 400,
            color: '#A0A09A',
            letterSpacing: '0.04em',
            marginTop: 2,
            fontFamily: 'var(--font-dm-sans)',
          }}>
            Intan Pariwara · KLDI
          </p>
        </div>
      </div>
    </div>
  )
}
