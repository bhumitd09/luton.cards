import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sell your cards to Luton Cards',
  description:
    'Got Pokémon or One Piece cards to sell? Fast, fair offers on singles, sealed product and graded slabs. Submit your collection in under 2 minutes.',
  openGraph: {
    title: 'Sell to Luton Cards | Fair UK Offers',
    description: 'Pokémon, One Piece, sealed product, graded slabs. We buy.',
    type: 'website',
    siteName: 'Luton Cards',
  },
}

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
