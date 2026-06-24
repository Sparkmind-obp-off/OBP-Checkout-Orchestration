# OUTCOME-FOUNDRY-X-OBP — SSOT Kanonik Tunggal
## SparkMind X · Outcome Foundry + Oasis BI Pro (Merchant-of-Record) di rel Duitku

> **Status:** Canonical · **Versi:** v1.0 · **Tanggal:** 2026-06-24
> **Doctrine induk:** MASTER-ARCHITECT-PROMPT · D-1 Truth-Lock · Indonesia-first · Credit-aware
> **Menyatukan:** Batch 4 (Repositioning) + Batch 5 (Outcome Foundry) + PAYMENT-FLOW-OBP v2.0
> (MoR rail) + Batch 8 (ECC-informed upgrade R6) → **satu sistem hidup di `webapp`**.
> **Repo produk:** github.com/Sparkmind-obp-off/OBP-Checkout-Orchestration
> **Aplikasi (web):** Cloudflare Pages (edge-native, ZERO VPS).

---

## 0. Mengapa dokumen ini ada

Dokumen-dokumen SSOT sebelumnya benar secara strategi (B4/B5) dan benar secara rel-uang
(PAYMENT-FLOW-OBP), tetapi tersebar. Dokumen ini **menyatukannya menjadi satu narasi kanonik
tunggal yang termaterialisasi di kode `webapp`** — bukan slogan, tapi aplikasi yang jalan.

> **Satu kalimat:** *SparkMind X adalah Outcome Foundry untuk UMKM Indonesia — pabrik yang
> mengubah masalah bisnis menjadi hasil yang sudah jalan — dengan pembayaran diproses oleh
> Oasis BI Pro sebagai Merchant-of-Record (MoR) di rel PJP Duitku, 100% di edge Cloudflare.*

---

## 1. Tiga lapis sistem (anatomi — selaras B5-02)

```
┌─────────────────────────────────────────────────────────────────┐
│  LAPIS 1 — PASAR (yang dilihat pembeli)                          │
│  "SparkMind X — bikin bisnismu otomatis & online."               │
│  Objek dijual: OUTCOME (Kasir+Booking, Toko Online, AI Staff,    │
│   Event/Tiket, Donasi, Admin Otomasi, App Custom, AI Company).   │
│  Route: /  ·  /foundry  ·  /checkout                             │
├─────────────────────────────────────────────────────────────────┤
│  LAPIS 2 — FOUNDRY (mesin perakit agentik)                       │
│  Pipeline: intake → orchestration → fullstack-cycle → deploy     │
│  Quality gate: verify-rubric · zero-trust · credit-aware (HITL)  │
│  Transparansi mesin: `engineSkills` per offer (proof developer). │
├─────────────────────────────────────────────────────────────────┤
│  LAPIS 3 — REL (infra + uang + kepatuhan)  ← OBP MoR ada DI SINI │
│  Edge: Hono + Cloudflare Pages + D1                              │
│  Uang: Oasis BI Pro (MoR) di rel PJP Duitku (QRIS/VA)            │
│  Pola: 1 merchant code → fan-out per prefix merchantOrderId.     │
└─────────────────────────────────────────────────────────────────┘
```

> Pembeli hanya melihat **Lapis 1**. Developer/partner boleh masuk **Lapis 2** (transparansi
> `engineSkills`). **Lapis 3 invisible tapi menjadi moat** (sulit ditiru): OBP MoR + edge + lokal.

---

## 2. OBP sebagai Merchant-of-Record (rail kanonik)

**Oasis BI Pro (OBP)** adalah Merchant-of-Record untuk SELURUH ekosistem SparkMind. Inti polanya
(diverifikasi di kode `src/duitku.ts` + `src/index.tsx`):

1. **Satu merchant code Duitku** + **satu callback URL** melayani **banyak sub-brand**.
2. **`merchantOrderId` meng-encode prefix sub-brand** (mis. `BK-…` BarberKas, `KK-…` KuratorKas).
3. **Callback tunggal di-`fan-out`** secara internal ke backend sub-brand (HMAC-signed per sub-brand).
4. **Disclosure wajib:** setiap halaman checkout/return menyatakan "diproses oleh Oasis BI Pro
   sebagai Merchant-of-Record … rel PJP Duitku terdaftar Bank Indonesia".

### Alur transaksi (intake → settle → fan-out)

```
Customer → /checkout (Lapis 1)
   └─ POST /api/invoices  → simpan invoice 'pending' (D1)
        └─ Duitku createInvoice (x-duitku-signature = HMAC_SHA256(merchantCode+ts, apiKey))
            └─ paymentUrl / reference → Duitku POP (popup) atau redirect hosted
Duitku → POST /webhooks/duitku (callback tunggal OBP)
   └─ verifyCallbackSignature (HMAC_SHA256(merchantCode+amount+merchantOrderId, apiKey))
   └─ replay-protection (nonce) → idempoten
   └─ resultCode: 00=paid · 01=failed · 02=pending
   └─ fan-out ke sub-brand backend (X-OBP-Signature) → fanout_log
```

---

## 3. Katalog Outcome (Lapis 1 — kode `src/data/offers.ts`)

> Sumber kebenaran harga & SKU = **kode** (`src/data/offers.ts`). Tabel ini cerminan kanonik.
> Selaras B5-03 §2 + B4-03 §3.

| SKU (slug) | Outcome dijual | Harga | Tier | Checkout |
|---|---|---|---|---|
| `kasir-booking` | Kasir + Booking jasa lokal | Rp 199.000 | vertical | instant |
| `toko-online-cs` | Toko online + CS otomatis | Rp 490.000 | vertical | instant |
| `mesin-konten` | Mesin konten & promo | Rp 490.000 | vertical | instant |
| `event-tiket` | Event, tiket & RSVP | Rp 490.000 | vertical | instant |
| `donasi-keanggotaan` | Donasi & keanggotaan | Rp 490.000 | vertical | instant |
| `care-plan` | Care Plan (update & support) | Rp 199.000/bln | subscription | instant |
| `ai-staff-cs` | AI Staff — Customer Service | Rp 490.000/bln | subscription | instant |
| `ai-staff-marketing` | AI Staff — Marketing | Rp 490.000/bln | subscription | instant |
| `ai-staff-admin` | AI Staff — Admin & Dokumen | Rp 490.000/bln | subscription | instant |
| `app-custom` | Aplikasi custom (DFY) | mulai Rp 5.000.000 | high-ticket | intake |
| `ai-company` | AI Company in a Box | mulai Rp 12.000.000 | high-ticket | intake |
| `agentshield-audit` | Sovereign AgentShield (audit keamanan) | intake (HITL pricing) | high-ticket | intake |
| `canon-course` | Canon Course (edukasi) | Rp 349.000 | education | instant |
| `all-access-bundle` | All-Access Bundle (36 skill) | Rp 990.000 | developer | instant |
| `founder-pass` | Founder Pass (bulanan) | Rp 149.000/bln | developer | instant |

**Pola checkout:**
- **instant** (one-time / subscription deterministik) → checkout langsung via engine MoR.
- **intake** (high-ticket / setup) → konsultasi lalu invoice (**HITL gate owner** untuk pricing/scope).

---

## 4. Kontrak kualitas outcome (Definition-of-Outcome — DoO, dari B5-02 §6)

Sebuah pesanan dianggap **outcome ter-deliver** bila:
- [ ] Hasil **berfungsi & dapat diakses** (URL live / akses produk aktif).
- [ ] **Bukti** diberikan (URL/dashboard/laporan).
- [ ] **Bahasa Indonesia** & sesuai konteks pembeli.
- [ ] Pembayaran **tercatat di MoR** (invoice D1) & faktur terkirim.
- [ ] Lulus **verify-rubric** (Truth-Lock: tidak ada klaim palsu).

---

## 5. Status kode (terverifikasi 2026-06-24 — build hijau)

> `npm run build` → `dist/_worker.js` (~90 kB, 68 modules) ✓ · semua route 200 ✓.

| Area | Status | Bukti (file/route) |
|---|---|---|
| Re-brand SparkMind X · Outcome Foundry | ✅ LIVE | `src/renderer.tsx` (nav+footer), `src/views/home.tsx` |
| Katalog outcome | ✅ LIVE | `src/data/offers.ts` (15 SKU, 5 tier), route `/foundry` |
| Checkout MoR (pre-fill offer) | ✅ LIVE | `src/views/checkout.tsx`, route `/checkout?offer=…` |
| Intake panel high-ticket (HITL) | ✅ LIVE | `/checkout?offer=app-custom&mode=intake` |
| Engine checkout Duitku (MoR) | ✅ LIVE | `src/duitku.ts`, `POST /api/invoices` |
| Webhook fan-out + disclosure | ✅ LIVE | `POST /webhooks/duitku`, `fanoutToSubBrand()` |
| **Replay protection (nonce)** | ✅ LIVE | migrasi `0002`, kolom `nonce`+`is_replay` |
| **Status mapping resultCode 02 (pending)** | ✅ LIVE | webhook handler |
| Dashboard admin read-only | ✅ LIVE | `src/views/admin.tsx`, route `/admin` |
| API observability | ✅ LIVE | `GET /api/stats`, `GET /api/offers` |

---

## 6. Keamanan & Truth-Lock (selaras Batch 8 R6-2)

- **Secret Duitku (merchant code/api key)** disimpan sebagai Cloudflare secret / `.dev.vars`
  (gitignored) — **tidak pernah** di frontend. (Prinsip prompt-defense R6-2: jangan bocorkan secret.)
- **Callback signature diverifikasi** (HMAC) + **constant-time compare** (`safeEqual`).
- **Replay protection** (nonce) → callback otentik diproses sekali; retry Duitku di-ack idempoten.
- **HITL gate**: payment, pricing (high-ticket), legal, customer-facing → keputusan owner.
- **Disclosure MoR** di setiap titik bayar (kepatuhan: PAYMENT-FLOW-OBP v2.0 + COMPLIANCE-RISK-MATRIX).
- **Truth-Lock**: hanya outcome yang bisa dirakit dari kapabilitas nyata yang dijual; klaim
  "production-grade"/"lintas-harness" hanya setelah diuji.

---

## 7. Roadmap lanjutan (dari Batch 8 R6, belum dieksekusi di kode)

| Item | Deskripsi | Status |
|---|---|---|
| R6-3 | Eval loop ringan: trace (D1) → verifier → playbook (proof-of-outcome) | 📋 spec siap (HITL schema) |
| R6-4 | Halaman `/security-audit` + intake template untuk AgentShield | 📋 SKU sudah di katalog, halaman menyusul |
| R6-5 | Channel seat/sponsor (Founder Pass multi-seat, tier sponsor) | 📋 direncanakan |

---

## 8. Ringkasan satu kalimat (kanonik)

> **SparkMind X · Outcome Foundry menjual HASIL (outcome) ke UMKM Indonesia, dirakit secara
> agentik di edge Cloudflare, dengan pembayaran diproses Oasis BI Pro sebagai Merchant-of-Record
> di rel Duitku — satu merchant code, fan-out multi sub-brand, patuh & Truth-Lock.**
