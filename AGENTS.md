# NSMS — Implementation Plan (Revised 16 April 2026)

## CORRECTION NOTES — READ BEFORE STARTING

> These override anything written below or in previous versions of this file.

1. **Supabase schema ALREADY EXISTS** — do not recreate tables. Only write code that reads/writes to them.
2. **Auth ALREADY EXISTS** — login page, middleware, dashboard shell sudah jalan. Do not replace or redesign them.
3. **Field names must match Supabase exactly:**

| TypeScript (camelCase) | Supabase column |
|---|---|
| `kabupatenKota` | `kab_kota` |
| `nilaiAnggaran` | `nilai_anggaran` |
| `forecastNetto` | `forecast_netto` |
| `ppn` | `ppn` (bukan `ppn_non`) |
| `perkiraanCb` | `perkiraan_cb` |
| `sumberDana` | `sumber_dana` |
| `jenisProduk` | `jenis_produk` |
| `namaPaket` | `nama_paket` |
| `ownerName` | `owner_name` |
| `ownerId` | `owner_id` |
| `spId` | `sp_id` |
| `mpId` | `mp_id` |
| `inputWeekLabel` | `input_week_label` |
| `targetCloseWeek` | `target_close_week` |
| `targetCloseQuarter` | `target_close_quarter` |
| `isTayang` | `is_tayang` |
| `isShadow` | `is_shadow` |
| `parentLeadId` | `parent_lead_id` |

4. **Table name: `tracker`** (bukan `trackers`)
5. **`profiles` table sudah ada** dengan kolom: `id, username, role, pic_name, branch, superior_id, is_active, created_at, updated_at`
6. **Design: WHITE/LIGHT theme** — jangan dark theme, jangan slate-900, jangan teal gradient
7. **Font: DM Sans** (bukan Inter) — sudah di globals.css
8. **Layout: `app/(app)/layout.tsx`** route group — jangan buat `app/dashboard/layout.tsx`
9. **Navigation: Sidebar (desktop) + Bottom Navbar (mobile)** — bukan top navbar
10. **Supabase client: `createClient()` dari `@/lib/supabase-server`** untuk server components
11. **Icons: Lucide only**
12. **Recharts** untuk semua charts — sudah diputuskan
13. **Shadcn UI** sudah di-install

---

## Project Context

**System:** National Sales Management System (NSMS) — PT Piwulang Pradnya Luhur (Intan Pariwara)
**Division:** NSM KLDI

**Stack:**
- Next.js 14 App Router + TypeScript strict
- TailwindCSS + Shadcn UI + DM Sans
- Supabase (PostgreSQL + Auth)
- Recharts
- Lucide Icons
- Hosting: Vercel

---

## Supabase Schema (SUDAH ADA — JANGAN DIBUAT ULANG)

### Tables
| Table | Status |
|---|---|
| `leads` | ✅ Ada + data |
| `profiles` | ✅ Ada |
| `tracker` | ✅ Ada + data |
| `settings` | ✅ Ada + seed data |
| `targets` | ✅ Ada |

### `leads` schema lengkap:
```
id                    bigserial PK
funnel_id             text NOT NULL UNIQUE
nama_paket            text
instansi              text
provinsi              text
kab_kota              text
wilayah               text
principal             text
sumber_dana           text
nilai_anggaran        numeric
dpp                   numeric
forecast_netto        numeric
ppn                   text
perkiraan_cb          numeric
produk                text
qty                   integer
satuan                text
jenis_produk          text
status                text
tk                    integer
quarter               text
owner_name            text
owner_id              uuid FK → auth.users (nullable)
sp_id                 uuid FK → profiles(id)
mp_id                 uuid FK → profiles(id)
input_week_label      text        -- "W15-2026"
input_week            integer
input_year            integer
target_close_week     text
target_close_quarter  text
is_tayang             boolean default false
is_shadow             boolean default false
parent_lead_id        bigint FK → leads(id)
keterangan            text
input_date            date
created_at            timestamptz
updated_at            timestamptz
```

### `tracker` schema:
```
id              bigserial PK
funnel_id       text FK → leads(funnel_id)
pic             text
nama_paket      text
status_baru     text
forecast_netto  numeric
notes           text
week            text        -- "W15-2026"
admin_notes     text
updated_by      uuid FK → auth.users
created_at      timestamptz
updated_at      timestamptz
UNIQUE(funnel_id, week)
```

### `profiles` schema:
```
id            uuid FK → auth.users PK
username      text UNIQUE
role          text  -- superadmin|admin|sales|guest|mp|sp|am|rekanan|dirut
pic_name      text
branch        text
superior_id   uuid FK → profiles(id)
is_active     boolean
created_at    timestamptz
updated_at    timestamptz
```

### `settings` schema:
```
id          bigserial PK
category    text  -- picNames|principals|sumberDana|jenisProduk|quarterDistribution
value       text
sort_order  integer
UNIQUE(category, value)
```

### `targets` schema:
```
id              bigserial PK
profile_id      uuid FK → profiles(id)
year            integer
target_brutto   numeric
created_at      timestamptz
UNIQUE(profile_id, year)
```

---

## Business Logic (Jangan Hilang)

### TK Status Map
```typescript
const TK_STATUS_MAP = {
  0:   'Gagal',
  5:   'Informasi Awal',
  10:  'Informasi Kebutuhan',
  25:  'Presentasi',
  50:  'Peluang 50:50',
  75:  'Hot Prospek',
  100: 'Closing'
}
```

### Kalkulasi
```typescript
// DPP
dpp = ppn === 'PPN' ? Math.round(nilaiAnggaran / 1.11) : nilaiAnggaran

// Netto
forecastNetto = Math.round(dpp * (1 - perkiraanCb / 100))
```

### Funnel ID Generation
- Prefix 3 huruf dari firstName PIC
- Collision → extend ke 4 huruf
- Override: BAMBANG SURYANTO → BST, BAMBANG MUDJIRAN → BM
- Sequence 4 digit: `PREFIX-0001`

### Tracker Upsert
- Same `funnel_id` + `week` → overwrite (upsert)
- Update `status` di leads saat updateTracker
- Week format: `W{N}-YYYY`

---

## Roles

| Role | Akses |
|---|---|
| `superadmin` | Semua halaman |
| `admin` | Dashboard, monitoring, admin panel |
| `sales` | Pipeline (input + update) saja |
| `guest` | Dashboard read-only |
| `mp` | Branch view (future) |
| `sp` | Team view (future) |
| `am` | Personal pipeline (future) |
| `dirut` | Sama seperti MP untuk sekarang |

---

## Legacy System Inventory

| Legacy File | ~Lines | Next.js Route |
|---|---|---|
| `sales.html` | 2092 | `/(app)/pipeline` |
| `dashboard.html` | 1447 | `/(app)/dashboard` |
| `admin.html` | 2820 | `/(app)/admin` |
| `monitoring.html` | 2194 | `/(app)/monitoring` |
| `controlpanel.html` | 2119 | `/(app)/control` |

---

## Project Structure Target

```
D:\projects\nsms\
├── app/
│   ├── (app)/                        ← route group authenticated
│   │   ├── layout.tsx                ← auth guard + Sidebar + BottomNav
│   │   ├── dashboard/
│   │   │   ├── page.tsx              ← server component, fetch data
│   │   │   └── dashboard-client.tsx  ← client, state, filters
│   │   ├── pipeline/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx          ← input lead baru
│   │   ├── admin/
│   │   │   └── page.tsx
│   │   ├── monitoring/
│   │   │   └── page.tsx
│   │   └── control/
│   │       └── page.tsx
│   ├── login/
│   │   └── page.tsx                  ← SUDAH ADA
│   ├── layout.tsx                    ← root layout, DM Sans font
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx               ← desktop nav
│   │   └── BottomNav.tsx             ← mobile nav
│   ├── dashboard/
│   │   ├── KpiCards.tsx
│   │   ├── FilterBar.tsx
│   │   ├── PipelineTable.tsx
│   │   ├── LeadDetailDrawer.tsx
│   │   ├── Badge.tsx
│   │   └── charts/
│   │       ├── ChartFunnel.tsx
│   │       ├── ChartQuarter.tsx
│   │       ├── ChartTopPic.tsx
│   │       ├── ChartSumberDana.tsx
│   │       └── ChartPrincipal.tsx
│   └── shared/
│       └── Toast.tsx
├── lib/
│   ├── supabase.ts                   ← SUDAH ADA (browser client)
│   ├── supabase-server.ts            ← SUDAH ADA (server client)
│   ├── types.ts                      ← interfaces Lead, Tracker, Profile, dll
│   ├── constants.ts                  ← TK_STATUS_MAP, dll
│   └── dashboard/
│       ├── formatters.ts             ← formatRupiahShort, dll
│       ├── filters.ts                ← applyFilters, computeKPIs, dll
│       ├── charts.ts                 ← buildFunnelChartData, dll
│       ├── table.ts                  ← sortLeads, paginateLeads
│       ├── detail.ts                 ← getLeadDetail, getTrackerHistory
│       └── week.ts                   ← getWeekLabel
├── middleware.ts                     ← SUDAH ADA
└── types/
    └── index.ts                      ← re-export dari lib/types.ts
```

---

## Design System

### Tokens
```
Background:   #ffffff (cards), #F5F5F2 (page bg)
Border:       #EBEBЕ7 (0.5px)
Text primary: #1A1A18
Text muted:   #6B6B65
Text hint:    #A0A09A
Accent:       #1A1A18 (buttons, FAB)
Font:         DM Sans (body), DM Mono (numbers)
Radius:       8px (cards), 100px (pills/badges)
```

### Navigation
**Desktop (md+):** Sidebar kiri 220px, fixed
- Logo NSMS + Intan Pariwara
- Nav: Dashboard, Pipeline, Monitoring, Control Panel
- Role-based visibility
- Footer: avatar + nama + role + logout

**Mobile (<md):** Bottom navbar fixed
- Dashboard | Monitoring | [+ FAB Input] | Update | Kontrol
- FAB tengah: bg-[#1A1A18] rounded-xl

### Status Badge Colors
```
tk=100  Closing       → green   bg-green-50   text-green-700
tk=75   Hot Prospek   → red     bg-red-50     text-red-600
tk=50   Peluang 50:50 → orange  bg-orange-50  text-orange-600
tk=25   Presentasi    → blue    bg-blue-50    text-blue-600
tk=10   Info Kebutuhan→ purple  bg-purple-50  text-purple-600
tk=5    Info Awal     → gray    bg-neutral-100 text-neutral-600
tk=0    Gagal         → gray    bg-neutral-100 text-neutral-400 line-through
```

---

## Execution Steps

### Yang SUDAH SELESAI
- [x] Supabase schema + RLS
- [x] Settings seed data
- [x] Tracker backfill
- [x] Next.js init + Supabase SSR client
- [x] Middleware auth guard
- [x] Login page (`app/login/page.tsx`)
- [x] Dashboard shell (`app/(app)/dashboard/page.tsx`)
- [x] Shadcn UI installed

### Execution Order (mulai dari sini)

| Step | File(s) | Notes |
|---|---|---|
| 6.5 | `app/(app)/layout.tsx`, `components/layout/Sidebar.tsx`, `components/layout/BottomNav.tsx` | Auth guard + nav |
| 1 | `lib/types.ts`, `lib/constants.ts` | Types foundation |
| 2 | `lib/dashboard/formatters.ts`, `lib/dashboard/week.ts` | Pure utils |
| 3 | `lib/dashboard/filters.ts`, `lib/dashboard/charts.ts`, `lib/dashboard/table.ts`, `lib/dashboard/detail.ts` | Logic engines |
| 4 | `lib/api.ts` | Supabase data layer |
| 5 | `components/dashboard/Badge.tsx`, `components/dashboard/KpiCards.tsx` | UI atoms |
| 6 | `components/dashboard/FilterBar.tsx` | Filter UI |
| 7 | `components/dashboard/charts/*` | Chart components |
| 8 | `components/dashboard/PipelineTable.tsx`, `components/dashboard/LeadDetailDrawer.tsx` | Table + drawer |
| 9 | `app/(app)/dashboard/page.tsx` + `dashboard-client.tsx` | Dashboard assembly |
| 10 | `app/(app)/pipeline/*` | Sales input + update |
| 11 | `app/(app)/admin/page.tsx` | Admin panel |
| 12 | `app/(app)/monitoring/page.tsx` | Monitoring |
| 13 | `app/(app)/control/page.tsx` | Control panel |
| 14 | Audit + middleware role-based routing | Production pass |

### Rule per Step
- `npm run build` harus pass setelah setiap step
- Jangan rewrite file yang tidak berkaitan
- Jangan mock data — semua dari Supabase
- Jangan duplicate logic — gunakan fungsi dari `lib/dashboard/*`
- Jangan install package baru tanpa konfirmasi

---

## Open Questions (Belum Dijawab)

1. **Region data** (`provinsi → kab/kota`): static JSON file atau tabel Supabase?
2. **`api.ts`**: Supabase direct client saja, atau tambah Next.js API routes di `/api/*`?
