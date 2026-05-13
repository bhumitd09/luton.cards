'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Instagram, Youtube, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'

function DiscordIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  )
}

const CONTENT_KEYS = ['footer_tagline', 'social_instagram', 'social_youtube', 'social_twitter', 'social_facebook']

const DEFAULTS: Record<string, string> = {
  footer_tagline: 'Pokemon cards for collectors. Cardboard enjoyers welcome.',
  social_instagram: 'https://instagram.com/lutoncardstcg',
  social_youtube: 'https://www.youtube.com/@LutonCardsTCG',
  social_twitter: '',
  social_facebook: '',
}

function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email.trim()) setSubmitted(true)
  }

  return (
    <div style={{ background: '#EC1E79', padding: '1.75rem 1.5rem' }}>
      <style>{`
        .newsletter-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 2rem; flex-wrap: wrap; }
        @media (max-width: 600px) {
          .newsletter-inner { flex-direction: column; align-items: stretch; padding: 0; }
          .newsletter-form { width: 100%; }
          .newsletter-form input { width: 100% !important; box-sizing: border-box !important; }
          .newsletter-form button { width: 100% !important; justify-content: center !important; }
        }
      `}</style>
      <div className="newsletter-inner">
        <div>
          <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', margin: '0 0 0.2rem' }}>
            Stay in the loop
          </p>
          <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#000', letterSpacing: '-0.02em', margin: 0 }}>
            First to know. First to cop.
          </p>
        </div>
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: '#000', color: '#EC1E79', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem' }}
          >
            You&apos;re in. Stay tuned.
          </motion.div>
        ) : (
          <form className="newsletter-form" onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '7px',
                border: '2px solid rgba(0,0,0,0.15)',
                background: 'rgba(255,255,255,0.7)',
                fontSize: '0.875rem',
                color: '#000',
                outline: 'none',
                fontFamily: 'inherit',
                width: '220px',
              }}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: '#000',
                color: '#EC1E79',
                border: 'none',
                padding: '0.65rem 1rem',
                borderRadius: '7px',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
            >
              Subscribe <ArrowRight size={13} />
            </motion.button>
          </form>
        )}
      </div>
    </div>
  )
}

function CollectTCGAttribution() {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href="https://collecttcg.co.uk"
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        textDecoration: 'none',
        opacity: hovered ? 0.7 : 0.35,
        transition: 'opacity 0.2s ease',
      }}
    >
      <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 400 }}>Built by</span>
      <img
        src="https://collecttcg.co.uk/logo/CollectTCG.png"
        alt="Collect TCG"
        style={{ height: '18px', width: 'auto', filter: 'brightness(0) invert(1)' }}
      />
    </a>
  )
}

export function Footer() {
  const [content, setContent] = useState<Record<string, string>>(DEFAULTS)

  useEffect(() => {
    fetch(`/api/content?keys=${CONTENT_KEYS.join(',')}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        setContent(prev => {
          const merged = { ...prev }
          CONTENT_KEYS.forEach(k => {
            if (data[k] !== undefined && data[k] !== '') merged[k] = data[k]
          })
          return merged
        })
      })
      .catch(() => {})
  }, [])

  const get = (key: string) => content[key] || DEFAULTS[key] || ''

  const socials = [
    ...(get('social_instagram') ? [{ icon: Instagram, label: 'Instagram', href: get('social_instagram') }] : []),
    ...(get('social_youtube') ? [{ icon: Youtube, label: 'YouTube', href: get('social_youtube') }] : []),
  ]

  return (
    <>
      <NewsletterSection />
      <footer style={{ background: '#0d0d0d', color: '#fff' }}>
        <style>{`
          .f-wrap {
            max-width: 1100px;
            margin: 0 auto;
            padding: 3rem 1.5rem 2.5rem;
            display: grid;
            grid-template-columns: 220px 1fr 1fr 1fr;
            gap: 3rem;
            align-items: start;
          }
          .f-col-head {
            font-size: 0.65rem;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #EC1E79;
            margin: 0 0 1.1rem;
          }
          .f-col-links {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 0.7rem;
          }
          .f-col-links a {
            color: rgba(255,255,255,0.4);
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
            transition: color 0.15s;
          }
          .f-col-links a:hover { color: #fff; }
          .f-bar {
            max-width: 1100px;
            margin: 0 auto;
            padding: 1rem 1.5rem;
            border-top: 1px solid rgba(255,255,255,0.07);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            flex-wrap: wrap;
          }
          @media (max-width: 860px) {
            .f-wrap { grid-template-columns: 1fr 1fr; }
          }
          @media (max-width: 480px) {
            .f-wrap { grid-template-columns: 1fr; gap: 2rem; padding: 2rem 1.25rem; }
            .f-bar { justify-content: center; text-align: center; flex-direction: column; align-items: center; }
            .f-logo-img { height: 80px !important; }
          }
        `}</style>

        <div className="f-wrap">
          {/* Brand col */}
          <div>
            <img
              src="/logo/luton-cards.png"
              alt="Luton Cards"
              className="f-logo-img"
              style={{ height: '120px', width: 'auto', display: 'block', marginBottom: '1.25rem' }}
            />
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
              {get('footer_tagline') || 'Pokemon cards for collectors. Cardboard enjoyers welcome.'}
            </p>
            {socials.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {socials.map(({ icon: Icon, label, href }) => (
                  <motion.a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, background: '#EC1E79', color: '#000' }}
                    whileTap={{ scale: 0.92 }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '36px', height: '36px',
                      background: '#1c1c1c',
                      borderRadius: '8px',
                      color: 'rgba(255,255,255,0.4)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <Icon size={16} />
                  </motion.a>
                ))}
              </div>
            )}
          </div>

          {/* Shop */}
          <div>
            <p className="f-col-head">Shop</p>
            <ul className="f-col-links">
              <li><Link href="/products">Single Cards</Link></li>
              <li><Link href="/products?category=graded">Graded Cards</Link></li>
              <li><Link href="/products?category=booster">Booster Boxes</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <p className="f-col-head">Help</p>
            <ul className="f-col-links">
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="f-col-head">Legal</p>
            <ul className="f-col-links">
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms &amp; Conditions</Link></li>
              <li><Link href="/cookies">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="f-bar">
          <span style={{ fontSize: '0.775rem', color: 'rgba(255,255,255,0.2)' }}>
            © {new Date().getFullYear()} Luton Cards. All rights reserved.
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
            >Privacy</Link>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem' }}>·</span>
            <Link href="/terms" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
            >Terms</Link>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem' }}>·</span>
            <Link href="/cookies" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
            >Cookies</Link>
          </div>
          <CollectTCGAttribution />
        </div>
      </footer>
    </>
  )
}
