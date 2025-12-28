import '../styles/globals.css'
import React from 'react'
import HomePage from './page'

export const metadata = {
  title: 'EnduranceBloc',
  description: 'Smart calendar for endurance athletes'
}

const Layout = () => {
    return (
        <div>
            <header>
                <h1>EnduranceBloc</h1>
            </header>
            <main>
                <HomePage />
            </main>
            <footer>
                <p>© 2025 EnduranceBloc. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  )
}