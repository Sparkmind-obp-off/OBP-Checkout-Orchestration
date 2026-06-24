# SparkMind X · Outcome Foundry (di atas OBP Checkout Orchestrator)

## Project Overview
- **Name**: SparkMind X · Outcome Foundry (engine: OBP Checkout Orchestration)
- **Goal**: Pabrik **hasil bisnis (outcome)** untuk UMKM Indonesia. Pembeli memilih *outcome*
  (Kasir+Booking, Toko Online, AI Staff, dst), bukan tooling. Pembayaran diproses oleh
  **Oasis BI Pro (OBP)** sebagai **Merchant-of-Record (MoR) tunggal** di rel PJP **Duitku** —
  **1 merchant code + 1 callback URL** melayani banyak sub-brand via **fan-out** berbasis
  prefix `merchantOrderId`. 100% edge-native (Cloudflare Pages + D1), ZERO VPS.
- **Narasi 3 lapis** (B5-02): Lapis 1 = Pasar (outcome) · Lapis 2 = Foundry (mesin agentik) ·
  **Lapis 3 = Rel (OBP MoR + edge + kepatuhan)**.

## Currently Completed Features
- ✅ **Re-brand UI** → "SparkMind X · Outcome Foundry" (nav + footer + home), OBP sebagai MoR rail.
- ✅ **Katalog outcome** `/foundry` — 15 SKU, 5 tier (vertical / subscription / high-ticket / education / developer).
- ✅ **Checkout MoR** `/checkout` dengan **pre-fill via `?offer=`** + **intake panel** (HITL) untuk high-ticket.
- ✅ **Dashboard admin read-only** `/admin` — invoice, callback Duitku, fan-out log + stat cards.
- ✅ **API observability** `/api/stats` + `/api/offers`.
- ✅ **Engine MoR** (existing): create invoice via Duitku POP, callback fan-out HMAC-signed.
- ✅ **Replay protection** (nonce + `is_replay`) → callback otentik diproses sekali (idempoten).
- ✅ **Status mapping** Duitku resultCode `00=paid · 01=failed · 02=pending` eksplisit.
- ✅ HMAC-SHA256 (request & callback) via Web Crypto (no node:crypto), constant-time compare.

## Functional Entry Points (URIs)
| Method | Path | Keterangan |
|---|---|---|
| GET | `/` | Home — narasi Outcome Foundry + outcome unggulan |
| GET | `/foundry` | Katalog outcome (per tier) |
| GET | `/checkout?offer={slug}&mode={instant\|intake}` | Checkout MoR (pre-fill offer) |
| GET | `/admin` | Dashboard read-only |
| GET | `/payment/return?order={merchantOrderId}` | Status pembayaran (polling) |
| GET | `/api/health` | Health check |
| GET | `/api/offers` | Katalog SKU (JSON) |
| GET | `/api/stats` | Ringkasan + invoice/callback/fan-out terbaru (JSON) |
| GET | `/api/sub-brands` | Daftar sub-brand aktif |
| POST | `/api/invoices` | Buat invoice (`{sub_brand_id, amount_idr, product_details, customer{}}`, header `Idempotency-Key`) |
| GET | `/api/invoices/:orderId` | Status invoice |
| POST | `/webhooks/duitku` | Callback Duitku (form-urlencoded, HMAC + replay-protected) |

## Data Architecture
- **Storage**: Cloudflare **D1** (SQLite). Katalog SKU = kode (`src/data/offers.ts`).
- **Tables**: `sub_brands` (prefix routing), `invoices` (invoice MoR), `callbacks`
  (audit + `nonce` + `is_replay`), `fanout_log` (OBP → sub-brand delivery).
- **Routing key**: `merchantOrderId = {PREFIX}-{ts}-{rand}` → prefix → sub-brand → fan-out.

## Configuration (secrets — never committed)
Local dev: `.dev.vars` (gitignored). Production: `wrangler pages secret put`.
```
DUITKU_MERCHANT_CODE=D20919
DUITKU_API_KEY=********
DUITKU_ENV=production
OBP_BASE_URL=        # auto-detect if empty
```

## User Guide
1. Buka `/` → klik **Lihat Katalog Outcome** atau pilih outcome unggulan.
2. Di `/foundry` pilih SKU → **Beli** (instant) atau **Konsultasi** (intake/high-ticket).
3. Di `/checkout` form ter-prefill (sub-brand, produk, harga) → "Bayar Sekarang".
4. OBP membuat invoice via Duitku → POP JS / hosted redirect → `/payment/return`.
5. Callback Duitku → verifikasi HMAC → replay-check → update status → fan-out sub-brand.
6. Pantau semua di `/admin` (read-only).

## Local Development
```bash
npm install
npm run build
npm run db:migrate:local && npm run db:seed
pm2 start ecosystem.config.cjs        # http://localhost:3000
```

## Deployment
- **Platform**: Cloudflare Pages (edge-native).
- **Status**: ✅ Built & tested locally (build hijau ~90 kB, semua route 200). Siap deploy (BYOK).
- **Tech Stack**: Hono + TypeScript + Cloudflare Pages/Workers + D1 + TailwindCSS (CDN).
- **GitHub**: https://github.com/Sparkmind-obp-off/OBP-Checkout-Orchestration
- **Last Updated**: 2026-06-24

## Canonical Docs (SSOT)
- `docs/OUTCOME-FOUNDRY-X-OBP-SSOT.md` — **SSOT tunggal**: Outcome Foundry (B4/B5) + OBP MoR rail.
- `docs/DUITKU-MOR-CANONICAL-SSOT.md` — teknis: 1 merchant code → MoR multi-brand.
- `docs/OBP-MOR-ECOSYSTEM-SSOT.md` — strategis: OBP sbg real MoR ekosistem.

## Not Yet Implemented / Next Steps (Batch 8 R6)
- **R6-3**: Eval loop — trace (D1) → verifier → playbook (proof-of-outcome). *Spec siap, HITL schema.*
- **R6-4**: Halaman `/security-audit` + template laporan untuk SKU **Sovereign AgentShield** (sudah di katalog).
- **R6-5**: Channel seat/sponsor (Founder Pass multi-seat, tier sponsor).
- Rate-limit `/api/invoices`, fan-out retry queue, settlement/reconciliation harian + brand ledger.
- Real sub-brand webhook endpoints (saat ini demo domain → 404 saat fan-out).
- Production secrets via `wrangler pages secret put` + D1 remote migration.
