import { Header } from '../components/header'
import { Hero } from '../components/hero'
import { MarqueeStrip } from '../components/marquee-strip'
import { FeaturedProducts } from '../components/featured-products'
import { BuiltByBanner } from '../components/built-by-banner'
import { EthosStrip } from '../components/ethos-strip'
import { YouTubeSection } from '../components/youtube-section'
import { Footer } from '../components/footer'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', overflowX: 'hidden' }}>
      <Header />
      <main>
        <MarqueeStrip />
        <Hero />
        <MarqueeStrip />
        <FeaturedProducts />
        <BuiltByBanner />
        <EthosStrip />
        <YouTubeSection />
      </main>
      <Footer />
    </div>
  )
}
