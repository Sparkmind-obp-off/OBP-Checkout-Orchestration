import { OFFERS, OFFER_TIERS, type Offer } from '../data/offers'

function rupiahNote(o: Offer): string {
  if (o.billing === 'per-bulan') return `${o.priceLabel}/bln`
  return o.priceLabel
}

function OfferCard({ o }: { o: Offer }) {
  const instant = o.checkout === 'instant' && o.priceIdr
  const href = instant
    ? `/checkout?offer=${o.slug}`
    : `/checkout?offer=${o.slug}&mode=intake`
  return (
    <article class="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col hover:border-amber-500/40 transition" id={`offer-${o.slug}`}>
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <i class={`fas ${o.icon}`}></i>
        </div>
        <span class="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-slate-800 text-slate-400">{o.tier}</span>
      </div>
      <h3 class="font-semibold text-base leading-snug">{o.name}</h3>
      <p class="text-sm text-slate-400 mt-1 flex-1">{o.promise}</p>

      <ul class="mt-3 space-y-1 text-xs text-slate-400">
        {o.outcomes.map((x) => (
          <li class="flex gap-2"><i class="fas fa-check text-emerald-400 mt-0.5"></i><span>{x}</span></li>
        ))}
      </ul>

      <div class="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
        <div>
          <div class="font-bold text-amber-300">{rupiahNote(o)}</div>
          <div class="text-[10px] text-slate-500">{o.checkout === 'instant' ? 'Checkout langsung' : 'Lewat intake (HITL)'}</div>
        </div>
        <a href={href} class="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-bold hover:bg-amber-400 transition">
          {o.checkout === 'instant' ? 'Beli' : 'Konsultasi'}
        </a>
      </div>
      <details class="mt-3 text-[11px] text-slate-500">
        <summary class="cursor-pointer hover:text-slate-300">Mesin (engine skills)</summary>
        <p class="mt-1">{o.engineSkills.join(' · ')}</p>
      </details>
    </article>
  )
}

export function FoundryCatalog() {
  return (
    <main class="max-w-6xl mx-auto px-4 py-10">
      <header class="text-center mb-10 max-w-2xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-4">
          <i class="fas fa-industry"></i> Katalog Outcome
        </div>
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight">Pilih hasil yang ingin Anda dapatkan</h1>
        <p class="text-slate-400 mt-3">
          Kami tidak menjual alat — kami menjual <strong class="text-slate-200">hasil yang sudah jalan</strong>.
          Pilih outcome, bayar lewat rel MoR yang patuh, kami rakit & deliver.
        </p>
      </header>

      {OFFER_TIERS.map((t) => {
        const items = OFFERS.filter((o) => o.tier === t.id)
        if (!items.length) return null
        return (
          <section class="mb-12" id={`tier-${t.id}`}>
            <div class="flex items-baseline gap-3 mb-4">
              <h2 class="text-xl font-bold">{t.label}</h2>
              <span class="text-xs text-slate-500">{t.role}</span>
            </div>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((o) => <OfferCard o={o} />)}
            </div>
          </section>
        )
      })}

      <p class="text-center text-xs text-slate-500 border-t border-slate-800 pt-6">
        Semua pembayaran diproses oleh <strong>Oasis BI Pro</strong> sebagai Merchant-of-Record ekosistem SparkMind,
        di rel PJP <strong>Duitku</strong> (terdaftar Bank Indonesia). Truth-Lock: hanya outcome yang bisa kami rakit yang dijual.
      </p>
    </main>
  )
}
