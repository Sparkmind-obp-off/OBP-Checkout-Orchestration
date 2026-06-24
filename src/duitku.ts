// ============================================================================
// Duitku POP integration (Merchant-of-Record core)
// Docs: https://docs.duitku.com/pop/en/
//
// KEY INSIGHT (the question this whole project answers):
// ONE Duitku merchant code + ONE callback URL CAN serve many sub-brands.
//   - callbackUrl is set PER-TRANSACTION in createInvoice (not only in dashboard)
//   - merchantOrderId encodes the sub-brand prefix (e.g. BK-..., KK-...)
//   - callback signature uses the single apiKey for verification
// => OBP orchestrator fans-out internally based on merchantOrderId prefix.
// ============================================================================

export interface DuitkuConfig {
  merchantCode: string
  apiKey: string
  env: 'sandbox' | 'production'
}

function baseUrl(env: string) {
  return env === 'production'
    ? 'https://api-prod.duitku.com'
    : 'https://api-sandbox.duitku.com'
}

// Web Crypto HMAC-SHA256 -> hex (Cloudflare Workers compatible, no node:crypto)
async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Constant-time hex string comparison
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export interface CreateInvoiceParams {
  merchantOrderId: string
  paymentAmount: number
  productDetails: string
  email?: string
  customerName?: string
  phoneNumber?: string
  callbackUrl: string
  returnUrl: string
  additionalParam?: string
}

export interface CreateInvoiceResult {
  ok: boolean
  statusCode?: string
  statusMessage?: string
  reference?: string
  paymentUrl?: string
  raw?: any
  error?: string
}

// createInvoice (Duitku POP). Request signature header:
//   x-duitku-signature = HMAC_SHA256(merchantCode + timestamp, apiKey)
export async function createInvoice(
  cfg: DuitkuConfig,
  params: CreateInvoiceParams
): Promise<CreateInvoiceResult> {
  const timestamp = Date.now().toString()
  const signature = await hmacSha256Hex(cfg.apiKey, cfg.merchantCode + timestamp)

  const body = {
    paymentAmount: params.paymentAmount,
    merchantOrderId: params.merchantOrderId,
    productDetails: params.productDetails,
    email: params.email || 'customer@oasis-bi-pro.web.id',
    customerVaName: (params.customerName || 'OBP Customer').slice(0, 20),
    phoneNumber: params.phoneNumber || '',
    callbackUrl: params.callbackUrl,
    returnUrl: params.returnUrl,
    additionalParam: params.additionalParam || '',
    expiryPeriod: 60
  }

  try {
    const res = await fetch(`${baseUrl(cfg.env)}/api/merchant/createInvoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-duitku-signature': signature,
        'x-duitku-timestamp': timestamp,
        'x-duitku-merchantcode': cfg.merchantCode
      },
      body: JSON.stringify(body)
    })

    const text = await res.text()
    let json: any
    try { json = JSON.parse(text) } catch { json = { rawText: text } }

    if (!res.ok || json.statusCode !== '00') {
      return {
        ok: false,
        statusCode: json.statusCode,
        statusMessage: json.statusMessage || `HTTP ${res.status}`,
        raw: json,
        error: json.statusMessage || `Duitku HTTP ${res.status}: ${text.slice(0, 200)}`
      }
    }

    return {
      ok: true,
      statusCode: json.statusCode,
      statusMessage: json.statusMessage,
      reference: json.reference,
      paymentUrl: json.paymentUrl,
      raw: json
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'network error calling Duitku' }
  }
}

// Verify callback signature.
// callback signature = HMAC_SHA256(merchantCode + amount + merchantOrderId, apiKey)
export async function verifyCallbackSignature(
  cfg: DuitkuConfig,
  merchantCode: string,
  amount: string,
  merchantOrderId: string,
  signature: string
): Promise<boolean> {
  if (!signature) return false
  const expected = await hmacSha256Hex(cfg.apiKey, merchantCode + amount + merchantOrderId)
  return safeEqual(expected.toLowerCase(), signature.toLowerCase())
}
