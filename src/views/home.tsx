import { OFFERS } from '../data/offers'

export function Home() {
  const featured = OFFERS.filter((o) =>
    ['kasir-booking', 'toko-online-cs', 'ai-staff-cs', 'app-custom', 'agentshield-audit', 'canon-course'].includes(o.slug)
  )
  return (
    <main>
      {/* Hero */}
      <section id="hero" class="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-5">
          <i class="fas fa-shield-halved"></i> Merchant-of-Record · Oasis BI Pro · rel Duitku
        </div>
        <h1 class="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          <span class="text-amber-400">SparkMind&nbsp;X</span> — Outcome Foundry
        </h1>
        <p class="text-lg text-slate-300 mt-4 max-w-2xl mx-auto">
          Pabrik <strong class="text-white">hasil bisnis</strong> untuk UMKM Indonesia. Masukkan masalah,
          keluarkan <strong class="text-white">aplikasi/otomasi yang sudah jalan</strong> — dalam hitungan hari, bukan bulan.
        </p>
        <div class="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a href="/foundry" class="px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition">
            <i class="fas fa-industry mr-2"></i>Lihat Katalog Outcome
          </a>
          <a href="/checkout" class="px-6 py-3 rounded-xl border border-slate-700 text-slate-200 font-semibold hover:bg-slate-900 transition">
            <i class="fas fa-cart-shopping mr-2"></i>Checkout Manual
          </a>
        </div>
      </section>

      {/* 3-layer system (B5-02) */}
      <section id="how-it-works" class="max-w-5xl mx-auto px-4 py-8">
        <div class="grid md:grid-cols-3 gap-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div class="text-xs text-amber-400 font-semibold mb-1">LAPIS 1 — PASAR</div>
            <h3 class="font-semibold mb-1">Outcome, bukan tooling</h3>
            <p class="text-sm text-slate-400">Yang Anda beli: hasil ("kasir online jalan"), bukan deliverable teknis.</p>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div class="text-xs text-amber-400 font-semibold mb-1">LAPIS 2 — FOUNDRY</div>
            <h3 class="font-semibold mb-1">Mesin perakit agentik</h3>
            <p class="text-sm text-slate-400">Pipeline intake → orchestration → fullstack-cycle → deploy, dengan quality-gate.</p>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div class="text-xs text-amber-400 font-semibold mb-1">LAPIS 3 — REL</div>
            <h3 class="font-semibold mb-1">Infra + uang + kepatuhan</h3>
            <p class="text-sm text-slate-400">Edge Cloudflare · MoR Oasis BI Pro di rel Duitku (QRIS/VA) — patuh & invisible.</p>
          </div>
        </div>
      </section>

      {/* Featured offers */}
      <section id="featured" class="max-w-6xl mx-auto px-4 py-10">
        <div class="flex items-baseline justify-between mb-5">
          <h2 class="text-2xl font-bold">Outcome unggulan</h2>
          <a href="/foundry" class="text-sm text-amber-300 hover:text-amber-200">Lihat semua →</a>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map((o) => (
            <a href={`/checkout?offer=${o.slug}${o.checkout === 'intake' ? '&mode=intake' : ''}`}
               class="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 transition block">
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                <i class={`fas ${o.icon}`}></i>
              </div>
              <h3 class="font-semibold">{o.name}</h3>
              <p class="text-sm text-slate-400 mt-1">{o.promise}</p>
              <div class="mt-3 text-amber-300 font-bold text-sm">{o.priceLabel}{o.billing === 'per-bulan' ? '/bln' : ''}</div>
            </a>
          ))}
        </div>
      </section>

      {/* MoR rail note */}
      <section class="max-w-3xl mx-auto px-4 pb-12">
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center">
          <i class="fas fa-fingerprint text-amber-400 text-2xl mb-2"></i>
          <p class="text-sm text-slate-400">
            Satu <strong class="text-slate-200">merchant code Duitku</strong> melayani semua sub-brand SparkMind.
            Callback tunggal di-<em>fan-out</em> berdasarkan prefix <code class="text-amber-300">merchantOrderId</code> —
            inilah inti pola <strong class="text-slate-200">Merchant-of-Record (MoR)</strong> Oasis BI Pro.
          </p>
        </div>
      </section>
    </main>
  )
}
