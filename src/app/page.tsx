import '../styles/globals.css'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">EnduranceBloc</h1>
      <p className="mt-4">
        A smart calendar for endurance athletes — weekly view, Sunday prep, calendar sync and AI suggestions.
      </p>
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">Welcome to EnduranceBloc</h2>
        <p>Your journey to better endurance planning starts here!</p>
        <div className="flex gap-4 mt-6">
          <Link
            href="/week"
            className="bg-[#0c41ff] text-white px-4 py-2 rounded font-medium hover:bg-[#0a35ff]"
          >
            Go to Week View
          </Link>
          <Link
            href="/day"
            className="bg-[#00c2a8] text-white px-4 py-2 rounded font-medium hover:bg-[#00a887]"
          >
            Go to Day View
          </Link>
        </div>
      </div>
    </main>
  )
}