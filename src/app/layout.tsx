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
      <body className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <Navigation />
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}