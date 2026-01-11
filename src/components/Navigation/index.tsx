import Link from 'next/link'
import { Logo } from '../Logo/Logo'

export default function Navigation() {
  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="flex items-center gap-3">
        <Logo className="h-6" />
        <span className="text-lg font-semibold text-white">EnduranceBloc</span>
        <span className="hidden text-xs uppercase tracking-[0.25em] text-white/60 md:inline">Plan smarter every week</span>
      </div>
      <div className="flex items-center gap-3 text-sm font-semibold">
        <Link href="/calendar?view=week" className="hidden px-3 py-2 text-white/80 hover:text-white md:inline-flex">Product</Link>
        <Link href="/sunday-prep" className="hidden px-3 py-2 text-white/80 hover:text-white md:inline-flex">Sunday Prep</Link>
        <Link href="/login" className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition">Log in</Link>
        <Link href="/signup" className="px-4 py-2 rounded-lg bg-[#FF7A00] text-white hover:opacity-90 transition">Start free</Link>
      </div>
    </nav>
  )
}