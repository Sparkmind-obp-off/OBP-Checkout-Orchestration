// Duitku POP JS — loaded dynamically based on env (sandbox/production)
// Falls back to redirect to paymentUrl if POP JS unavailable.
async function loadDuitkuPop() {
  if (window.checkout) return true
  return new Promise((resolve) => {
    const s = document.createElement('script')
    // production lib; sandbox uses app-sandbox. We try production first.
    s.src = 'https://app-prod.duitku.com/lib/js/duitku.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.head.appendChild(s)
  })
}

async function loadSubBrands() {
  const sel = document.getElementById('sub_brand_id')
  const preset = (sel && sel.dataset && sel.dataset.preset) || ''
  try {
    const r = await fetch('/api/sub-brands')
    const d = await r.json()
    sel.innerHTML = ''
    ;(d.sub_brands || []).forEach((b) => {
      const o = document.createElement('option')
      o.value = b.id
      o.textContent = `${b.name} (${b.prefix})`
      sel.appendChild(o)
    })
    // honor preset sub-brand from ?offer= (checkout page)
    if (preset) sel.value = preset
  } catch (e) {
    sel.innerHTML = '<option value="">(gagal memuat sub-brand)</option>'
  }
}

function showResult(html, kind) {
  const el = document.getElementById('result')
  const colors = { ok: 'text-emerald-400', err: 'text-rose-400', info: 'text-amber-300' }
  el.className = 'mt-4 text-sm ' + (colors[kind] || 'text-slate-300')
  el.innerHTML = html
}

async function handleSubmit(e) {
  e.preventDefault()
  const btn = document.getElementById('pay-btn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memproses…'
  showResult('Membuat invoice atas nama Oasis BI Pro…', 'info')

  const payload = {
    sub_brand_id: document.getElementById('sub_brand_id').value,
    amount_idr: parseInt(document.getElementById('amount_idr').value, 10),
    product_details: document.getElementById('product_details').value,
    customer: {
      name: document.getElementById('cust_name').value,
      email: document.getElementById('cust_email').value,
      phone: document.getElementById('cust_phone').value
    }
  }

  try {
    const r = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify(payload)
    })
    const d = await r.json()
    if (!r.ok) {
      showResult('<i class="fas fa-circle-exclamation mr-1"></i> Gagal: ' + (d.error || 'unknown') +
        (d.detail ? '<br><span class="text-slate-500">' + d.detail + '</span>' : ''), 'err')
      return
    }

    showResult('<i class="fas fa-check mr-1"></i> Invoice dibuat: <code>' + d.invoice_id + '</code><br>' +
      'Reference Duitku: <code>' + (d.reference || '-') + '</code><br>Membuka pembayaran…', 'ok')

    const popOk = await loadDuitkuPop()
    if (popOk && window.checkout && d.reference) {
      window.checkout.process(d.reference, {
        successEvent: function () { location.href = '/payment/return?order=' + encodeURIComponent(d.invoice_id) },
        pendingEvent: function () { location.href = '/payment/return?order=' + encodeURIComponent(d.invoice_id) },
        errorEvent: function () { showResult('Pembayaran error. Coba lagi.', 'err') },
        closeEvent: function () { location.href = '/payment/return?order=' + encodeURIComponent(d.invoice_id) }
      })
    } else if (d.checkout_url) {
      // fallback: redirect to Duitku hosted page
      window.location.href = d.checkout_url
    } else {
      showResult('Invoice dibuat tapi tidak ada payment URL.', 'err')
    }
  } catch (err) {
    showResult('Kesalahan jaringan: ' + err.message, 'err')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-bolt mr-2"></i>Bayar Sekarang'
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSubBrands()
  const form = document.getElementById('checkout-form')
  if (form) form.addEventListener('submit', handleSubmit)
})
