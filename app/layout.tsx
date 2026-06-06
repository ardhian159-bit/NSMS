import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

const SITE_URL = 'https://nsms-three.vercel.app'
const OG_TITLE = 'NSMS — Satu sistem. Seluruh pipeline nasional.'
const OG_DESC =
  'NSMS membantu tim sales memantau, mencatat, dan menganalisis progres penjualan dari seluruh wilayah — real-time, terstruktur, dan terpusat.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'NSMS — Sales Management System',
  description: OG_DESC,
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_URL,
    siteName: 'NSMS',
    title: OG_TITLE,
    description: OG_DESC,
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESC,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F5F5F2]">{children}</body>
    </html>
  )
}
