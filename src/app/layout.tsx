import '../styles/globals.css'
import React from 'react'

export const metadata = {
  title: 'EnduranceBloc',
  description: 'Smart calendar for endurance athletes'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
