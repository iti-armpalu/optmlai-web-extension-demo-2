export default function Page() {
  return (
    <main className="min-h-screen bg-neutral-100 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">

        {/* Page label */}
        <div>
          <h1 className="text-sm font-medium text-neutral-400 uppercase tracking-widest">
            Optml — Test Canvas
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Use the Optml button (bottom-right) to capture any of these creatives.
          </p>
        </div>

        {/* Ad creatives grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Creative 1 — Hero banner (dark) */}
          <div className="col-span-2 relative overflow-hidden rounded-2xl bg-neutral-900 aspect-[3/1] flex items-center px-12 gap-10 shadow-xl">
            {/* BG gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Text content */}
            <div className="relative z-10 flex-1 space-y-3">
              <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-400 bg-violet-400/10 px-2.5 py-1 rounded-full">
                New collection
              </span>
              <h2 className="text-3xl font-bold text-white leading-tight">
                Wear the future.<br />
                <span className="text-violet-400">Feel the difference.</span>
              </h2>
              <p className="text-sm text-neutral-400 max-w-xs">
                Performance apparel engineered for athletes who refuse to compromise.
              </p>
              <button className="mt-2 inline-flex items-center gap-2 bg-white text-neutral-900 text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-neutral-100 transition-colors">
                Shop now
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Visual block */}
            <div className="relative z-10 flex-shrink-0 w-48 h-32 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/40">
              <span className="text-white/30 text-5xl font-black tracking-tighter">AX</span>
            </div>
          </div>

          {/* Creative 2 — Product card (light) */}
          <div className="relative overflow-hidden rounded-2xl bg-white aspect-square flex flex-col shadow-lg border border-neutral-100">
            {/* Product image area */}
            <div className="flex-1 bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
              <div className="w-28 h-28 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center">
                <span className="text-white text-3xl font-black">☀</span>
              </div>
            </div>

            {/* Product info */}
            <div className="p-5 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-neutral-400 font-medium">LUMIÈRE PARIS</p>
                  <h3 className="text-base font-bold text-neutral-900 mt-0.5">
                    Vitamin C Serum
                  </h3>
                </div>
                <span className="text-lg font-bold text-neutral-900">$48</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3 h-3 fill-amber-400 text-amber-400" viewBox="0 0 16 16">
                    <path d="M8 1l1.8 3.6L14 5.4l-3 2.9.7 4.1L8 10.4l-3.7 2 .7-4.1L2 5.4l4.2-.8z" />
                  </svg>
                ))}
                <span className="text-xs text-neutral-400 ml-1">4.9 (2.1k)</span>
              </div>
              <button className="w-full bg-neutral-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-neutral-700 transition-colors">
                Add to cart
              </button>
            </div>
          </div>

          {/* Creative 3 — Social ad (lifestyle) */}
          <div className="relative overflow-hidden rounded-2xl aspect-square shadow-lg">
            {/* BG */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.15),transparent)]" />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between p-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-white text-xs font-bold">W</span>
                </div>
                <span className="text-white/90 text-xs font-medium">@wavebrand</span>
              </div>

              <div className="space-y-3">
                <p className="text-white text-2xl font-bold leading-snug">
                  Life's too short<br />for bad coffee.
                </p>
                <p className="text-white/70 text-sm">
                  Premium blends, delivered fresh to your door every week.
                </p>
                <div className="flex items-center gap-2">
                  <button className="bg-white text-teal-700 text-xs font-bold px-4 py-2 rounded-full">
                    Start free trial
                  </button>
                  <button className="text-white/80 text-xs font-medium px-3 py-2">
                    Learn more →
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}