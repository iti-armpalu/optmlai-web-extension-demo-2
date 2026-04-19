import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { OptmlProvider } from '@/components/core/optml-provider'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Optml Dev',
  description: 'Optml creative testing environment',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {/* Optml overlay — lives outside page content so it works on any route */}
        <OptmlProvider />
      </body>
    </html>
  )
}