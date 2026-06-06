import { ImageResponse } from 'next/og'

export const alt = 'NSMS — National Sales Management System'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// OG image — mirror branding landing page (emerald + DM Sans look)
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#F5F5F2',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: brand label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: '#065F46',
          }}
        >
          Intan Pariwara · KLDI
        </div>

        {/* Middle: title + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 120,
              fontWeight: 700,
              color: '#1A1A18',
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            NSMS
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 52,
              fontWeight: 700,
              color: '#1A1A18',
              marginTop: 24,
              lineHeight: 1.1,
            }}
          >
            Satu sistem. Seluruh{' '}
            <span style={{ color: '#065F46', marginLeft: 14 }}>pipeline</span>
            <span style={{ marginLeft: 14 }}>nasional.</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              color: '#6B6B65',
              marginTop: 24,
              maxWidth: 900,
            }}
          >
            National Sales Management System — pantau, catat, & analisis pipeline penjualan secara real-time.
          </div>
        </div>

        {/* Bottom: accent bar + url */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            {['#BBF7D0', '#6EE7B7', '#34D399', '#10B981', '#064E3B'].map((c) => (
              <div
                key={c}
                style={{ width: 56, height: 12, borderRadius: 6, backgroundColor: c }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: '#A0A09A', fontWeight: 500 }}>
            nsms-three.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
