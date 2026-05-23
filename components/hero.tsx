'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Particles } from '@/components/magicui/particles'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text'

export function Hero() {
  const [headline, setHeadline] = useState('Pokémon.\nOne Piece.\nProperly sourced.')
  const [subtext, setSubtext] = useState('Singles, graded slabs and sealed product from Luton, UK.\nProperly checked, properly priced.')
  const [ctaText, setCtaText] = useState('Shop Pokémon')
  const [ctaLink, setCtaLink] = useState('/products?game=pokemon')
  const [secondaryCtaText, setSecondaryCtaText] = useState('Shop One Piece')
  const [secondaryCtaLink, setSecondaryCtaLink] = useState('/products?game=one-piece')

  useEffect(() => {
    fetch('/api/content?keys=hero_headline,hero_subtext,hero_cta_text,hero_cta_link,hero_cta2_text,hero_cta2_link')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) return
        if (data.hero_headline) setHeadline(data.hero_headline)
        if (data.hero_subtext) setSubtext(data.hero_subtext)
        if (data.hero_cta_text) setCtaText(data.hero_cta_text)
        if (data.hero_cta_link) setCtaLink(data.hero_cta_link)
        if (data.hero_cta2_text) setSecondaryCtaText(data.hero_cta2_text)
        if (data.hero_cta2_link) setSecondaryCtaLink(data.hero_cta2_link)
      })
      .catch(() => {})
  }, [])

  const headlineParts = headline.split('\n')

  return (
    <section className="relative overflow-hidden bg-[#070708]">
      {/* radial brand glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(80% 60% at 50% 0%, rgba(236,30,121,0.20) 0%, rgba(236,30,121,0.05) 35%, transparent 70%)',
        }}
      />
      {/* subtle dotted grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* particles */}
      <Particles
        className="absolute inset-0"
        quantity={70}
        ease={70}
        color="#EC1E79"
        staticity={40}
        size={0.6}
      />

      <div className="relative z-10 mx-auto flex max-w-[900px] flex-col items-center px-6 py-24 text-center sm:py-28 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-7"
        >
          <AnimatedGradientText className="!bg-white/[0.04] !text-white">
            <Sparkles className="mr-1.5 size-3.5 text-[#EC1E79]" />
            <span className="inline animate-gradient bg-gradient-to-r from-[#EC1E79] via-[#FF80B8] to-[#EC1E79] bg-[length:var(--bg-size)_100%] bg-clip-text text-xs font-bold uppercase tracking-[0.14em] text-transparent">
              Luton, UK · Pokémon &amp; One Piece TCG
            </span>
          </AnimatedGradientText>
        </motion.div>

        <motion.img
          src="/logo/luton-cards.png"
          alt="Luton Cards"
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 h-[160px] w-auto drop-shadow-[0_18px_40px_rgba(236,30,121,0.35)] sm:h-[180px] md:h-[200px]"
        />

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="m-0 text-[clamp(2.5rem,6vw,4.25rem)] font-black leading-[1.02] tracking-[-0.045em] text-white"
        >
          {headlineParts.map((part, i) => (
            <span key={i} className="block">
              {i === 1 ? (
                <span className="bg-gradient-to-br from-[#EC1E79] via-[#FF4DA6] to-[#EC1E79] bg-clip-text text-transparent">
                  {part}
                </span>
              ) : (
                part
              )}
            </span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mb-9 mt-5 max-w-[520px] text-[0.95rem] leading-[1.65] text-white/55 sm:text-base"
        >
          {subtext.split('\n').map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex w-full flex-col items-center justify-center gap-2.5 sm:w-auto sm:flex-row"
        >
          <Link href={ctaLink} className="w-full sm:w-auto">
            <ShimmerButton
              className="w-full px-7 py-3.5 text-sm sm:w-auto"
              background="linear-gradient(135deg, #EC1E79 0%, #FF4DA6 100%)"
            >
              <span className="flex items-center gap-1.5">
                {ctaText} <ArrowRight size={15} />
              </span>
            </ShimmerButton>
          </Link>
          <Link href={secondaryCtaLink} className="w-full sm:w-auto">
            <button
              className="group relative flex w-full items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:border-[#EC1E79]/50 hover:bg-white/[0.08] sm:w-auto"
            >
              {secondaryCtaText}
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </Link>
        </motion.div>

        {/* trust row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/35"
        >
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#EC1E79]" />
            PSA · CGC · ACE
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#EC1E79]" />
            Free UK shipping
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#EC1E79]" />
            Same day dispatch
          </span>
        </motion.div>
      </div>
    </section>
  )
}
