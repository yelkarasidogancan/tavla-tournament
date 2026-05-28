import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tavla Turnuvası',
  description: 'Canlı tavla turnuvası takip sistemi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
