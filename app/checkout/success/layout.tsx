import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order confirmed',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
