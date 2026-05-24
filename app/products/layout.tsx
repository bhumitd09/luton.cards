import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop Pokémon & One Piece Cards',
  description:
    'Browse Pokémon and One Piece trading cards from Luton, UK. Singles, PSA / CGC / ACE graded slabs, sealed booster boxes. Updated daily.',
  openGraph: {
    title: 'Shop Pokémon & One Piece Cards — Luton Cards',
    description: 'Singles, graded slabs, sealed product. Properly sourced.',
    type: 'website',
    siteName: 'Luton Cards',
  },
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
