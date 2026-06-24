═══════════════════════════════════════════════════════════════════════════════

# 🔐 DUITKU-MoR — CANONICAL SSOT (Single Source of Truth)

## Cara 1 Merchant Code Duitku Menjadi Merchant-of-Record Multi-Sub-Brand

**Codename**: `DUITKU-MOR-CANONICAL-SSOT`
**Doctrine Date**: 2026-06-24
**Owner**: Reza Estes / Haidar — Sovereign AI Dev
**Status**: 🔒 CANONICAL · EXECUTE-READY · IMPLEMENTED
**Companion of**: `PAYMENT-FLOW-OBP v2.0` · `OBP-MOR-ECOSYSTEM-SSOT` · `COMPLIANCE-RISK-MATRIX v2.0`
**Implemented in**: `OBP-Checkout-Orchestration` webapp (Hono + Cloudflare Pages + D1)

═══════════════════════════════════════════════════════════════════════════════

## §00 · PERTANYAAN INTI (THE CORE QUESTION)

> *"Apakah dari **1 merchant code + 1 API key Duitku** (production) bisa melayani
> pembayaran **real** untuk **banyak sub-brand** (BarberKas, KuratorKas, PaceLokal,
> Nurani.OS, MomentKas, Petung Foundry) lewat pola **MoR (Merchant-of-Record)**
> Oasis BI Pro — padahal Duitku callback URL "hanya 1"?"*

### ✅ JAWABAN KANONIK (berdasarkan dokumentasi resmi Duitku — docs.duitku.com/pop/en)

**YA, BISA — dan justru inilah desain yang BENAR untuk pola MoR.**

Tiga fakta teknis Duitku yang membuktikannya:

1. **`callbackUrl` di-set PER-TRANSAKSI**, bukan hanya statis di dashboard.
   Parameter `callbackUrl` & `returnUrl` dikirim di setiap request `createInvoice`.
   → Satu orchestrator URL (`/webhooks/duitku`) cukup untuk SEMUA sub-brand.

2. **`merchantOrderId` adalah identifier transaksi milik merchant** (string ≤ 50).
   → Kita **encode prefix sub-brand** di sini (mis. `BK-...` BarberKas, `KK-...` KuratorKas).
   → Saat callback masuk, prefix dipakai untuk **fan-out** ke sub-brand yang benar.

3. **`additionalParam`** = field metadata bebas → simpan `sub_brand_id` secara eksplisit.

➡️ **Arsitektur kunci**:
```
1 Duitku Merchant Code (D20919)
        │
        ├── createInvoice (per sub-brand, callbackUrl = OBP orchestrator)
        ▼
1 Callback URL  →  OBP Orchestrator  →  FAN-OUT (by merchantOrderId prefix)
   /webhooks/duitku                       ├── BarberKas backend
                                          ├── KuratorKas backend
                                          ├── PaceLokal backend
                                          └── ... dst
```

═══════════════════════════════════════════════════════════════════════════════

## §01 · KREDENSIAL & ENVIRONMENT

| Var | Keterangan | Sumber |
|-----|-----------|--------|
| `DUITKU_MERCHANT_CODE` | Merchant/Project code (mis. `D20919`) | Dashboard Duitku |
| `DUITKU_API_KEY` | Merchant API Key (rahasia) | Dashboard Duitku |
| `DUITKU_ENV` | `production` \| `sandbox` | Operator |
| `OBP_BASE_URL` | Base URL orchestrator (auto-detect jika kosong) | Deploy |

> ⚠️ **SECRET DISCIPLINE**: API key TIDAK PERNAH masuk frontend / git.
> Lokal → `.dev.vars` (gitignored). Production → `wrangler pages secret put`.

### Endpoint Duitku (POP)
| | URL |
|---|-----|
| Create Invoice (prod) | `https://api-prod.duitku.com/api/merchant/createInvoice` |
| Create Invoice (sandbox) | `https://api-sandbox.duitku.com/api/merchant/createInvoice` |
| POP JS lib (prod) | `https://app-prod.duitku.com/lib/js/duitku.js` |
| Hosted redirect | `https://app-prod.duitku.com/redirect_checkout?reference=...` |

═══════════════════════════════════════════════════════════════════════════════

## §02 · SIGNATURE (HMAC-SHA256 — wajib, MD5/SHA256 sudah obsolete per Apr 2026)

### 2.1 Request signature (createInvoice) — dikirim sebagai HTTP header
```
stringToSign = merchantCode + timestamp           (timestamp = epoch ms)
signature    = HMAC_SHA256(stringToSign, apiKey)  → hex lowercase
```
Headers:
```
x-duitku-signature : <signature>
x-duitku-timestamp : <timestamp>
x-duitku-merchantcode : <merchantCode>
```

### 2.2 Callback signature (verifikasi notifikasi dari Duitku)
```
stringToSign = merchantCode + amount + merchantOrderId
signature    = HMAC_SHA256(stringToSign, apiKey)  → hex
verify: constant-time compare(expected, callback.signature)
```

> Implementasi Web Crypto (Cloudflare Workers, TANPA node:crypto) ada di
> `src/duitku.ts` → `hmacSha256Hex()`, `verifyCallbackSignature()`, `safeEqual()`.

═══════════════════════════════════════════════════════════════════════════════

## §03 · CREATE INVOICE — REQUEST/RESPONSE (CONTRACT)

### Request body (JSON) ke Duitku
```json
{
  "paymentAmount": 49000,
  "merchantOrderId": "BK-MQRRWFN0-3B5IF",
  "productDetails": "BarberKas · Paket Pro Bulanan",
  "email": "budi@example.com",
  "customerVaName": "Budi Santoso",
  "phoneNumber": "08123456789",
  "callbackUrl": "https://pay.oasis-bi-pro.web.id/webhooks/duitku",
  "returnUrl": "https://pay.oasis-bi-pro.web.id/payment/return?order=BK-...",
  "additionalParam": "barberkas",
  "expiryPeriod": 60
}
```

### Response (sukses → `statusCode == "00"`)
```json
{
  "merchantCode": "D20919",
  "reference": "D20919261YE2UYJ745BMQ5S",
  "paymentUrl": "https://app-prod.duitku.com/redirect_checkout?reference=D20919261YE2UYJ745BMQ5S",
  "statusCode": "00",
  "statusMessage": "SUCCESS"
}
```
> `reference` WAJIB disimpan — dipakai untuk POP JS `checkout.process(reference, ...)`
> dan untuk rekonsiliasi.

═══════════════════════════════════════════════════════════════════════════════

## §04 · CALLBACK (NOTIFIKASI) — FAN-OUT MECHANISM

Duitku POST `application/x-www-form-urlencoded` ke `callbackUrl`. Field penting:

| Field | Guna |
|-------|------|
| `merchantCode` | verifikasi signature |
| `amount` | verifikasi signature + jumlah |
| `merchantOrderId` | **routing key** → ambil prefix → sub-brand |
| `resultCode` | `00`=sukses · `01`=gagal · `02`=pending/cancel |
| `reference` | reference Duitku |
| `publisherOrderId` | PJP ref (disimpan sbg `pjp_ref`) |
| `additionalParam` | `sub_brand_id` (redundansi aman) |
| `signature` | HMAC untuk diverifikasi |

### Algoritma orchestrator (`POST /webhooks/duitku`)
```
1. parse form body
2. verify HMAC_SHA256(merchantCode+amount+merchantOrderId, apiKey)
   - invalid → log + return 401 "invalid signature"
3. simpan raw callback (audit: tabel `callbacks`)
4. lookup invoice by merchantOrderId
5. map resultCode → status (00=paid, 01=failed)
6. jika status berubah → UPDATE invoices, lalu FAN-OUT:
      POST sub_brand.webhook_url  (HMAC X-OBP-Signature dgn secret sub-brand)
      payload: { event, invoice_id, sub_brand_id, amount_idr, pjp_ref, ... }
7. return text "SUCCESS" (Duitku berhenti retry)
```

### Fan-out signature (OBP → sub-brand)
```
X-OBP-Signature = HMAC_SHA256(raw_json_body, sub_brand.webhook_secret)
```
Sub-brand WAJIB verifikasi header ini sebelum activate entitlement.

═══════════════════════════════════════════════════════════════════════════════

## §05 · BUKTI EKSEKUSI (SMOKE TEST — REAL PRODUCTION)

Dijalankan terhadap Duitku **production** (merchant `D20919`):

| Step | Hasil |
|------|-------|
| `POST /api/invoices` BarberKas IDR 10.000 | ✅ `reference: D20919261YE2UYJ745BMQ5S`, `paymentUrl` real |
| Callback valid (`resultCode=00`) | ✅ status `paid`, fan-out fired, response `SUCCESS` |
| Callback bad signature | ✅ ditolak `invalid signature` (401) |
| Audit `callbacks` table | ✅ signature_valid 1 (valid) & 0 (invalid) ter-log |

═══════════════════════════════════════════════════════════════════════════════

## §06 · IDEMPOTENCY, RETRY, REKONSILIASI

- **Idempotency-Key** header di `POST /invoices` → invoice tidak dobel.
- Callback **idempotent**: status hanya berubah jika berbeda (paid sekali).
- **Rekonsiliasi**: cocokkan `reference` (Duitku) ↔ `merchant_order_id` (OBP) ↔
  `external_ref` (sub-brand). Drift > IDR 1.000 → review (lihat PAYMENT-FLOW §04).

═══════════════════════════════════════════════════════════════════════════════

## §07 · CHECKLIST KEAMANAN

- [x] API key hanya server-side (`.dev.vars` / Cloudflare secret), bukan di FE
- [x] Callback HMAC-SHA256 diverifikasi (constant-time)
- [x] Tidak menyimpan PAN/CVV (tokenisasi via PJP)
- [x] Audit log semua callback (tabel `callbacks`)
- [x] Fan-out HMAC-signed per sub-brand
- [ ] Rate-limit `/api/invoices` (Cloudflare Rules) — D3
- [ ] Replay protection (nonce + timestamp window) — D5
- [ ] API-key rotation 90 hari — D10

═══════════════════════════════════════════════════════════════════════════════

**END OF DUITKU-MOR-CANONICAL-SSOT**

*Doctrine date: 2026-06-24 · Owner: Haidar · Status: CANONICAL · Implemented & Tested (prod)*
