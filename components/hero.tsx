'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'


export function Hero() {
  const [headline, setHeadline] = useState('Pokémon.\nOne Piece.\nProperly sourced.')
  const [subtext, setSubtext] = useState('Singles, graded slabs and sealed product from Luton, UK.\nProperly checked, properly priced.')
  const [ctaText, setCtaText] = useState('Shop Pokémon')
  const [ctaLink, setCtaLink] = useState('/products?game=pokemon')
  const [secondaryCtaText, setSecondaryCtaText] = useState('Shop One Piece')
  const [secondaryCtaLink, setSecondaryCtaLink] = useState('/products?game=one-piece')

  useEffect(() => {
    fetch('/api/content?keys=hero_headline,hero_subtext,hero_cta_text,hero_cta_link,hero_cta2_text,hero_cta2_link')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return
        if (data.hero_headline) setHeadline(data.hero_headline)
        if (data.hero_subtext) setSubtext(data.hero_subtext)
        if (data.hero_cta_text) setCtaText(data.hero_cta_text)
        if (data.hero_cta_link) setCtaLink(data.hero_cta_link)
        if (data.hero_cta2_text) setSecondaryCtaText(data.hero_cta2_text)
        if (data.hero_cta2_link) setSecondaryCtaLink(data.hero_cta2_link)
      })
      .catch(() => { /* keep defaults on error */ })
  }, [])

  const headlineParts = headline.split('\n')

  return (
    <section style={{ background: '#0a0a0a', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        .hero-wrap {
          position: relative;
          min-height: 560px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4.5rem 2rem;
          z-index: 1;
        }
        .hero-glow-tl {
          position: absolute;
          top: -180px; left: -180px;
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(236,30,121,0.35) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }
        .hero-glow-br {
          position: absolute;
          bottom: -180px; right: -180px;
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(236,30,121,0.22) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }
        .hero-content { position: relative; z-index: 2; text-align: center; max-width: 800px; }
        .hero-logo { height: 180px; width: auto; margin: 0 auto 2rem; display: block; filter: drop-shadow(0 12px 32px rgba(236,30,121,0.3)); }
        @media (max-width: 768px) {
          .hero-wrap { min-height: auto; padding: 3.5rem 1.25rem !important; }
          .hero-logo { height: 130px !important; margin-bottom: 1.5rem !important; }
          .hero-headline { font-size: clamp(2.25rem, 8vw, 3.25rem) !important; }
          .hero-subtext { font-size: 0.95rem !important; }
          .hero-buttons { flex-direction: column !important; align-items: stretch !important; width: 100%; max-width: 320px; margin: 0 auto; }
          .hero-btn { width: 100% !important; justify-content: center !important; }
        }
      `}</style>

      <div className="hero-glow-tl" />
      <div className="hero-glow-br" />

      <div className="hero-wrap">
        <div className="hero-content">
          <motion.img
            src="/logo/luton-cards.png"
            alt="Luton Cards"
            className="hero-logo"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.h1
            className="hero-headline"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              fontSize: 'clamp(2.25rem, 4.5vw, 3.75rem)',
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              color: '#fff',
              margin: '0 0 1.25rem',
            }}
          >
            {headlineParts.map((part, i) => (
              <span key={i}>
                {i === 1 ? <span style={{ color: '#EC1E79' }}>{part}</span> : part}
                {i < headlineParts.length - 1 && <br />}
              </span>
            ))}
          </motion.h1>
          <motion.p
            className="hero-subtext"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.65,
              margin: '0 auto 2rem',
              maxWidth: '520px',
            }}
          >
            {subtext.split('\n').map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
          </motion.p>
          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link href={ctaLink} style={{ textDecoration: 'none' }} className="hero-btn">
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  background: '#EC1E79',
                  color: '#fff',
                  padding: '0.85rem 1.6rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  boxShadow: '0 8px 24px -8px rgba(236,30,121,0.6)',
                }}
              >
                {ctaText} <ArrowRight size={15} />
              </motion.div>
            </Link>
            <Link href={secondaryCtaLink} style={{ textDecoration: 'none' }} className="hero-btn">
              <motion.div
                whileHover={{ borderColor: 'rgba(236,30,121,0.6)', y: -2 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  background: 'transparent',
                  color: '#fff',
                  padding: '0.85rem 1.6rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  border: '1.5px solid rgba(255,255,255,0.18)',
                }}
              >
                {secondaryCtaText} <ArrowRight size={15} />
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
