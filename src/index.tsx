import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'
import {
  createInvoice,
  verifyCallbackSignature,
  type DuitkuConfig
} from './duitku'
import { Home } from './views/home'
import { FoundryCatalog } from './views/foundry'
import { CheckoutPage } from './views/checkout'
import { AdminDashboard } from './views/admin'
import { OFFERS } from './data/offers'

type Bindings = {
  DB: D1Database
  DUITKU_MERCHANT_CODE: string
  DUITKU_API_KEY: string
  DUITKU_ENV: string
  OBP_BASE_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './public' }))
app.use(renderer)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function duitkuCfg(env: Bindings): DuitkuConfig {
  return {
    merchantCode: env.DUITKU_MERCHANT_CODE || '',
    apiKey: env.DUITKU_API_KEY || '',
    env: (env.DUITKU_ENV === 'production' ? 'production' : 'sandbox')
  }
}

function obpBaseUrl(env: Bindings, reqUrl: string): string {
  if (env.OBP_BASE_URL) return env.OBP_BASE_URL.replace(/\/$/, '')
  const u = new URL(reqUrl)
  return `${u.protocol}//${u.host}`
}

function genMerchantOrderId(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `${prefix}-${ts}-${rnd}`
}

// fan-out: deliver settled/failed event to a sub-brand backend, HMAC-signed
async function fanoutToSubBrand(
  db: D1Database,
  brand: any,
  invoice: any,
  event: string
): Promise<void> {
  if (!brand?.webhook_url) return
  const payload = JSON.stringify({
    event,
    invoice_id: invoice.merchant_order_id,
    external_ref: invoice.external_ref,
    sub_brand_id: invoice.sub_brand_id,
    amount_idr: invoice.amount_idr,
    pjp: 'duitku',
    pjp_ref: invoice.pjp_ref,
    merchant_of_record: 'Oasis BI Pro',
    settled_at: invoice.settled_at,
    metadata: invoice.metadata_json ? JSON.parse(invoice.metadata_json) : {}
  })

  // sign with sub-brand secret
  let sigHex = ''
  try {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(brand.webhook_secret || ''),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
    sigHex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch { /* ignore */ }

  let httpStatus = 0
  let snippet = ''
  let delivered = 0
  try {
    const res = await fetch(brand.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-OBP-Signature': sigHex },
      body: payload,
      signal: AbortSignal.timeout(8000)
    })
    httpStatus = res.status
    snippet = (await res.text()).slice(0, 200)
    delivered = res.ok ? 1 : 0
  } catch (e: any) {
    snippet = `delivery error: ${e?.message || 'unknown'}`
  }

  await db.prepare(
    `INSERT INTO fanout_log (invoice_id, sub_brand_id, event, target_url, http_status, response_snippet, delivered, attempts)
     VALUES (NULL, ?, ?, ?, ?, ?, ?, 1)`
  ).bind(invoice.sub_brand_id, event, brand.webhook_url, httpStatus, snippet, delivered).run()
}

// ===========================================================================
// API: list sub-brands
// ===========================================================================
app.get('/api/sub-brands', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, prefix, name, domain, mor_fee_bps, active FROM sub_brands WHERE active = 1 ORDER BY name`
  ).all()
  return c.json({ sub_brands: results })
})

// ===========================================================================
// API: create invoice (sub-brand -> OBP -> Duitku)
// ===========================================================================
app.post('/api/invoices', async (c) => {
  const env = c.env
  const cfg = duitkuCfg(env)
  if (!cfg.merchantCode || !cfg.apiKey) {
    return c.json({ error: 'Duitku credentials not configured (set DUITKU_MERCHANT_CODE / DUITKU_API_KEY)' }, 500)
  }

  let body: any
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid JSON' }, 400) }

  const subBrandId = String(body.sub_brand_id || '').toLowerCase()
  const amount = parseInt(body.amount_idr, 10)
  const product = String(body.product_details || '').trim()

  if (!subBrandId) return c.json({ error: 'sub_brand_id required' }, 400)
  if (!amount || amount < 1000) return c.json({ error: 'amount_idr must be >= 1000' }, 400)
  if (!product) return c.json({ error: 'product_details required' }, 400)

  const brand = await env.DB.prepare(
    `SELECT * FROM sub_brands WHERE id = ? AND active = 1`
  ).bind(subBrandId).first<any>()
  if (!brand) return c.json({ error: `unknown sub_brand_id: ${subBrandId}` }, 404)

  // idempotency
  const idemKey = c.req.header('Idempotency-Key') || ''
  if (idemKey) {
    const existing = await env.DB.prepare(
      `SELECT * FROM invoices WHERE idempotency_key = ?`
    ).bind(idemKey).first<any>()
    if (existing) {
      return c.json({
        invoice_id: existing.merchant_order_id,
        checkout_url: existing.payment_url,
        reference: existing.duitku_reference,
        status: existing.status,
        merchant_of_record: 'Oasis BI Pro',
        cached: true
      })
    }
  }

  const merchantOrderId = genMerchantOrderId(brand.prefix)
  const base = obpBaseUrl(env, c.req.url)
  const callbackUrl = `${base}/webhooks/duitku`
  const returnUrl = `${base}/payment/return?order=${encodeURIComponent(merchantOrderId)}`

  // persist pending invoice first
  await env.DB.prepare(
    `INSERT INTO invoices
      (merchant_order_id, sub_brand_id, external_ref, amount_idr, product_details,
       customer_name, customer_email, customer_phone, metadata_json, status, idempotency_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).bind(
    merchantOrderId, subBrandId, body.external_ref || null, amount, product,
    body.customer?.name || null, body.customer?.email || null, body.customer?.phone || null,
    body.metadata ? JSON.stringify(body.metadata) : null, idemKey || null
  ).run()

  const result = await createInvoice(cfg, {
    merchantOrderId,
    paymentAmount: amount,
    productDetails: `${brand.name} · ${product}`,
    email: body.customer?.email,
    customerName: body.customer?.name,
    phoneNumber: body.customer?.phone,
    callbackUrl,
    returnUrl,
    additionalParam: subBrandId
  })

  if (!result.ok) {
    await env.DB.prepare(`UPDATE invoices SET status='failed', updated_at=CURRENT_TIMESTAMP WHERE merchant_order_id=?`)
      .bind(merchantOrderId).run()
    return c.json({ error: 'Duitku createInvoice failed', detail: result.error, raw: result.raw }, 502)
  }

  await env.DB.prepare(
    `UPDATE invoices SET duitku_reference=?, payment_url=?, updated_at=CURRENT_TIMESTAMP WHERE merchant_order_id=?`
  ).bind(result.reference, result.paymentUrl, merchantOrderId).run()

  return c.json({
    invoice_id: merchantOrderId,
    reference: result.reference,
    checkout_url: result.paymentUrl,
    payment_url: result.paymentUrl,
    merchant_of_record: 'Oasis BI Pro',
    pjp_provider: 'duitku',
    sub_brand: brand.name,
    amount_idr: amount,
    status: 'pending'
  })
})

// ===========================================================================
// API: get invoice status
// ===========================================================================
app.get('/api/invoices/:orderId', async (c) => {
  const orderId = c.req.param('orderId')
  const inv = await c.env.DB.prepare(`SELECT * FROM invoices WHERE merchant_order_id = ?`)
    .bind(orderId).first<any>()
  if (!inv) return c.json({ error: 'not found' }, 404)
  return c.json(inv)
})

// ===========================================================================
// WEBHOOK: single Duitku callback URL -> fan-out to sub-brands
// This is the heart of the MoR pattern.
// ===========================================================================
app.post('/webhooks/duitku', async (c) => {
  const cfg = duitkuCfg(c.env)
  const raw = await c.req.parseBody()

  const merchantCode = String(raw.merchantCode || '')
  const amount = String(raw.amount || '')
  const merchantOrderId = String(raw.merchantOrderId || '')
  const resultCode = String(raw.resultCode || '')
  const reference = String(raw.reference || '')
  const publisherOrderId = String(raw.publisherOrderId || '')
  const signature = String(raw.signature || '')

  const valid = await verifyCallbackSignature(cfg, merchantCode, amount, merchantOrderId, signature)

  // --- Replay protection (nonce) ---
  // Each authentic Duitku callback for a given (order, reference, resultCode, signature)
  // tuple should be processed once. Duitku may retry the same callback; we must be
  // idempotent. We use the signature as a nonce key + the result_code to dedupe.
  const nonce = `${merchantOrderId}:${reference}:${resultCode}:${signature.slice(0, 32)}`
  let isReplay = false
  if (valid) {
    const seen = await c.env.DB.prepare(
      `SELECT 1 FROM callbacks WHERE nonce = ? LIMIT 1`
    ).bind(nonce).first()
    if (seen) isReplay = true
  }

  await c.env.DB.prepare(
    `INSERT INTO callbacks (merchant_order_id, reference, result_code, amount, signature_valid, raw_body, nonce, is_replay)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(merchantOrderId, reference, resultCode, amount, valid ? 1 : 0, JSON.stringify(raw), valid ? nonce : null, isReplay ? 1 : 0).run()

  if (!valid) {
    return c.text('invalid signature', 401)
  }

  // Already processed this exact callback -> ack without re-firing fan-out
  if (isReplay) {
    return c.text('SUCCESS', 200)
  }

  const inv = await c.env.DB.prepare(`SELECT * FROM invoices WHERE merchant_order_id = ?`)
    .bind(merchantOrderId).first<any>()
  if (!inv) return c.text('unknown order', 200) // ack to stop retries

  // Duitku resultCode mapping:
  //   00 = success/paid · 01 = failed · 02 = pending (awaiting payment)
  let newStatus = inv.status
  let event = ''
  if (resultCode === '00' && inv.status !== 'paid') {
    newStatus = 'paid'
    event = 'payment.settled'
  } else if (resultCode === '01') {
    newStatus = 'failed'
    event = 'payment.failed'
  } else if (resultCode === '02' && inv.status === 'pending') {
    // explicit pending — keep pending, no fan-out
    newStatus = 'pending'
    event = ''
  }

  if (newStatus !== inv.status) {
    await c.env.DB.prepare(
      `UPDATE invoices SET status=?, result_code=?, pjp_ref=?,
        settled_at=CASE WHEN ?='paid' THEN CURRENT_TIMESTAMP ELSE settled_at END,
        updated_at=CURRENT_TIMESTAMP WHERE merchant_order_id=?`
    ).bind(newStatus, resultCode, publisherOrderId, newStatus, merchantOrderId).run()

    if (event) {
      const brand = await c.env.DB.prepare(`SELECT * FROM sub_brands WHERE id = ?`)
        .bind(inv.sub_brand_id).first<any>()
      const fresh = { ...inv, status: newStatus, pjp_ref: publisherOrderId, settled_at: new Date().toISOString() }
      // fan-out asynchronously (best-effort)
      await fanoutToSubBrand(c.env.DB, brand, fresh, event)
    }
  }

  // Duitku expects 'SUCCESS' text response on a handled callback
  return c.text('SUCCESS', 200)
})

// ===========================================================================
// PAGES (UI)
// ===========================================================================

// Payment return page (after redirect from Duitku)
app.get('/payment/return', (c) => {
  const order = c.req.query('order') || ''
  return c.render(
    <main class="max-w-xl mx-auto px-4 py-16 text-center">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <i class="fas fa-receipt text-amber-400 text-5xl mb-4"></i>
        <h1 class="text-2xl font-bold mb-2">Status Pembayaran</h1>
        <p class="text-slate-400 mb-6">Order: <code class="text-amber-300">{order}</code></p>
        <div id="status" class="text-lg font-semibold mb-6 text-slate-300">Memeriksa status…</div>
        <a href="/" class="inline-block px-5 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400">Kembali ke Checkout</a>
        <p class="mt-8 text-xs text-slate-500">Pembayaran diproses oleh <strong>Oasis BI Pro</strong> sebagai Merchant-of-Record untuk ekosistem SparkMind. Pemrosesan melalui PJP Duitku yang terdaftar di Bank Indonesia.</p>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `
        const order = ${JSON.stringify(order)};
        async function poll(){
          try{
            const r = await fetch('/api/invoices/'+encodeURIComponent(order));
            if(r.ok){ const d = await r.json();
              const el = document.getElementById('status');
              const map = {paid:['Pembayaran Berhasil ✅','text-emerald-400'], pending:['Menunggu Pembayaran…','text-amber-300'], failed:['Pembayaran Gagal ❌','text-rose-400'], expired:['Kedaluwarsa','text-slate-400']};
              const m = map[d.status]||[d.status,'text-slate-300'];
              el.textContent = m[0]; el.className = 'text-lg font-semibold mb-6 '+m[1];
              if(d.status==='pending'){ setTimeout(poll, 3000); }
            }
          }catch(e){}
        }
        poll();
      ` }} />
    </main>,
    { title: 'Status Pembayaran · OBP' }
  )
})

// Home — SparkMind X · Outcome Foundry (narasi utama)
app.get('/', (c) => {
  return c.render(<Home />, { title: 'SparkMind X · Outcome Foundry' })
})

// Foundry — katalog outcome/SKU
app.get('/foundry', (c) => {
  return c.render(<FoundryCatalog />, { title: 'Katalog Outcome · SparkMind X' })
})

// Checkout — form MoR (mendukung pre-fill via ?offer= & mode=intake)
app.get('/checkout', (c) => {
  const offer = c.req.query('offer') || undefined
  const mode = c.req.query('mode') || undefined
  return c.render(<CheckoutPage offerSlug={offer} mode={mode} />, { title: 'Checkout · SparkMind X' })
})

// Admin — dashboard read-only
app.get('/admin', (c) => {
  return c.render(<AdminDashboard />, { title: 'Foundry Admin · SparkMind X' })
})

// ===========================================================================
// API: offer catalog (Outcome Foundry SKUs)
// ===========================================================================
app.get('/api/offers', (c) => {
  return c.json({ offers: OFFERS })
})

// ===========================================================================
// API: admin stats (read-only observability)
// ===========================================================================
app.get('/api/stats', async (c) => {
  const db = c.env.DB

  const summary = await db.prepare(
    `SELECT
       COUNT(*) AS total_invoices,
       SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) AS paid_count,
       SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending_count,
       SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed_count,
       COALESCE(SUM(CASE WHEN status='paid' THEN amount_idr ELSE 0 END), 0) AS paid_amount_idr
     FROM invoices`
  ).first<any>()

  const recentInvoices = await db.prepare(
    `SELECT merchant_order_id, sub_brand_id, amount_idr, status, product_details, created_at
     FROM invoices ORDER BY id DESC LIMIT 20`
  ).all()

  const recentCallbacks = await db.prepare(
    `SELECT merchant_order_id, reference, result_code, signature_valid, is_replay, received_at
     FROM callbacks ORDER BY id DESC LIMIT 20`
  ).all()

  const recentFanout = await db.prepare(
    `SELECT sub_brand_id, event, target_url, http_status, delivered, created_at
     FROM fanout_log ORDER BY id DESC LIMIT 20`
  ).all()

  return c.json({
    summary: summary || {},
    recent_invoices: recentInvoices.results || [],
    recent_callbacks: recentCallbacks.results || [],
    recent_fanout: recentFanout.results || []
  })
})

// Favicon (avoid 500/404 noise)
app.get('/favicon.ico', (c) => c.body(null, 204))

// Health
app.get('/api/health', (c) => c.json({
  status: 'ok',
  service: 'obp-checkout-orchestrator',
  duitku_env: c.env.DUITKU_ENV || 'unset',
  configured: !!(c.env.DUITKU_MERCHANT_CODE && c.env.DUITKU_API_KEY)
}))

export default app
