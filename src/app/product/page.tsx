'use client'

import Link from 'next/link'

export default function Product() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-slate-100">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#00C2A833,transparent_45%),radial-gradient(circle_at_bottom_right,#FF7A0033,transparent_40%)]" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm uppercase tracking-[0.2em] text-slate-300">
              <span>EnduranceBloc</span>
              <span className="text-white/50">•</span>
              <span className="text-[#FF7A00]">Product</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-white">
              Plan your life and training in one honest weekly view.
            </h1>
            <p className="text-lg md:text-xl text-slate-200 max-w-2xl">
              Work meetings, family time, and workouts—together at last. Slot sessions into real windows, avoid conflicts, and start every week with a plan you can actually follow.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/signup" className="px-6 py-3 rounded-lg bg-[#FF7A00] text-white font-semibold hover:opacity-90 transition">
                Start free
              </Link>
              <Link href="/sunday-prep" className="px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10 transition">
                Explore Sunday Prep
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Teaser sections */}
      <section className="bg-white text-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-18">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: 'Life-first calendar',
                desc: 'See work, family, and training together. Drag workouts into open time without conflicts.'
              },
              {
                title: 'Sunday Prep ritual',
                desc: 'A 15-minute guided flow to lock your week before Monday hits.'
              },
              {
                title: 'Smart suggestions',
                desc: 'AI proposes best-fit times based on your calendar and recovery.'
              }
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-slate-700 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
