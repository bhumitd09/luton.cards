import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/lib/cart-context'
import { AdminProvider } from '@/lib/admin-context'
import { AnnouncementBar } from '@/components/announcement-bar'
import { CookieBanner } from '@/components/cookie-banner'
import { Analytics } from '@/components/analytics'
import { PostHogProvider } from '@/components/posthog-provider'
import { EditModeIndicator } from '@/components/editable/edit-mode-indicator'
import { escapeJsonForScriptTag } from '@/lib/html-escape'
import './globals.css'

// Use display:swap so text renders immediately while Inter loads — avoids
// the dreaded font-loading flash and improves LCP.
const inter = Inter({ subsets: ['latin'], display: 'swap' })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lutoncards.com'
const OG_IMAGE = `${APP_URL}/logo/luton-cards.png`

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Luton Cards | Pokémon & One Piece TCG, Luton UK',
    template: '%s | Luton Cards',
  },
  description: 'Pokémon and One Piece trading cards from Luton, UK. Rare singles, PSA & CGC graded slabs, sealed booster boxes. Properly sourced, properly priced.',
  keywords: ['Pokemon cards', 'One Piece TCG', 'PSA graded', 'CGC graded', 'rare singles', 'booster boxes', 'Luton', 'UK', 'TCG'],
  authors: [{ name: 'Luton Cards' }],
  creator: 'Luton Cards',
  publisher: 'Luton Cards',
  openGraph: {
    siteName: 'Luton Cards',
    locale: 'en_GB',
    type: 'website',
    title: 'Luton Cards | Pokémon & One Piece TCG, Luton UK',
    description: 'Rare singles, PSA & CGC graded slabs, sealed booster boxes. Properly sourced, properly priced.',
    url: APP_URL,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Luton Cards' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luton Cards | Pokémon & One Piece TCG, Luton UK',
    description: 'Rare singles, PSA & CGC graded slabs, sealed booster boxes.',
    images: [OG_IMAGE],
  },
  icons: {
    icon: '/logo/luton-cards.png',
    apple: '/logo/luton-cards.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

// Site-wide LocalBusiness schema for Google knowledge panel
const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Luton Cards',
  description: 'Pokémon and One Piece trading cards from Luton, UK.',
  url: APP_URL,
  logo: OG_IMAGE,
  image: OG_IMAGE,
  priceRange: '££',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Luton',
    addressRegion: 'Bedfordshire',
    addressCountry: 'GB',
  },
  sameAs: [
    'https://instagram.com/luton.cards',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJsonForScriptTag(localBusinessJsonLd) }}
        />
        <PostHogProvider>
          <AdminProvider>
            <CartProvider>
              <AnnouncementBar />
              {children}
              <CookieBanner />
              <EditModeIndicator />
            </CartProvider>
          </AdminProvider>
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  )
}
