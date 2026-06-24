═══════════════════════════════════════════════════════════════════════════════

# 🏛️ OBP-MoR-ECOSYSTEM — CANONICAL SSOT (Single Source of Truth)

## Oasis BI Pro sebagai Real Merchant-of-Record untuk Ekosistem SparkMind

**Codename**: `OBP-MOR-ECOSYSTEM-SSOT`
**Doctrine Date**: 2026-06-24
**Owner**: Reza Estes / Haidar — Sovereign AI Dev
**Jurisdiction**: 🇮🇩 Indonesia (BI · OJK · PSE Kominfo · UU PDP)
**Status**: 🔒 CANONICAL · EXECUTE-READY · PUBLIC-SAFE
**Companion of**: `DUITKU-MOR-CANONICAL-SSOT` · `PAYMENT-FLOW-OBP v2.0` · `COMPLIANCE-RISK-MATRIX v2.0`

═══════════════════════════════════════════════════════════════════════════════

## §00 · DEFINISI

**Merchant-of-Record (MoR)** = entitas hukum/komersial yang **tercatat sebagai penjual
resmi** pada setiap transaksi pembayaran: penerbit invoice, penerima settlement,
pemegang relasi dengan PJP (Payment Service Provider), dan pihak yang bertanggung
jawab atas pajak, refund, chargeback, serta compliance.

**Oasis BI Pro (OBP)** = **MoR tunggal** untuk seluruh sub-brand ekosistem SparkMind.
Sub-brand (BarberKas, KuratorKas, dst) = **produk/merek**, BUKAN merchant. Mereka
tidak punya akun PJP sendiri; mereka "menumpang" di payment rail OBP.

═══════════════════════════════════════════════════════════════════════════════

## §01 · 4-LAYER LOCK (separation doctrine)

| Layer | Definisi | Contoh | Aturan |
|-------|----------|--------|--------|
| **Brand** | Merek yang dilihat customer | SparkMind, BarberKas | Boleh banyak |
| **Merchant** | Pihak transaksi resmi (MoR) | **Oasis BI Pro** | **HANYA SATU** |
| **Domain** | Domain teknis | `pay.oasis-bi-pro.web.id` | OBP yang own checkout |
| **Compliance** | Registrasi & kewajiban hukum | PSE Kominfo, NPWP, DPO | Atas nama OBP |

> ⛔ ANTI-PATTERN: jangan campur layer. Customer lihat "BarberKas" (Brand),
> tapi invoice & receipt diterbitkan "Oasis BI Pro" (Merchant). Settlement masuk
> rekening OBP. Sub-brand menerima entitlement via fan-out internal.

═══════════════════════════════════════════════════════════════════════════════

## §02 · DAFTAR SUB-BRAND (REGISTRY)

| Sub-brand | Prefix | Domain | Status |
|-----------|:------:|--------|--------|
| BarberKas | `BK` | barberkas.sparkmind.web.id | LIVE candidate |
| KuratorKas | `KK` | kuratorkas.sparkmind.web.id | dev |
| PaceLokal | `PL` | pacelokal.sparkmind.web.id | dev |
| Nurani.OS | `NO` | nuranios.sparkmind.web.id | dev |
| MomentKas | `MK` | momentkas.sparkmind.web.id | R&D |
| Petung Foundry | `PF` | petung.sparkmind.web.id | foundry |

> Prefix = bagian awal `merchantOrderId`, kunci routing fan-out (lihat
> `DUITKU-MOR-CANONICAL-SSOT §00`). Registry tersimpan di tabel D1 `sub_brands`.

═══════════════════════════════════════════════════════════════════════════════

## §03 · ALUR PEMBAYARAN LINTAS SUB-BRAND (END-TO-END)

```
Customer (sparkmind.web.id / sub-brand UI)
   │ 1. klik "Bayar"
   ▼
Sub-brand Frontend ──2. POST /api/invoices (sub_brand_id, amount)──► OBP Orchestrator
                                                                        │ (pay.oasis-bi-pro.web.id)
   ┌────────────────────────────────────────────────────────────────────┘
   │ 3. createInvoice (1 merchant code, callbackUrl=OBP)
   ▼
Duitku PJP ──4. paymentUrl/reference──► OBP ──5. POP JS / redirect──► Customer bayar
   │
   │ 6. settle ke rekening OBP
   │ 7. callback ke /webhooks/duitku (1 URL untuk semua brand)
   ▼
OBP Orchestrator ── verify HMAC ── routing by merchantOrderId prefix
   │ 8. FAN-OUT event payment.settled (HMAC X-OBP-Signature)
   ▼
Sub-brand backend ── activate entitlement (subscription/ticket/license)
```

**Inti jawaban "antar sub-brand":** pembayaran TIDAK mengalir "antar sub-brand"
secara langsung. Semua mengalir **ke OBP** (1 merchant code), lalu OBP **fan-out**
event ke sub-brand yang tepat. Uang riil = 1 rekening (OBP); pembagian ke sub-brand
= **bookkeeping internal** (brand ledger), bukan transfer PJP terpisah.

═══════════════════════════════════════════════════════════════════════════════

## §04 · SETTLEMENT & BRAND LEDGER (INTERNAL B2B)

Semua settlement masuk rekening OBP. Pembagian per sub-brand = ledger internal:

| Field | Keterangan |
|-------|-----------|
| `sub_brand_id` | brand penerima |
| `gross_idr` | total invoice settled |
| `pjp_fee_idr` | fee Duitku |
| `mor_fee_idr` | overhead OBP (default 1% / 100 bps, configurable per brand) |
| `net_payable_idr` | gross − pjp_fee − mor_fee |
| `refund_pool_idr` | 5% gross ditahan 60 hari (chargeback window) |

> Beneficial owner sama (Haidar) → transfer OBP→sub-brand = internal bookkeeping,
> dicatat dengan reason code. Bukan jual-beli antar entitas eksternal.

═══════════════════════════════════════════════════════════════════════════════

## §05 · DISCLOSURE WAJIB (UX)

**Footer checkout (locked):**
```
Pembayaran diproses oleh Oasis BI Pro (oasis-bi-pro.web.id) sebagai
Merchant-of-Record untuk ekosistem SparkMind. Pemrosesan kartu/bank
melalui PJP Duitku yang terdaftar di Bank Indonesia.
```

**Invoice header:**
```
Penerbit Invoice : Oasis BI Pro
NPWP             : <OBP NPWP>
Untuk Produk     : <Sub-Brand> (sub-brand ekosistem SparkMind)
```

═══════════════════════════════════════════════════════════════════════════════

## §06 · POSISI REGULASI (ringkas)

| Domain | Posisi OBP | Catatan |
|--------|-----------|---------|
| **BI (PBI 10/2025)** | **Merchant**, bukan PJP | OBP tidak memproses dana pihak lain sbg jasa; Duitku-lah PJP berlisensi |
| **OJK** | Tidak dalam scope (bukan PJP/IKD) | Re-assess kuartalan |
| **UU PDP** | DPO wajib | Haidar self-appointed DPO + DPIA |
| **PSE Kominfo** | Umbrella OBP | Semua subdomain terdaftar di bawah OBP |

> Detail penuh + risk register di `COMPLIANCE-RISK-MATRIX v2.0`.

═══════════════════════════════════════════════════════════════════════════════

## §07 · KEPUTUSAN KANONIK (LOCKED)

1. **Oasis BI Pro = MoR tunggal** untuk semua sub-brand SparkMind.
2. **1 merchant code + 1 API key Duitku** melayani semua brand (terbukti, §05 Duitku SSOT).
3. **1 callback URL** (`/webhooks/duitku`) → fan-out by `merchantOrderId` prefix.
4. Sub-brand tidak punya akun PJP; menerima entitlement via fan-out HMAC-signed.
5. Settlement 1 rekening OBP; pembagian brand = ledger internal (bukan transfer PJP).
6. Implementasi referensi: webapp `OBP-Checkout-Orchestration` (Hono + CF Pages + D1).

═══════════════════════════════════════════════════════════════════════════════

**END OF OBP-MOR-ECOSYSTEM-SSOT**

*Doctrine date: 2026-06-24 · Owner: Haidar · Status: CANONICAL · Public-Safe*
