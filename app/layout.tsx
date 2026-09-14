import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CSV Lens — In-Browser Data Table Viewer & Profiler',
  description:
    'Instant, 100% private in-browser CSV and tabular data viewer with search, multi-column sorting, type inference, and statistical profiling.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full bg-slate-50 text-slate-900 antialiased selection:bg-teal-500/20 selection:text-teal-900`}>
        {children}
      </body>
    </html>
  )
}
