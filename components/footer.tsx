'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Instagram, Youtube, ArrowRight, Sparkles, Check, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'
import { EditableText } from '@/components/editable/editable-text'
import { Particles } from '@/components/magicui/particles'

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
  const [focused, setFocused] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email.trim()) setSubmitted(true)
  }

  return (
    <section
      className="relative overflow-hidden bg-[#070708]"
      style={{ borderTop: '1px solid #1a1a1c' }}
    >
      {/* Particles + mesh gradient backdrop — same language as the hero so
          this section reads as a deliberate part of the page, not a card
          sitting in a void. */}
      <Particles
        className="absolute inset-0"
        quantity={45}
        ease={70}
        color="#EC1E79"
        size={0.5}
        staticity={55}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(60% 55% at 50% 0%, rgba(236,30,121,0.18) 0%, transparent 60%),
            radial-gradient(45% 50% at 12% 100%, rgba(255,77,166,0.12) 0%, transparent 65%),
            radial-gradient(50% 55% at 88% 100%, rgba(126,18,71,0.22) 0%, transparent 70%)
          `,
        }}
      />
      {/* Soft animated aurora bar across the middle, matches the hero */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-[40%] -translate-y-1/2 blur-3xl"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(236,30,121,0.16) 35%, rgba(255,77,166,0.18) 50%, rgba(236,30,121,0.16) 65%, transparent 100%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[760px] px-6 py-16 text-center sm:py-20">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4 }}
          className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[#EC1E79]/30 bg-[#EC1E79]/[0.08] px-3 py-1"
        >
          <Sparkles className="size-3 text-[#EC1E79]" />
          <span className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#FF80B8]">
            Join the list
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="m-0 text-[clamp(1.8rem,4vw,2.6rem)] font-black leading-[1.05] tracking-[-0.035em] text-white"
        >
          New drops.{' '}
          <span className="bg-gradient-to-br from-[#EC1E79] via-[#FF4DA6] to-[#EC1E79] bg-clip-text text-transparent">
            Restocks.
          </span>{' '}
          Early access.
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="m-0 mx-auto mt-4 max-w-[460px] text-[0.95rem] leading-[1.65] text-white/55"
        >
          One email when something good lands. No spam, no noise. Unsubscribe whenever you like.
        </motion.p>

        {/* Form / success */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.22 }}
          className="mt-8"
        >
          {submitted ? (
            <div
              className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#10b981]/30 bg-[#10b981]/[0.1] px-5 py-2.5 text-[0.875rem] font-bold text-[#10b981]"
            >
              <Check size={15} /> You&apos;re in. Look out for the next drop.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="newsletter-form mx-auto flex max-w-[460px] flex-col gap-2 sm:flex-row"
            >
              {/* Pill input with leading mail icon + focus-glow ring */}
              <div
                className="newsletter-input-wrap relative flex flex-1 items-center"
                style={{
                  background: focused ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.035)',
                  border: `1px solid ${focused ? 'rgba(236,30,121,0.55)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 12,
                  transition: 'border-color 0.15s, background 0.15s, box-shadow 0.2s',
                  boxShadow: focused ? '0 0 0 4px rgba(236,30,121,0.12)' : 'none',
                }}
              >
                <Mail
                  size={15}
                  className="pointer-events-none absolute left-3 text-white/40"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="your@email.com"
                  className="newsletter-input"
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem 0.75rem 2.25rem',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '0.9rem',
                    color: '#fff',
                    outline: 'none',
                    fontFamily: 'inherit',
                    minWidth: 0,
                  }}
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: 'linear-gradient(135deg, #EC1E79 0%, #FF4DA6 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.8rem 1.4rem',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                  boxShadow: '0 10px 26px -10px rgba(236,30,121,0.7)',
                }}
              >
                Subscribe <ArrowRight size={14} />
              </motion.button>
            </form>
          )}
        </motion.div>

        {/* Trust row — keeps the section grounded with the same micro-copy
            language as the hero's trust row. */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.32 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30"
        >
          <span className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-[#EC1E79]" />
            No spam ever
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-[#EC1E79]" />
            ~2 emails a month
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-[#EC1E79]" />
            One-click unsubscribe
          </span>
        </motion.div>
      </div>
    </section>
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
            <EditableText
              cmsKey="footer_tagline"
              label="Footer tagline"
              value={get('footer_tagline')}
              fallback="Pokemon cards for collectors. Cardboard enjoyers welcome."
              multiline
              maxLength={200}
            >
              {(val) => (
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
                  {val}
                </p>
              )}
            </EditableText>
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
