-- ============================================================================
-- OBP CHECKOUT ORCHESTRATOR — Initial Schema
-- Oasis BI Pro = single Merchant-of-Record (MoR) for the SparkMind ecosystem
-- ============================================================================

-- Sub-brands registered under the OBP Merchant-of-Record umbrella.
-- Each sub-brand gets a short prefix used to encode merchantOrderId
-- (e.g. BK-... for BarberKas), enabling callback fan-out from a single
-- Duitku merchant code + single callback URL.
CREATE TABLE IF NOT EXISTS sub_brands (
  id            TEXT PRIMARY KEY,          -- slug, e.g. 'barberkas'
  prefix        TEXT UNIQUE NOT NULL,      -- merchantOrderId prefix, e.g. 'BK'
  name          TEXT NOT NULL,             -- display name
  domain        TEXT,                      -- product domain
  webhook_url   TEXT,                      -- sub-brand backend webhook (fan-out target)
  webhook_secret TEXT,                     -- per-sub-brand HMAC secret for fan-out
  mor_fee_bps   INTEGER DEFAULT 100,       -- OBP overhead in basis points (100 = 1%)
  active        INTEGER DEFAULT 1,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Invoices issued atas nama Oasis BI Pro (MoR), per sub-brand product.
CREATE TABLE IF NOT EXISTS invoices (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  merchant_order_id   TEXT UNIQUE NOT NULL,   -- {PREFIX}-{timestamp}-{rand}
  sub_brand_id        TEXT NOT NULL,
  external_ref        TEXT,                   -- sub-brand's own reference
  amount_idr          INTEGER NOT NULL,
  product_details     TEXT NOT NULL,
  customer_name       TEXT,
  customer_email      TEXT,
  customer_phone      TEXT,
  metadata_json       TEXT,                   -- arbitrary sub-brand metadata
  -- Duitku linkage
  duitku_reference    TEXT,                   -- reference returned by Duitku
  payment_url         TEXT,                   -- Duitku hosted payment URL
  -- lifecycle
  status              TEXT NOT NULL DEFAULT 'pending', -- pending|paid|expired|failed|refunded
  result_code         TEXT,                   -- last Duitku resultCode (00/01/02)
  pjp_ref             TEXT,                   -- publisherOrderId from callback
  settled_at          DATETIME,
  idempotency_key     TEXT,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sub_brand_id) REFERENCES sub_brands(id)
);

-- Raw callbacks received from Duitku (audit trail + replay protection).
CREATE TABLE IF NOT EXISTS callbacks (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  merchant_order_id TEXT,
  reference         TEXT,
  result_code       TEXT,
  amount            TEXT,
  signature_valid   INTEGER,
  raw_body          TEXT,
  received_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fan-out delivery log: OBP -> sub-brand backend.
CREATE TABLE IF NOT EXISTS fanout_log (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id        INTEGER,
  sub_brand_id      TEXT,
  event             TEXT,                   -- payment.settled / payment.failed
  target_url        TEXT,
  http_status       INTEGER,
  response_snippet  TEXT,
  delivered         INTEGER DEFAULT 0,
  attempts          INTEGER DEFAULT 0,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_order   ON invoices(merchant_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_brand   ON invoices(sub_brand_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status  ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_callbacks_order  ON callbacks(merchant_order_id);
CREATE INDEX IF NOT EXISTS idx_fanout_invoice   ON fanout_log(invoice_id);
