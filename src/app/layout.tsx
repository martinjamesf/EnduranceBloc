import '../styles/globals.css'
import React from 'react'
import { Navigation } from '@/components'

export const metadata = {
  title: 'EnduranceBloc',
  description: 'Smart calendar for endurance athletes'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-[#032033] via-[#0b142c] to-[#130f1d]">
        <Navigation />
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}