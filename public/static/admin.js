// Admin dashboard — read-only data loader for /admin
function fmtIdr(n) {
  if (n == null) return '—'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}
function statusBadge(s) {
  const map = {
    paid: 'text-emerald-400', pending: 'text-amber-300',
    failed: 'text-rose-400', expired: 'text-slate-500', refunded: 'text-sky-400'
  }
  return '<span class="' + (map[s] || 'text-slate-300') + '">' + (s || '—') + '</span>'
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

async function loadStats() {
  try {
    const r = await fetch('/api/stats')
    if (!r.ok) throw new Error('stats http ' + r.status)
    const d = await r.json()

    const s = d.summary || {}
    document.getElementById('stat-0').textContent = s.total_invoices ?? 0
    document.getElementById('stat-1').textContent = s.paid_count ?? 0
    document.getElementById('stat-2').textContent = s.pending_count ?? 0
    document.getElementById('stat-3').textContent = fmtIdr(s.paid_amount_idr ?? 0)

    // Invoices
    const inv = d.recent_invoices || []
    document.getElementById('tbody-invoices').innerHTML = inv.length
      ? inv.map((x) =>
          '<tr class="border-b border-slate-800/60"><td class="py-2 pr-2"><code>' + esc(x.merchant_order_id) + '</code></td>' +
          '<td class="pr-2">' + esc(x.sub_brand_id) + '</td>' +
          '<td class="pr-2">' + fmtIdr(x.amount_idr) + '</td>' +
          '<td class="pr-2">' + statusBadge(x.status) + '</td></tr>').join('')
      : '<tr><td colspan="4" class="py-3 text-slate-500">Belum ada invoice.</td></tr>'

    // Callbacks
    const cb = d.recent_callbacks || []
    document.getElementById('tbody-callbacks').innerHTML = cb.length
      ? cb.map((x) =>
          '<tr class="border-b border-slate-800/60"><td class="py-2 pr-2"><code>' + esc(x.merchant_order_id) + '</code></td>' +
          '<td class="pr-2">' + esc(x.result_code) + '</td>' +
          '<td class="pr-2">' + (x.signature_valid ? '<span class="text-emerald-400">✓</span>' : '<span class="text-rose-400">✗</span>') + '</td>' +
          '<td class="pr-2 text-slate-500">' + esc(x.received_at) + '</td></tr>').join('')
      : '<tr><td colspan="4" class="py-3 text-slate-500">Belum ada callback.</td></tr>'

    // Fan-out
    const fo = d.recent_fanout || []
    document.getElementById('tbody-fanout').innerHTML = fo.length
      ? fo.map((x) =>
          '<tr class="border-b border-slate-800/60"><td class="py-2 pr-2">' + esc(x.sub_brand_id) + '</td>' +
          '<td class="pr-2">' + esc(x.event) + '</td>' +
          '<td class="pr-2 text-slate-500 max-w-[180px] truncate">' + esc(x.target_url) + '</td>' +
          '<td class="pr-2">' + esc(x.http_status) + '</td>' +
          '<td class="pr-2">' + (x.delivered ? '<span class="text-emerald-400">✓</span>' : '<span class="text-rose-400">✗</span>') + '</td>' +
          '<td class="pr-2 text-slate-500">' + esc(x.created_at) + '</td></tr>').join('')
      : '<tr><td colspan="6" class="py-3 text-slate-500">Belum ada fan-out.</td></tr>'
  } catch (e) {
    document.getElementById('tbody-invoices').innerHTML =
      '<tr><td colspan="4" class="py-3 text-rose-400">Gagal memuat: ' + esc(e.message) + '</td></tr>'
  }
}

document.addEventListener('DOMContentLoaded', loadStats)
