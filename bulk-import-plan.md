# NSMS Bulk Import — Implementation Plan
## Route: `/admin/bulk-import` | Role: admin, superadmin only

---

## Overview

Fitur bulk import leads via CSV/Excel dengan GUI normalisasi — admin upload file,
benerin data yang ambigu langsung di browser, lalu insert ke Supabase.

```
Upload → Parse → GUI Normalisasi → Validasi → Insert → Report
```

---

## Stage 1 — Foundation & Template

### Goals
- Route `/admin/bulk-import` dengan role guard (admin/superadmin)
- Download template `.xlsx` dengan kolom yang benar
- Upload CSV/Excel → parse → tampil tabel raw

### Tasks

**1.1 Route & Page**
- Buat `app/(app)/admin/bulk-import/page.tsx` (server component, role guard)
- Buat `app/(app)/admin/bulk-import/bulk-import-client.tsx` (client component)
- Tambah link ke Admin Panel (tab atau sidebar item)
- Role guard: redirect ke `/dashboard` jika bukan admin/superadmin

**1.2 Template Excel**
- Generate via ExcelJS (sudah ada di project — jangan pakai xlsx)
- **PENTING: header WAJIB sama persis dengan export "Download Leads"** (`lib/dashboard/exporters.ts`)
  supaya round-trip mulus (download → edit → upload). Label human-readable, **bukan** snake_case.
- **Single source of truth:** ekstrak definisi kolom ke `lib/dashboard/leadsColumns.ts`
  dan pakai bareng oleh `exporters.ts` + `template.ts` → header dijamin tidak pernah drift.

| Header (identik dgn download) | Import | Keterangan |
|-------|-------|------------|
| Funnel ID | ⛔ abaikan | Auto-generate saat insert. Kalau terisi (dari download) → diabaikan |
| Nama Paket | ✅ wajib | — |
| Instansi | ✅ wajib | — |
| Wilayah | ✅ wajib | — |
| Principal | ✅ wajib | Fuzzy match ke `settings.principals` |
| Sumber Dana | ✅ wajib | Fuzzy match ke `settings.sumberDana` |
| Quarter | ✅ wajib | Q1/Q2/Q3/Q4 |
| Stage (TK) | ✅ wajib | 0/5/10/25/50/75/100 |
| Status | ⛔ abaikan | Auto dari TK (`TK_STATUS_MAP`) — jangan dipakai sbg input |
| Nilai Anggaran | ✅ wajib | Angka |
| Forecast Netto | 🟡 auto/opsional | Default auto-hitung dari Nilai Anggaran+PPN+CB. Diisi → dipakai apa adanya (data historis) |
| Kab/Kota | ✅ wajib | Provinsi di-derive dari sini (lihat catatan) |
| PPN | ✅ wajib | PPN / Non PPN — untuk hitung DPP & Netto |
| DPP | ⛔ abaikan | Auto-hitung dari Nilai Anggaran + PPN |
| Perkiraan CB (%) | 🟡 opsional | Untuk hitung Netto (default 0) |
| PIC | ✅ wajib | Fuzzy match ke `profiles.pic_name` → `owner_id` + `ket_penggarap` dari role |
| Target Close | ❌ opsional | Format W{N}-YYYY |
| Input Week | ⛔ abaikan | Auto saat insert |

- **Provinsi tidak ada di header download** → di-derive dari `Kab/Kota` via reverse-lookup
  `lib/region-data.ts` (tiap kab/kota milik 1 provinsi). Tidak perlu kolom Provinsi terpisah →
  header tetap match download.
- Kolom auto/derive (`funnel_id`, `owner_id`, `ket_penggarap`, `dpp`, `status`, `provinsi`,
  `input_date`, `input_week`) → di-generate saat insert, kolom yang `⛔ abaikan` boleh ada di file
  (biar match download) tapi nilainya tidak dipakai.
- Baris contoh 1–2 dengan data dummy yang benar
- Header row bold, kolom wajib highlight kuning

**1.3 Parser**
- Support `.xlsx` dan `.csv`
- Gunakan ExcelJS untuk xlsx, Papa Parse untuk csv
- Output: array of raw row objects (string semua, belum divalidasi)
- Tampil tabel preview raw — semua kolom, scrollable horizontal

### Deliverable Stage 1
Halaman bulk import bisa dibuka, template bisa didownload,
upload file → tampil tabel raw tanpa crash.

---

## Stage 2 — Fuzzy Matching Engine

### Goals
Setiap baris di-analyze, kolom ambigu di-resolve otomatis atau flagged untuk review.

### Fuzzy Match per Kolom

**Install:** `npm install fuse.js`

**2.1 `pic_name`**
- Source: `profiles.pic_name` dari DB (fetch saat halaman load)
- Fuse.js threshold: 0.35
- Logic:
  - Exact match → ✅ auto-resolve
  - Score < 0.35 → 🟡 suggestion (tampil dropdown top-3 kandidat)
  - Tidak ada match → ❌ error merah
- Saat resolve → `owner_id` di-lookup otomatis dari profiles
- `ket_penggarap` → auto-set dari `profiles.role` PIC yang di-resolve

**2.2 `principal`**
- Source: `settings` category `principals`
- Threshold: 0.3
- Alias hardcoded:
  - "Intan Pariwara Edukasi" / "PPL" → IPE
  - "Intan Pariwara Vitarana" → IPV
  - "PT Macanan Jaya Cemerlang" → MJC
  - "PT Saka Mitra Kompetensi" → SMK
  - "PT Sentra Kriya Edukasi" → SKE
  - "PT Apsara Tiyasa Sambada" → ATS

**2.3 `sumber_dana`**
- Source: `settings` category `sumberDana`
- Case-insensitive exact match dulu, baru fuzzy
- "apbd prov" / "APBD Provinsi" → APBD

**2.4 `provinsi`**
- Source: `PROVINSI_LIST` dari `lib/region-data.ts` (static, tidak perlu fetch)
- Fuzzy threshold: 0.3

**2.5 `kab_kota`**
- Source: `getKabKotaList(provinsi)` dari `lib/region-data.ts`
- Normalisasi: strip "Kabupaten " → "Kab. ", "Kota " tetap
- Fuzzy match setelah normalisasi

**2.6 `quarter`**
- Normalisasi string:
  - "q1" / "Q-1" / "TW1" / "Triwulan 1" → Q1
  - "q2" / "Q-2" / "TW2" → Q2
  - dst.
- Tidak valid → ❌ error

**2.7 `status`** — ⚠️ BUKAN input, auto-derive
- NSMS **tidak** pakai enum CRM (Prospect/Negotiation/Won/Lost).
- `status` di-set otomatis dari `tk` via `TK_STATUS_MAP`:
  `0`=Gagal, `5`=Informasi Awal, `10`=Informasi Kebutuhan, `25`=Presentasi,
  `50`=Peluang 50:50, `75`=Hot Prospek, `100`=Closing.
- Kolom "Status" di file (dari download) **diabaikan** — selalu di-overwrite dari TK.

**2.7b `forecast_netto` / `dpp`** — auto-hitung kecuali diisi
- `dpp = ppn === 'PPN' ? round(nilaiAnggaran / 1.11) : nilaiAnggaran`
- `forecast_netto = round(dpp * (1 - perkiraanCb/100))`
- Kalau kolom Forecast Netto diisi manual (data historis/closing) → pakai nilai itu apa adanya.

**2.8 `tk`**
- Valid values: 0, 5, 10, 25, 50, 75, 100
- Parse integer, cek apakah ada di list
- Tidak valid → ❌ error

**2.9 `nilai_anggaran` / `forecast_netto`**
- Strip "Rp", titik ribuan, spasi → parse float
- "30.000.000" / "30,000,000" / "30jt" → 30000000
- Tidak bisa di-parse → ❌ error

**2.10 Deteksi Duplikat — Layer 1 (dalam file upload)**
- **Kunci komposit** (bukan `nama_paket` saja):
  `norm(nama_paket) + '|' + norm(instansi) + '|' + nilai_anggaran`
  - `norm(s)` = lowercase, trim, collapse whitespace.
  - ⚠️ JANGAN pakai `nama_paket` saja — nama generik ("belanja rutin", "paket pengadaan TIK")
    muncul ratusan–ribuan kali lintas instansi → false positive masif.
  - `+ nilai_anggaran` penting: 1 instansi wajar punya banyak baris nama sama untuk produk/nilai beda.
- Dua baris dengan kunci sama → **🟡 warning** "Kemungkinan duplikat: baris X & Y" (soft, tidak blokir).
- Opsional perketat dengan `+ quarter` atau `+ produk` jika masih bising.

### Row Status
Setiap baris punya status:
- ✅ `valid` — semua kolom resolved, siap insert
- 🟡 `suggestion` — ada ≥1 kolom butuh konfirmasi user (termasuk warning duplikat)
- ❌ `error` — ada kolom wajib yang tidak bisa di-resolve

### Deliverable Stage 2
Engine bisa mengklasifikasikan setiap baris ke valid/suggestion/error
dengan confidence score per kolom.

---

## Stage 3 — GUI Normalisasi

### Goals
Tabel interaktif — admin bisa resolve semua 🟡 dan ❌ langsung di browser.

### UI Components

**3.1 Summary Bar**
```
[ Upload baru ]   ✅ 47 valid  🟡 12 perlu review  ❌ 3 error   [ Insert 59 Leads ]
```
- Tombol "Insert" disabled selama masih ada 🟡 atau ❌

**3.2 Tabel Preview**
- Kolom pertama: status icon (✅🟡❌)
- Highlight per cell:
  - Hijau: resolved/valid
  - Kuning: suggestion (perlu konfirmasi)
  - Merah: error
- Scroll horizontal untuk semua kolom
- Filter row: Semua | Perlu Review | Error

**3.3 Inline Resolution**
- Cell 🟡 → klik → dropdown muncul dengan top-3 kandidat fuzzy + "Ketik manual"
- Cell ❌ → klik → input bebas atau dropdown semua opsi valid
- Setelah user pilih → cell jadi ✅ hijau
- Keyboard: Enter konfirmasi, Esc cancel, Tab ke cell berikutnya

**3.4 Bulk Actions**
- "Terima semua suggestion" → auto-accept top-1 fuzzy match untuk semua 🟡
- "Hapus semua error" → remove baris ❌ dari list
- Per-baris: tombol 🗑 hapus baris

**3.5 Auto-fields Preview**
Kolom readonly yang tampil di tabel (tidak bisa diedit, auto-generate):
- `funnel_id` — preview format PREFIX-XXXX (final di-generate saat insert)
- `ket_penggarap` — auto dari role PIC yang sudah di-resolve
- `input_date` — today

### Deliverable Stage 3
Admin bisa resolve semua baris sampai semuanya ✅,
tombol Insert aktif.

---

## Stage 4 — Insert & Report

### Goals
Insert semua baris valid ke Supabase, tampil hasil per baris.

### Tasks

**4.0 Deteksi Duplikat — Layer 2 (cross-check ke DB)** ⚠️ baru
- Sebelum insert, fetch **sekali** semua leads existing (`nama_paket, instansi, nilai_anggaran, funnel_id`)
  → bangun index di memori (`Map` keyed `norm(nama_paket)|norm(instansi)|nilai_anggaran`).
  - JANGAN query `ilike '%...%'` per baris (1.400+ leads, lambat).
- Cek tiap baris upload ke index:
  - Kunci sama persis → **🟡 suggestion** (BUKAN ❌): "Mirip dgn {funnel_id} — {instansi} (Rp X)".
  - **Jangan hard-block** — ~989 baris existing sah berbagi nama+instansi; admin yang putuskan
    skip atau lanjut (checkbox "tetap insert" / "lewati").
- Opsional: fuzzy nama_paket (Fuse.js, threshold ketat ~0.2) untuk tangkap typo, tapi tetap 🟡.

**4.1 Pre-insert Processing**
Per baris yang valid (dan tidak di-skip dari cek duplikat):
- Generate `funnel_id` via `generateFunnelId()` — pastikan tidak collision
- Set `owner_id` dari profiles match
- Set `ket_penggarap` dari role PIC
- Set `status` dari `TK_STATUS_MAP[tk]`
- Set `provinsi` dari reverse-lookup `kab_kota` (region-data)
- Hitung `dpp` & `forecast_netto` (kecuali netto diisi manual)
- Set `input_date` = today
- Set `input_week` = current week number
- Set `input_week_label` = format W{N}-YYYY

**4.2 Insert Strategy**
- Batch insert: Supabase `.insert([...rows])` dalam satu call
- Maksimal 500 baris per batch (split jika lebih)
- Transaction-like: kalau ada error di batch, report per baris

**4.3 Result Report**
Setelah insert selesai:
```
Insert selesai — 59 leads berhasil, 0 gagal

[ Download Report Excel ]  [ Import lagi ]  [ Lihat di Monitoring ]
```
- Report Excel: list semua funnel_id yang berhasil di-insert + baris yang gagal + error message
- Jika ada gagal → tampil merah dengan error message Supabase

**4.4 Error Handling**
- Duplicate `funnel_id` → regenerate dan retry (max 3x)
- Duplicate `funnel_id` dari data user (2 baris sama) → flag sebelum insert
- Network error → retry once, lalu tampil error dengan opsi retry manual

### Deliverable Stage 4
Bulk insert berjalan, report hasil tersedia, admin bisa langsung
cek di Monitoring.

---

## Technical Notes

- **Header template = header export "Download Leads"** (`exporters.ts`). Ekstrak ke
  `lib/dashboard/leadsColumns.ts` sebagai single source of truth, dipakai exporter + template.
- **Status & Provinsi & DPP TIDAK di-input** — auto-derive (status dari TK, provinsi dari kab_kota,
  dpp dari nilai_anggaran+ppn). Kolom auto di file (dari download) diabaikan saat import.
- **Deteksi duplikat:** kunci komposit `nama_paket|instansi|nilai_anggaran` (jangan nama_paket saja).
  Layer 1 = antar-baris file, Layer 2 = cross-check DB (index di memori, sekali fetch). Semua **🟡 soft**,
  tidak hard-block.
- **ExcelJS** untuk template download dan report export (sudah ada, jangan pakai xlsx)
- **Papa Parse** untuk CSV parsing: `npm install papaparse` + `@types/papaparse`
- **Fuse.js** untuk fuzzy matching: `npm install fuse.js`
- Semua processing di **client-side** (parse, fuzzy, preview) — server hanya untuk insert
- Supabase insert via browser client: `import { supabase } from '@/lib/supabase'`
- Role guard di `page.tsx` (server): redirect jika bukan admin/superadmin
- `generateFunnelId()` ada di `lib/funnel/generateFunnelId.ts` — perlu di-export untuk dipakai di client
- PowerShell command separator: semicolons
- Setiap stage: `npm run build` sebelum commit

---

## File Structure (target)

```
app/(app)/admin/bulk-import/
├── page.tsx                    ← server component, role guard
└── bulk-import-client.tsx      ← main client component

lib/dashboard/
└── leadsColumns.ts             ← (BARU) definisi kolom shared: export + template

lib/bulk-import/
├── parser.ts                   ← CSV/Excel parser → raw rows
├── fuzzy.ts                    ← Fuse.js engine per kolom
├── normalizer.ts               ← string normalization (quarter, angka, kab_kota)
├── dedupe.ts                   ← (BARU) deteksi duplikat Layer 1 (file) + Layer 2 (DB)
├── validator.ts                ← row validator → valid/suggestion/error
└── template.ts                 ← ExcelJS template generator (pakai leadsColumns.ts)

components/bulk-import/
├── SummaryBar.tsx
├── PreviewTable.tsx
├── ResolutionDropdown.tsx
└── ResultReport.tsx
```

---

## Execution Order untuk Claude Code

```
Stage 1 → build ✅ → Stage 2 → build ✅ → Stage 3 → build ✅ → Stage 4 → build ✅
```

Jangan lanjut ke stage berikutnya sebelum build pass di stage sekarang.
Setiap stage adalah prompt terpisah ke Claude Code Opus 4.8 xhigh thinking.
