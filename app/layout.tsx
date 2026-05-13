import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/lib/cart-context'
import { AnnouncementBar } from '@/components/announcement-bar'
import { CookieBanner } from '@/components/cookie-banner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://lutoncards.com'),
  title: {
    default: 'Luton Cards — Pokémon & One Piece TCG, Luton UK',
    template: '%s | Luton Cards',
  },
  description: 'Pokémon and One Piece trading cards from Luton, UK. Rare singles, PSA & CGC graded slabs, sealed booster boxes. Properly sourced, properly priced.',
  keywords: ['Pokemon cards', 'One Piece TCG', 'PSA graded', 'CGC graded', 'rare singles', 'booster boxes', 'Luton', 'UK', 'TCG'],
  openGraph: {
    siteName: 'Luton Cards',
    locale: 'en_GB',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <AnnouncementBar />
          {children}
          <CookieBanner />
        </CartProvider>
      </body>
    </html>
  )
}
