// Admin dashboard (read-only). Data di-load via /api/stats + tabel terkait.
export function AdminDashboard() {
  return (
    <main class="max-w-6xl mx-auto px-4 py-10">
      <header class="mb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold mb-3">
          <i class="fas fa-gauge-high"></i> Read-only · Observability
        </div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Foundry Admin</h1>
        <p class="text-slate-400 mt-1 text-sm">Pantau invoice, callback Duitku, dan fan-out ke sub-brand. Hanya baca — aman.</p>
      </header>

      {/* Stat cards */}
      <section id="stat-cards" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {['Total Invoice', 'Lunas (paid)', 'Pending', 'Omzet Lunas (IDR)'].map((label, i) => (
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div class="text-xs text-slate-500">{label}</div>
            <div id={`stat-${i}`} class="text-2xl font-bold mt-1 text-amber-300">—</div>
          </div>
        ))}
      </section>

      <div class="grid lg:grid-cols-2 gap-6">
        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 class="font-semibold mb-3"><i class="fas fa-file-invoice text-amber-400 mr-2"></i>Invoice Terbaru</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="text-slate-500 text-left border-b border-slate-800">
                <tr><th class="py-2 pr-2">Order</th><th class="pr-2">Brand</th><th class="pr-2">IDR</th><th class="pr-2">Status</th></tr>
              </thead>
              <tbody id="tbody-invoices" class="text-slate-300"><tr><td colspan={4} class="py-3 text-slate-500">Memuat…</td></tr></tbody>
            </table>
          </div>
        </section>

        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 class="font-semibold mb-3"><i class="fas fa-bell text-amber-400 mr-2"></i>Callback Duitku</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="text-slate-500 text-left border-b border-slate-800">
                <tr><th class="py-2 pr-2">Order</th><th class="pr-2">Code</th><th class="pr-2">Sig</th><th class="pr-2">Waktu</th></tr>
              </thead>
              <tbody id="tbody-callbacks" class="text-slate-300"><tr><td colspan={4} class="py-3 text-slate-500">Memuat…</td></tr></tbody>
            </table>
          </div>
        </section>

        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:col-span-2">
          <h2 class="font-semibold mb-3"><i class="fas fa-diagram-project text-amber-400 mr-2"></i>Fan-out Log (OBP → Sub-brand)</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="text-slate-500 text-left border-b border-slate-800">
                <tr><th class="py-2 pr-2">Sub-brand</th><th class="pr-2">Event</th><th class="pr-2">Target</th><th class="pr-2">HTTP</th><th class="pr-2">Delivered</th><th class="pr-2">Waktu</th></tr>
              </thead>
              <tbody id="tbody-fanout" class="text-slate-300"><tr><td colspan={6} class="py-3 text-slate-500">Memuat…</td></tr></tbody>
            </table>
          </div>
        </section>
      </div>

      <script src="/static/admin.js"></script>
    </main>
  )
}
