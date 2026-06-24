import { getOffer } from '../data/offers'

// Checkout page. If ?offer= is present and instant, pre-fill the form.
// If mode=intake (high-ticket), show intake/consultation panel instead.
export function CheckoutPage({ offerSlug, mode }: { offerSlug?: string; mode?: string }) {
  const offer = offerSlug ? getOffer(offerSlug) : undefined
  const isIntake = mode === 'intake' || (offer && offer.checkout === 'intake')

  if (offer && isIntake) {
    return (
      <main class="max-w-xl mx-auto px-4 py-12">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <i class={`fas ${offer.icon} text-xl`}></i>
          </div>
          <h1 class="text-2xl font-bold mb-1">{offer.name}</h1>
          <p class="text-slate-400 mb-4">{offer.promise}</p>
          <div class="inline-block px-3 py-1 rounded-lg bg-slate-800 text-amber-300 font-bold text-sm mb-6">{offer.priceLabel}</div>
          <div class="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-sm text-slate-300 mb-6">
            <i class="fas fa-circle-info text-amber-400 mr-2"></i>
            Outcome ini bersifat <strong>Done-for-You / high-ticket</strong>. Harga final & scope ditentukan
            lewat <strong>intake</strong> dan disetujui owner (HITL) sebelum invoice diterbitkan.
          </div>
          <a href={`mailto:halo@oasis-bi-pro.web.id?subject=${encodeURIComponent('Konsultasi: ' + offer.name)}`}
             class="block text-center w-full py-3 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition">
            <i class="fas fa-envelope mr-2"></i>Mulai Konsultasi / Intake
          </a>
          <a href="/foundry" class="block text-center mt-3 text-sm text-slate-400 hover:text-slate-200">← Kembali ke katalog</a>
        </div>
      </main>
    )
  }

  const presetProduct = offer ? offer.name : 'Paket Pro · Bulanan'
  const presetAmount = offer && offer.priceIdr ? offer.priceIdr : 49000
  const presetBrand = offer ? offer.subBrandId : ''

  return (
    <main class="max-w-3xl mx-auto px-4 py-10">
      <header class="text-center mb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
          <i class="fas fa-shield-halved"></i> Merchant-of-Record · Oasis BI Pro
        </div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Checkout Outcome</h1>
        {offer
          ? <p class="text-slate-400 mt-2">Anda membeli: <strong class="text-amber-300">{offer.name}</strong></p>
          : <p class="text-slate-400 mt-2">Satu merchant code Duitku → fan-out ke semua sub-brand SparkMind.</p>}
      </header>

      <section id="checkout-section" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
        <form id="checkout-form" class="space-y-4">
          <div>
            <label class="block text-sm text-slate-400 mb-1" for="sub_brand_id">Sub-brand</label>
            <select id="sub_brand_id" data-preset={presetBrand} class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"></select>
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-1" for="product_details">Produk / Deskripsi</label>
            <input id="product_details" value={presetProduct} class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-slate-400 mb-1" for="amount_idr">Nominal (IDR)</label>
              <input id="amount_idr" type="number" value={String(presetAmount)} min="1000" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label class="block text-sm text-slate-400 mb-1" for="cust_name">Nama Customer</label>
              <input id="cust_name" value="Budi Santoso" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-slate-400 mb-1" for="cust_email">Email</label>
              <input id="cust_email" type="email" value="budi@example.com" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label class="block text-sm text-slate-400 mb-1" for="cust_phone">No. HP</label>
              <input id="cust_phone" value="08123456789" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2" />
            </div>
          </div>
          <button type="submit" id="pay-btn" class="w-full py-3 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition">
            <i class="fas fa-bolt mr-2"></i>Bayar Sekarang
          </button>
        </form>
        <div id="result" class="mt-4 text-sm"></div>
        <p class="mt-6 text-xs text-slate-500 border-t border-slate-800 pt-4">
          Pembayaran diproses oleh <strong>Oasis BI Pro (oasis-bi-pro.web.id)</strong> sebagai Merchant-of-Record untuk ekosistem SparkMind. Pemrosesan kartu/bank melalui PJP Duitku yang terdaftar di Bank Indonesia.
        </p>
      </section>
      <script src="/static/duitku-pop.js"></script>
    </main>
  )
}
