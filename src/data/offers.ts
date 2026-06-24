// ============================================================================
// OUTCOME FOUNDRY — Katalog SKU (Lapis 1: yang dilihat pembeli)
// Sumber kanonik harga & tier: B5-03 (Business Model) + B4-03 (Productized Offers).
// Truth-Lock: hanya outcome yang bisa dirakit dari kapabilitas nyata yang dijual.
//
// Pola checkout:
//   - one-time / subscription (deterministik) -> checkout langsung via engine MoR (Duitku)
//   - high-ticket / setup -> intake lalu invoice (HITL gate owner)
// ============================================================================

export type OfferTier = 'vertical' | 'subscription' | 'high-ticket' | 'education' | 'developer'
export type CheckoutMode = 'instant' | 'intake'

export interface Offer {
  slug: string
  name: string            // nama = OUTCOME (bukan deliverable teknis)
  promise: string         // satu kalimat manfaat
  tier: OfferTier
  // sub_brand_id yang dipakai engine checkout (harus ada di tabel sub_brands)
  subBrandId: string
  // harga utama untuk checkout instan (IDR). null bila intake-only.
  priceIdr: number | null
  priceLabel: string      // label tampil (mis. "Rp 199.000" / "mulai Rp 5.000.000")
  billing: 'one-time' | 'per-bulan' | 'mulai'
  checkout: CheckoutMode
  icon: string            // font-awesome class
  outcomes: string[]      // value-metric deterministik (apa yang dibuktikan)
  engineSkills: string[]  // transparansi mesin (proof utk developer/partner)
  hitlGate: 'payment' | 'pricing' | 'legal' | 'none'
  cloudflareNative: boolean
}

export const OFFER_TIERS: { id: OfferTier; label: string; role: string }[] = [
  { id: 'vertical',     label: 'App Vertikal',  role: 'Akuisisi & land — problem nyata UMKM' },
  { id: 'subscription', label: 'AI Staff & Care', role: 'Retensi & MRR — outcome berkelanjutan' },
  { id: 'high-ticket',  label: 'Custom & Company', role: 'Expand — AOV besar, Done-for-You' },
  { id: 'education',    label: 'Edukasi',       role: 'Top-of-funnel & trust' },
  { id: 'developer',    label: 'Developer',     role: 'DIY / proof — bahan baku mesin' }
]

// Katalog kanonik (selaras B5-03 §2)
export const OFFERS: Offer[] = [
  // --- Vertical (beachhead) ---
  {
    slug: 'kasir-booking',
    name: 'Kasir + Booking Jasa Lokal',
    promise: 'Aplikasi kas + booking + reminder WhatsApp + profil online — jalan dalam hitungan hari.',
    tier: 'vertical', subBrandId: 'barberkas',
    priceIdr: 199000, priceLabel: 'Rp 199.000', billing: 'one-time', checkout: 'instant',
    icon: 'fa-cash-register',
    outcomes: ['App kas + booking live & dipakai', 'Reminder WhatsApp aktif', 'Profil online + URL bisa dibagikan'],
    engineSkills: ['fullstack-cycle', 'cf-byok-deploy', 'workflow-ops'],
    hitlGate: 'payment', cloudflareNative: true
  },
  {
    slug: 'toko-online-cs',
    name: 'Toko Online + CS Otomatis',
    promise: 'Toko online aktif dengan customer service auto-balas — siap jualan tanpa tim.',
    tier: 'vertical', subBrandId: 'kuratorkas',
    priceIdr: 490000, priceLabel: 'Rp 490.000', billing: 'one-time', checkout: 'instant',
    icon: 'fa-store',
    outcomes: ['Toko online & checkout live', 'CS auto-balas (log balasan)', 'Katalog produk terbit'],
    engineSkills: ['fullstack-cycle', 'squad-sales-cs', 'hermes-memory'],
    hitlGate: 'payment', cloudflareNative: true
  },
  {
    slug: 'mesin-konten',
    name: 'Mesin Konten & Promo',
    promise: 'Konten & promo terjadwal otomatis tiap minggu — kalender konten yang jalan sendiri.',
    tier: 'vertical', subBrandId: 'pacelokal',
    priceIdr: 490000, priceLabel: 'Rp 490.000', billing: 'one-time', checkout: 'instant',
    icon: 'fa-bullhorn',
    outcomes: ['N konten/promo terjadwal/minggu', 'Kalender konten terbit', 'Post pertama tayang'],
    engineSkills: ['squad-marketing', 'gtm-engineering', 'cmo'],
    hitlGate: 'payment', cloudflareNative: true
  },
  {
    slug: 'event-tiket',
    name: 'Sistem Event, Tiket & RSVP',
    promise: 'Halaman event terbit, tiket terjual, RSVP masuk — semua di satu tempat.',
    tier: 'vertical', subBrandId: 'momentkas',
    priceIdr: 490000, priceLabel: 'Rp 490.000', billing: 'one-time', checkout: 'instant',
    icon: 'fa-ticket',
    outcomes: ['Halaman event live', 'RSVP & tiket masuk', 'Rekap peserta'],
    engineSkills: ['fullstack-cycle', 'claw-actuation'],
    hitlGate: 'payment', cloudflareNative: true
  },
  {
    slug: 'donasi-keanggotaan',
    name: 'Sistem Donasi & Keanggotaan',
    promise: 'Halaman donasi & keanggotaan live & menerima — transparan, patuh UU PDP.',
    tier: 'vertical', subBrandId: 'nuranios',
    priceIdr: 490000, priceLabel: 'Rp 490.000', billing: 'one-time', checkout: 'instant',
    icon: 'fa-hand-holding-heart',
    outcomes: ['Halaman donasi live & menerima', 'Rekap donasi', 'Manajemen anggota'],
    engineSkills: ['fullstack-cycle', 'sovereign-zero-trust', 'legal'],
    hitlGate: 'payment', cloudflareNative: true
  },

  // --- Subscription (retensi/MRR) ---
  {
    slug: 'care-plan',
    name: 'Care Plan — Update & Support',
    promise: 'App Anda dirawat: update, monitoring & support selama langganan aktif.',
    tier: 'subscription', subBrandId: 'petung',
    priceIdr: 199000, priceLabel: 'Rp 199.000', billing: 'per-bulan', checkout: 'instant',
    icon: 'fa-heart-pulse',
    outcomes: ['Update & patch berkala', 'Monitoring uptime', 'Prioritas dukungan'],
    engineSkills: ['workflow-ops', 'sovereign-verify-rubric'],
    hitlGate: 'payment', cloudflareNative: true
  },
  {
    slug: 'ai-staff-cs',
    name: 'AI Staff — Customer Service',
    promise: 'Staf CS AI menjawab pelanggan tiap hari — fungsi CS berjalan tanpa rekrut.',
    tier: 'subscription', subBrandId: 'kuratorkas',
    priceIdr: 490000, priceLabel: 'Rp 490.000', billing: 'per-bulan', checkout: 'instant',
    icon: 'fa-headset',
    outcomes: ['CS auto-balas berjalan tiap bulan', 'Log percakapan', 'Eskalasi ke owner (HITL)'],
    engineSkills: ['squad-sales-cs', 'hermes-memory'],
    hitlGate: 'payment', cloudflareNative: true
  },
  {
    slug: 'ai-staff-marketing',
    name: 'AI Staff — Marketing',
    promise: 'Staf marketing AI memproduksi konten & promo tiap minggu — fungsi marketing jalan.',
    tier: 'subscription', subBrandId: 'pacelokal',
    priceIdr: 490000, priceLabel: 'Rp 490.000', billing: 'per-bulan', checkout: 'instant',
    icon: 'fa-rocket',
    outcomes: ['Konten/promo terjadwal', 'Kalender konten dikelola', 'Laporan performa ringkas'],
    engineSkills: ['squad-marketing', 'cmo'],
    hitlGate: 'payment', cloudflareNative: true
  },
  {
    slug: 'ai-staff-admin',
    name: 'AI Staff — Admin & Dokumen',
    promise: 'Staf admin AI merapikan dokumen & laporan otomatis — jam admin dihemat.',
    tier: 'subscription', subBrandId: 'kuratorkas',
    priceIdr: 490000, priceLabel: 'Rp 490.000', billing: 'per-bulan', checkout: 'instant',
    icon: 'fa-file-invoice',
    outcomes: ['Laporan otomatis', 'Dokumen dirapikan', 'Jam admin dihemat (sebelum/sesudah)'],
    engineSkills: ['squad-opsfinance', 'memory-dreaming'],
    hitlGate: 'payment', cloudflareNative: true
  },

  // --- High-ticket (intake -> invoice, HITL) ---
  {
    slug: 'app-custom',
    name: 'Aplikasi Custom (Done-for-You)',
    promise: 'App sesuai spesifikasi Anda, dibangun & ter-deploy di edge Cloudflare.',
    tier: 'high-ticket', subBrandId: 'petung',
    priceIdr: null, priceLabel: 'mulai Rp 5.000.000', billing: 'mulai', checkout: 'intake',
    icon: 'fa-cubes',
    outcomes: ['App sesuai spec & ter-deploy', 'URL live + acceptance checklist', 'Handoff & dokumentasi'],
    engineSkills: ['fullstack-cycle', 'C-Suite', 'squads'],
    hitlGate: 'pricing', cloudflareNative: true
  },
  {
    slug: 'ai-company',
    name: 'AI Company in a Box',
    promise: 'C-Suite + squad AI yang menjalankan fungsi perusahaan Anda secara agentik.',
    tier: 'high-ticket', subBrandId: 'petung',
    priceIdr: null, priceLabel: 'mulai Rp 12.000.000', billing: 'mulai', checkout: 'intake',
    icon: 'fa-building',
    outcomes: ['C-Suite + squad aktif', 'Dashboard peran + output', 'Sistem operasi bisnis berjalan'],
    engineSkills: ['team-boot', 'orchestrator', 'C-Suite', 'squads'],
    hitlGate: 'pricing', cloudflareNative: true
  },
  {
    slug: 'agentshield-audit',
    name: 'Sovereign AgentShield — Audit Keamanan',
    promise: 'Audit agar agent Anda (WhatsApp/email/PDF/MCP) aman dari prompt-injection & lulus audit.',
    tier: 'high-ticket', subBrandId: 'petung',
    priceIdr: null, priceLabel: 'mulai (tunggu pricing)', billing: 'mulai', checkout: 'intake',
    icon: 'fa-shield-halved',
    outcomes: ['Audit prompt-injection surface klien', 'Checklist OWASP MCP Top 10 + lethal-trifecta', 'Laporan + rekomendasi gate HITL'],
    engineSkills: ['sovereign-zero-trust', 'sovereign-verify-rubric'],
    hitlGate: 'pricing', cloudflareNative: true
  },

  // --- Education (top-of-funnel) ---
  {
    slug: 'canon-course',
    name: 'Canon Course — Bangun Bisnis dengan AI',
    promise: 'Kelas praktik: dari masalah bisnis ke app/otomasi yang jalan — konteks Indonesia.',
    tier: 'education', subBrandId: 'petung',
    priceIdr: 349000, priceLabel: 'Rp 349.000', billing: 'one-time', checkout: 'instant',
    icon: 'fa-graduation-cap',
    outcomes: ['Akses materi kanonik', 'Studi kasus lokal', 'Template starter'],
    engineSkills: ['master-boot', 'specialists', 'context-injection'],
    hitlGate: 'payment', cloudflareNative: true
  },

  // --- Developer (DIY / proof) ---
  {
    slug: 'all-access-bundle',
    name: 'All-Access Bundle (36 Skill)',
    promise: 'Akses semua sovereign skill — bahan baku mesin untuk builder & agency.',
    tier: 'developer', subBrandId: 'petung',
    priceIdr: 990000, priceLabel: 'Rp 990.000', billing: 'one-time', checkout: 'instant',
    icon: 'fa-layer-group',
    outcomes: ['Akses 36 skill', 'Update katalog', 'Lisensi pemakaian'],
    engineSkills: ['(seluruh katalog skill)'],
    hitlGate: 'payment', cloudflareNative: true
  },
  {
    slug: 'founder-pass',
    name: 'Founder Pass (Bulanan)',
    promise: 'Langganan akses penuh + komunitas — untuk builder yang bergerak cepat.',
    tier: 'developer', subBrandId: 'petung',
    priceIdr: 149000, priceLabel: 'Rp 149.000', billing: 'per-bulan', checkout: 'instant',
    icon: 'fa-id-badge',
    outcomes: ['Akses semua skill', 'Akses early + komunitas', 'Update prioritas'],
    engineSkills: ['(seluruh katalog skill)'],
    hitlGate: 'payment', cloudflareNative: true
  }
]

export function getOffer(slug: string): Offer | undefined {
  return OFFERS.find((o) => o.slug === slug)
}

export function offersByTier(tier: OfferTier): Offer[] {
  return OFFERS.filter((o) => o.tier === tier)
}
