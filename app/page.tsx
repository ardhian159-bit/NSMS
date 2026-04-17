import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F2] font-[family-name:var(--font-dm-sans)] text-[#1A1A18]">
      
      {/* Navbar (simpel, logo kiri, tombol kanan) */}
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1A1A18] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A18] leading-tight">NSMS</p>
            <p className="text-[10px] text-[#A0A09A] leading-tight">Intan Pariwara</p>
          </div>
        </div>
        <Link 
          href="/login" 
          className="text-sm font-semibold text-[#1A1A18] border border-[#EBEBE7] bg-white rounded-lg px-4 py-2 hover:bg-[#EBEBE7] transition-colors"
        >
          Masuk
        </Link>
      </header>

      {/* 1. Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-xs font-bold text-[#065F46] tracking-wider uppercase mb-4 block">
            Intan Pariwara · KLDI
          </span>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-[#1A1A18]">
            Satu sistem.<br/>
            Seluruh <span className="text-[#065F46]">pipeline</span> nasional.
          </h1>
          <p className="text-[#6B6B65] text-lg mb-8 leading-relaxed max-w-md">
            NSMS membantu tim sales memantau, mencatat, dan menganalisis 
            progres penjualan dari seluruh wilayah — real-time, terstruktur, dan terpusat.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center bg-[#064E3B] text-[#D1FAE5] rounded-lg px-7 py-3 font-semibold hover:bg-[#065F46] transition-colors"
          >
            Masuk ke Sistem
          </Link>
        </div>

        {/* Hero Visual Right: Dashboard Mini Card */}
        <div className="relative">
          {/* Main Card */}
          <div className="bg-white rounded-2xl border border-[#EBEBE7] shadow-xl p-6 relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#065F46]"></div>
              <span className="text-xs font-semibold text-[#6B6B65] uppercase tracking-wide">
                Dashboard · Overview Nasional
              </span>
            </div>

            {/* KPI grid 2x2 */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-[#F5F5F2] border border-[#EBEBE7]">
                <span className="text-xs text-[#A0A09A] block mb-1">Total Brutto</span>
                <span className="text-lg font-bold text-[#1A1A18]">Rp 405 M</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F5F5F2] border border-[#EBEBE7]">
                <span className="text-xs text-[#A0A09A] block mb-1">Forecast Netto</span>
                <span className="text-lg font-bold text-[#1A1A18]">Rp 275 M</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F5F5F2] border border-[#EBEBE7]">
                <span className="text-xs text-[#A0A09A] block mb-1">Total Pipeline</span>
                <span className="text-lg font-bold text-[#1A1A18]">1.281</span>
              </div>
              <div className="p-4 rounded-xl bg-[#D1FAE5]/30 border border-[#A7F3D0]">
                <span className="text-xs text-[#065F46] block mb-1">Closing</span>
                <span className="text-lg font-bold text-[#065F46]">Rp 1,5 M</span>
              </div>
            </div>

            {/* Sales Funnel */}
            <div>
              <span className="text-xs font-semibold text-[#1A1A18] block mb-3">Sales Funnel</span>
              <div className="space-y-2.5">
                {/* 100% */}
                <div className="flex items-center text-xs">
                  <span className="w-24 text-[#A0A09A]">100% Closing</span>
                  <div className="flex-1 h-5 bg-[#F5F5F2] rounded overflow-hidden">
                    <div className="h-full bg-[#16a34a] rounded" style={{ width: '8%' }}></div>
                  </div>
                  <span className="w-10 text-right font-medium text-[#1A1A18]">7</span>
                </div>
                {/* 75% */}
                <div className="flex items-center text-xs">
                  <span className="w-24 text-[#A0A09A]">75% Hot</span>
                  <div className="flex-1 h-5 bg-[#F5F5F2] rounded overflow-hidden">
                    <div className="h-full bg-[#dc2626] rounded-r" style={{ width: '20%' }}></div>
                  </div>
                  <span className="w-10 text-right font-medium text-[#1A1A18]">26</span>
                </div>
                {/* 50% */}
                <div className="flex items-center text-xs">
                  <span className="w-24 text-[#A0A09A]">50% Peluang</span>
                  <div className="flex-1 h-5 bg-[#F5F5F2] rounded overflow-hidden">
                    <div className="h-full bg-[#ea580c] rounded-r" style={{ width: '48%' }}></div>
                  </div>
                  <span className="w-10 text-right font-medium text-[#1A1A18]">120</span>
                </div>
                {/* 25% */}
                <div className="flex items-center text-xs">
                  <span className="w-24 text-[#A0A09A]">25% Presentasi</span>
                  <div className="flex-1 h-5 bg-[#F5F5F2] rounded overflow-hidden">
                    <div className="h-full bg-[#2563eb] rounded-r" style={{ width: '100%' }}></div>
                  </div>
                  <span className="w-10 text-right font-medium text-[#1A1A18]">1117</span>
                </div>
                {/* 5% */}
                <div className="flex items-center text-xs">
                  <span className="w-24 text-[#A0A09A]">5% Info Awal</span>
                  <div className="flex-1 h-5 bg-[#F5F5F2] rounded overflow-hidden">
                    <div className="h-full bg-[#737373] rounded-r" style={{ width: '10%' }}></div>
                  </div>
                  <span className="w-10 text-right font-medium text-[#1A1A18]">10</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-10 -right-4 md:-right-8 w-full h-full bg-[#EBEBE7]/50 rounded-2xl z-0"></div>
          <div className="absolute -bottom-6 -left-4 md:-left-8 w-full h-full bg-[#EBEBE7]/30 rounded-2xl z-0"></div>
        </div>
      </section>

      {/* 2. Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="border-t border-[#EBEBE7]"></div>
      </div>

      {/* 3. Fitur Utama Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-[#065F46] tracking-wider uppercase mb-3 block">
            Fitur Utama
          </span>
          <h2 className="text-3xl font-bold text-[#1A1A18] mb-4">
            Semua yang dibutuhkan tim sales nasional
          </h2>
          <p className="text-[#6B6B65] max-w-2xl mx-auto">
            Dari input lead pertama hingga closing — semua tercatat, terlacak, dan bisa dianalisis kapan saja.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 border border-[#EBEBE7] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#D1FAE5]/40 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-[#065F46]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A18] mb-3">Dashboard Analytics</h3>
            <p className="text-[#6B6B65] text-sm leading-relaxed">
              KPI real-time, sales funnel, distribusi quarter, top PIC, sumber dana, 
              dan principal — semua dalam satu halaman.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 border border-[#EBEBE7] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#D1FAE5]/40 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-[#065F46]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A18] mb-3">Pipeline & Tracker</h3>
            <p className="text-[#6B6B65] text-sm leading-relaxed">
              Sales input update mingguan per funnel. Status, forecast netto, 
              dan catatan — tersimpan otomatis dengan riwayat lengkap.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 border border-[#EBEBE7] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#D1FAE5]/40 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-[#065F46]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A18] mb-3">Monitoring</h3>
            <p className="text-[#6B6B65] text-sm leading-relaxed">
              Admin pantau semua tracker entry dari seluruh PIC. 
              Filter by week, status, quarter. Admin notes inline.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Pipeline Snippet Section */}
      <section className="bg-white border-y border-[#EBEBE7]">
        <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <span className="text-xs font-bold text-[#065F46] tracking-wider uppercase mb-3 block">
              Pipeline
            </span>
            <h2 className="text-3xl font-bold text-[#1A1A18] mb-4">
              Update mingguan yang terstruktur
            </h2>
            <p className="text-[#6B6B65] text-lg leading-relaxed mb-6">
              Sales pilih lead, update status, dan sistem otomatis snapshot 
              forecast netto. Lead yang sudah closing atau gagal terkunci — 
              tidak bisa diubah tanpa admin.
            </p>
          </div>

          <div className="flex-1 w-full max-w-md bg-[#F5F5F2] p-4 md:p-6 rounded-2xl border border-[#EBEBE7]">
            <div className="bg-white rounded-xl border border-[#EBEBE7] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#EBEBE7] bg-[#FAFAF8]">
                <span className="text-xs font-semibold text-[#6B6B65] uppercase tracking-wider">
                  Daftar Project · BAMBANG SURYANTO
                </span>
              </div>
              <div className="divide-y divide-[#EBEBE7]">
                
                {/* Row 1 */}
                <div className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-[#A0A09A] font-[family-name:var(--font-dm-mono)] block mb-0.5">BST-0001</span>
                    <p className="text-sm font-medium text-[#1A1A18]">Paket Buku Teks SD Kota A</p>
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">50%</div>
                </div>

                {/* Row 2 */}
                <div className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-[#A0A09A] font-[family-name:var(--font-dm-mono)] block mb-0.5">BST-0002</span>
                    <p className="text-sm font-medium text-[#1A1A18]">Paket Interaktif SMP Kab B</p>
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold">75%</div>
                </div>

                {/* Row 3 - Terkunci */}
                <div className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-[#A0A09A] font-[family-name:var(--font-dm-mono)] block mb-0.5">BST-0003</span>
                    <p className="text-sm font-medium text-[#1A1A18]">Paket Smartbook SD Kota C</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <div className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold">100%</div>
                    <div className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold tracking-wider">TERKUNCI</div>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-[#A0A09A] font-[family-name:var(--font-dm-mono)] block mb-0.5">BST-0004</span>
                    <p className="text-sm font-medium text-[#1A1A18]">Paket Meubelair Kab D</p>
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">25%</div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Role & Akses Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12">
          <span className="text-xs font-bold text-[#065F46] tracking-wider uppercase mb-3 block">
            Role & Akses
          </span>
          <h2 className="text-3xl font-bold text-[#1A1A18]">
            Satu sistem, banyak peran
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Role Superadmin */}
          <div className="p-5 bg-white rounded-xl border border-[#EBEBE7]">
            <h3 className="font-semibold text-[#1A1A18] text-base mb-2">Superadmin</h3>
            <p className="text-[#6B6B65] text-sm mb-4 min-h-[40px]">Akses penuh ke semua fitur dan konfigurasi sistem.</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] px-2 py-1 bg-[#F5F5F2] text-[#6B6B65] rounded-md font-medium">Dashboard</span>
              <span className="text-[10px] px-2 py-1 bg-[#F5F5F2] text-[#6B6B65] rounded-md font-medium">Pipeline</span>
              <span className="text-[10px] px-2 py-1 bg-[#F5F5F2] text-[#6B6B65] rounded-md font-medium">Monitoring</span>
              <span className="text-[10px] px-2 py-1 bg-[#F5F5F2] text-[#6B6B65] rounded-md font-medium">Admin</span>
              <span className="text-[10px] px-2 py-1 bg-[#F5F5F2] text-[#6B6B65] rounded-md font-medium">Control</span>
            </div>
          </div>

          {/* Role Admin */}
          <div className="p-5 bg-white rounded-xl border border-[#EBEBE7]">
            <h3 className="font-semibold text-[#1A1A18] text-base mb-2">Admin</h3>
            <p className="text-[#6B6B65] text-sm mb-4 min-h-[40px]">Kelola lead, pantau semua PIC, edit data.</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] px-2 py-1 bg-[#F5F5F2] text-[#6B6B65] rounded-md font-medium">Dashboard</span>
              <span className="text-[10px] px-2 py-1 bg-[#F5F5F2] text-[#6B6B65] rounded-md font-medium">Pipeline</span>
              <span className="text-[10px] px-2 py-1 bg-[#F5F5F2] text-[#6B6B65] rounded-md font-medium">Monitoring</span>
              <span className="text-[10px] px-2 py-1 bg-[#F5F5F2] text-[#6B6B65] rounded-md font-medium">Admin</span>
            </div>
          </div>

          {/* Role Sales */}
          <div className="p-5 bg-white rounded-xl border border-[#EBEBE7]">
            <h3 className="font-semibold text-[#1A1A18] text-base mb-2">Sales</h3>
            <p className="text-[#6B6B65] text-sm mb-4 min-h-[40px]">Input lead dan update mingguan untuk funnel milik sendiri.</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] px-2 py-1 bg-[#F5F5F2] text-[#6B6B65] rounded-md font-medium">Pipeline</span>
            </div>
          </div>

          {/* Role Guest */}
          <div className="p-5 bg-white rounded-xl border border-[#EBEBE7]">
            <h3 className="font-semibold text-[#1A1A18] text-base mb-2">Guest</h3>
            <p className="text-[#6B6B65] text-sm mb-4 min-h-[40px]">Lihat dashboard dan analitik. Tidak bisa edit data.</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] px-2 py-1 bg-[#F5F5F2] text-[#6B6B65] rounded-md font-medium">Dashboard</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Tech Stack Section */}
      <section className="bg-[#FAFAF8] py-16 border-y border-[#EBEBE7]">
        <div className="max-w-6xl mx-auto px-6">
          <span className="text-xs font-bold text-[#A0A09A] tracking-wider uppercase mb-8 block text-center">
            Tech Stack
          </span>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 md:gap-8 text-center text-sm">
            <div>
              <span className="font-semibold text-[#1A1A18] block mb-1">Next.js 16</span>
              <span className="text-[#6B6B65] text-xs">Framework</span>
            </div>
            <div>
              <span className="font-semibold text-[#1A1A18] block mb-1">TypeScript</span>
              <span className="text-[#6B6B65] text-xs">Language</span>
            </div>
            <div>
              <span className="font-semibold text-[#1A1A18] block mb-1">Supabase</span>
              <span className="text-[#6B6B65] text-xs">Database & Auth</span>
            </div>
            <div>
              <span className="font-semibold text-[#1A1A18] block mb-1">Tailwind CSS</span>
              <span className="text-[#6B6B65] text-xs">Styling</span>
            </div>
            <div className="col-span-3 md:col-span-1">
              <span className="font-semibold text-[#1A1A18] block mb-1">Vercel</span>
              <span className="text-[#6B6B65] text-xs">Hosting</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-24">
        <div className="bg-[#064E3B] rounded-2xl p-10 md:p-14 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#D1FAE5] mb-4">
            Siap memantau pipeline nasional?
          </h2>
          <p className="text-[#6EE7B7] text-lg mb-8 max-w-xl mx-auto">
            Masuk dengan akun yang telah disiapkan oleh administrator sistem.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center bg-[#D1FAE5] text-[#064E3B] rounded-lg px-8 py-3.5 font-semibold hover:bg-white transition-colors"
          >
            Masuk ke NSMS
          </Link>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-[#EBEBE7] py-8 text-center">
        <p className="text-xs text-[#A0A09A]">
          made with 🔥 by Adrian · NSMS &copy; 2026 Intan Pariwara KLDI
        </p>
      </footer>

    </div>
  )
}