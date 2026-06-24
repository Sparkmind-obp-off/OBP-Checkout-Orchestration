# OBP Checkout Orchestrator

## Project Overview
- **Name**: OBP Checkout Orchestration
- **Goal**: Oasis BI Pro (OBP) sebagai **Merchant-of-Record (MoR) tunggal** untuk
  ekosistem SparkMind — **1 merchant code + 1 API key Duitku** melayani pembayaran
  real untuk banyak sub-brand, lewat **1 callback URL** yang **fan-out** ke tiap
  sub-brand berdasarkan prefix `merchantOrderId`.
- **Features**:
  - Create invoice atas nama OBP via Duitku POP (real production integration)
  - Single callback orchestrator → fan-out HMAC-signed ke sub-brand backend
  - HMAC-SHA256 signature (request & callback) — Cloudflare Web Crypto (no node:crypto)
  - D1: registry sub-brand, invoices, callback audit, fan-out log
  - Idempotency-Key, status polling, disclosure UX (MoR footer)
  - Frontend checkout + Duitku POP JS (fallback ke hosted redirect)

## URLs / Functional Entry Points
- **Home / Checkout UI**: `GET /`
- **Payment return**: `GET /payment/return?order={merchantOrderId}`
- **Health**: `GET /api/health`
- **List sub-brands**: `GET /api/sub-brands`
- **Create invoice**: `POST /api/invoices`
  - body: `{ sub_brand_id, amount_idr, product_details, customer:{name,email,phone}, external_ref?, metadata? }`
  - header (opsional): `Idempotency-Key`
- **Get invoice status**: `GET /api/invoices/:orderId`
- **Duitku callback (webhook)**: `POST /webhooks/duitku` (form-urlencoded, HMAC verified)

## Data Architecture
- **Storage**: Cloudflare **D1** (SQLite)
- **Tables**:
  - `sub_brands` — registry (prefix routing, webhook_url, webhook_secret, mor_fee_bps)
  - `invoices` — invoice MoR (merchant_order_id, sub_brand_id, duitku_reference, status…)
  - `callbacks` — audit raw callback + signature_valid
  - `fanout_log` — log delivery OBP → sub-brand
- **Routing key**: `merchantOrderId` = `{PREFIX}-{ts}-{rand}` → prefix → sub-brand

## Duitku Integration (real)
- Create Invoice: `POST https://api-prod.duitku.com/api/merchant/createInvoice`
  - Header signature: `x-duitku-signature = HMAC_SHA256(merchantCode+timestamp, apiKey)`
- Callback verify: `signature = HMAC_SHA256(merchantCode+amount+merchantOrderId, apiKey)`
- POP JS: `https://app-prod.duitku.com/lib/js/duitku.js` → `checkout.process(reference,…)`
- ✅ Tested against production merchant `D20919`: real reference + paymentUrl returned;
  valid callback → `paid` + fan-out; bad signature → rejected.

## Configuration (secrets — never committed)
Local dev: `.dev.vars` (gitignored). Production: `wrangler pages secret put`.
```
DUITKU_MERCHANT_CODE=D20919
DUITKU_API_KEY=********
DUITKU_ENV=production
OBP_BASE_URL=        # auto-detect if empty
```

## User Guide
1. Buka `/` → pilih sub-brand, isi nominal & data customer → "Bayar Sekarang".
2. OBP membuat invoice via Duitku → buka POP JS (atau redirect ke hosted page).
3. Setelah bayar, customer diarahkan ke `/payment/return` (polling status real-time).
4. Duitku kirim callback → OBP verifikasi → update status → fan-out ke sub-brand.

## Local Development
```bash
npm install
npm run build
npm run db:migrate:local && npm run db:seed
pm2 start ecosystem.config.cjs        # http://localhost:3000
```

## Deployment
- **Platform**: Cloudflare Pages
- **Status**: ✅ Built & tested locally (real Duitku prod). Siap deploy.
- **Tech Stack**: Hono + TypeScript + Cloudflare Pages/Workers + D1 + TailwindCSS (CDN)
- **GitHub**: https://github.com/Sparkmind-obp-off/OBP-Checkout-Orchestration
- **Last Updated**: 2026-06-24

## Canonical Docs (SSOT)
- `docs/DUITKU-MOR-CANONICAL-SSOT.md` — teknis: 1 merchant code → MoR multi-brand
- `docs/OBP-MOR-ECOSYSTEM-SSOT.md` — strategis: OBP sbg real MoR ekosistem

## Not Yet Implemented / Next Steps
- Rate-limit `/api/invoices` (Cloudflare Rules)
- Webhook replay protection (nonce + timestamp window) + fan-out retry queue
- Settlement/reconciliation daily job + brand ledger statements (PDF)
- Real sub-brand webhook endpoints (saat ini demo domain → 404 saat fan-out)
- Production secrets via `wrangler pages secret put` + D1 remote migration
