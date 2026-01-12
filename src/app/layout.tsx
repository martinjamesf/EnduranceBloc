import '../styles/globals.css'
import React from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Navigation } from '@/components'

export const metadata = {
  title: 'EnduranceBloc',
  description: 'Smart calendar for endurance athletes'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID

  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-[#032033] via-[#0b142c] to-[#130f1d]">
        <Navigation />
        <main>
          {children}
        </main>
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  )
}
