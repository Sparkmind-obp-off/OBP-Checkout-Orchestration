-- ============================================================================
-- 0002 — Replay protection for Duitku callbacks
-- Add nonce (dedupe key) + is_replay flag to the callbacks audit trail.
-- An authentic callback is processed once; Duitku retries are acked idempotently.
-- ============================================================================

ALTER TABLE callbacks ADD COLUMN nonce TEXT;
ALTER TABLE callbacks ADD COLUMN is_replay INTEGER DEFAULT 0;

-- Unique nonce prevents double-processing of the same authentic callback.
CREATE UNIQUE INDEX IF NOT EXISTS idx_callbacks_nonce ON callbacks(nonce) WHERE nonce IS NOT NULL;
