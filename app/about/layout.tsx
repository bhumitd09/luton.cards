import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Luton Cards — The team behind the cards',
  description:
    'Luton Cards is a UK-based Pokémon and One Piece TCG shop. Meet the team of specialists, learn how we source, grade and pack every card.',
  openGraph: {
    title: 'About Luton Cards',
    description: 'A UK card shop run by people who actually collect.',
    type: 'website',
    siteName: 'Luton Cards',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
