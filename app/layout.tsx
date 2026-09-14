import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = {
  title: 'CSV Lens — CSV Viewer & Analyzer',
  description: 'View, search, sort, and analyze CSV files directly in your browser. No data leaves your device.',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className={`${inter.className} antialiased`}>{children}</body></html>)
}
