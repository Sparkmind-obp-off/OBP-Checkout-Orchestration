import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, title }) => {
  return (
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="SparkMind X · Outcome Foundry — pabrik hasil bisnis untuk UMKM Indonesia. Pembayaran via Oasis BI Pro (Merchant-of-Record) di rel Duitku." />
        <title>{title || 'SparkMind X · Outcome Foundry'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link
          href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css"
          rel="stylesheet"
        />
        <link href="/static/style.css" rel="stylesheet" />
      </head>
      <body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
        <header class="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
          <nav class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between" aria-label="Navigasi utama">
            <a href="/" class="flex items-center gap-2 font-bold tracking-tight">
              <i class="fas fa-bolt text-amber-400"></i>
              <span>SparkMind&nbsp;X</span>
              <span class="hidden sm:inline text-[11px] font-medium text-slate-500 border-l border-slate-700 pl-2 ml-1">Outcome Foundry</span>
            </a>
            <div class="flex items-center gap-1 text-sm">
              <a href="/foundry" class="px-3 py-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-900 transition">Katalog</a>
              <a href="/checkout" class="px-3 py-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-900 transition">Checkout</a>
              <a href="/admin" class="px-3 py-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-900 transition">Admin</a>
            </div>
          </nav>
        </header>
        <div class="flex-1">{children}</div>
        <footer class="border-t border-slate-800/80 mt-12">
          <div class="max-w-6xl mx-auto px-4 py-6 text-xs text-slate-500 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <p>
              <strong class="text-slate-400">SparkMind X · Outcome Foundry</strong> — pabrik hasil bisnis untuk UMKM Indonesia.
            </p>
            <p>
              Pembayaran oleh <strong class="text-slate-400">Oasis BI Pro</strong> (Merchant-of-Record) · rel PJP <strong class="text-slate-400">Duitku</strong> terdaftar Bank Indonesia.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
})
