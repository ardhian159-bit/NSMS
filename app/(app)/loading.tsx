// Suspense fallback — tampil INSTAN saat navigasi antar halaman (app)
// sebelum server component selesai fetch data. Skeleton netral yang cocok
// untuk semua halaman (dashboard, pipeline, monitoring, dll).
export default function Loading() {
  return (
    <div className="p-6 md:p-7 flex flex-col gap-3.5 animate-pulse" aria-busy="true" aria-live="polite">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-6 w-44 rounded-md bg-[#EBEBE7]" />
        <div className="h-3.5 w-64 rounded bg-[#EBEBE7]/70" />
      </div>

      {/* Hero / gauge block */}
      <div className="h-28 rounded-[14px] bg-[#EBEBE7]/60 border border-[#EBEBE7]" />

      {/* KPI cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-white border border-[#EBEBE7] p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-[#EBEBE7]/70" />
            <div className="h-6 w-28 rounded bg-[#EBEBE7]" />
          </div>
        ))}
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 rounded-lg bg-white border border-[#EBEBE7]" />
        <div className="h-64 rounded-lg bg-white border border-[#EBEBE7]" />
      </div>

      {/* Table block */}
      <div className="rounded-lg bg-white border border-[#EBEBE7] p-4 space-y-3">
        <div className="h-4 w-32 rounded bg-[#EBEBE7]" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 rounded bg-[#F5F5F2]" />
        ))}
      </div>
    </div>
  )
}
