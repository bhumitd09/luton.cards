'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Particles } from '@/components/magicui/particles'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text'
import { EditableText } from '@/components/editable/editable-text'

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
      {/* Mesh gradient backdrop — three soft pink blobs blending against the dark base */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(70% 50% at 20% 10%, rgba(236,30,121,0.18) 0%, transparent 60%),
            radial-gradient(50% 40% at 80% 0%, rgba(255,77,166,0.14) 0%, transparent 65%),
            radial-gradient(65% 60% at 50% 100%, rgba(126,18,71,0.30) 0%, transparent 70%)
          `,
        }}
      />

      {/* Soft animated aurora bar across the middle */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-[40%] -translate-y-1/2 blur-3xl"
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(236,30,121,0.18) 35%, rgba(255,77,166,0.20) 50%, rgba(236,30,121,0.18) 65%, transparent 100%)',
        }}
      />

      {/* Top + bottom vignettes for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
      />

      {/* Particles (lighter density, smaller) */}
      <Particles
        className="absolute inset-0"
        quantity={45}
        ease={70}
        color="#EC1E79"
        staticity={50}
        size={0.5}
      />

      <div className="relative z-10 mx-auto flex max-w-[820px] flex-col items-center px-6 py-12 text-center sm:py-14 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-5"
        >
          <AnimatedGradientText className="!bg-white/[0.04] !text-white">
            <Sparkles className="mr-1.5 size-3 text-[#EC1E79]" />
            <span className="inline animate-gradient bg-gradient-to-r from-[#EC1E79] via-[#FF80B8] to-[#EC1E79] bg-[length:var(--bg-size)_100%] bg-clip-text text-[10.5px] font-bold uppercase tracking-[0.14em] text-transparent">
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
          className="mb-5 h-[100px] w-auto drop-shadow-[0_14px_32px_rgba(236,30,121,0.3)] sm:h-[115px] md:h-[125px]"
        />

        <EditableText
          cmsKey="hero_headline"
          label="Homepage hero headline"
          value={headline}
          multiline
          maxLength={120}
        >
          {(current) => {
            const parts = current.split('\n')
            return (
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="m-0 text-[clamp(1.85rem,4.2vw,3.25rem)] font-black leading-[1.04] tracking-[-0.04em] text-white"
              >
                {parts.map((part, i) => (
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
            )
          }}
        </EditableText>

        <EditableText
          cmsKey="hero_subtext"
          label="Homepage hero subtext"
          value={subtext}
          multiline
          maxLength={200}
        >
          {(current) => (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mb-6 mt-3 max-w-[480px] text-[0.875rem] leading-[1.6] text-white/55 sm:text-[0.9375rem]"
            >
              {current.split('\n').map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </motion.p>
          )}
        </EditableText>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex w-full flex-col items-center justify-center gap-2 sm:w-auto sm:flex-row"
        >
          <Link href={ctaLink} className="w-full sm:w-auto">
            <ShimmerButton
              className="w-full px-6 py-2.5 text-[13px] sm:w-auto"
              background="linear-gradient(135deg, #EC1E79 0%, #FF4DA6 100%)"
            >
              <span className="flex items-center gap-1.5">
                {ctaText} <ArrowRight size={13} />
              </span>
            </ShimmerButton>
          </Link>
          <Link href={secondaryCtaLink} className="w-full sm:w-auto">
            <button
              className="group relative flex w-full items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-6 py-2.5 text-[13px] font-bold text-white backdrop-blur-sm transition-all hover:border-[#EC1E79]/50 hover:bg-white/[0.08] sm:w-auto"
            >
              {secondaryCtaText}
              <ArrowRight
                size={13}
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
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30"
        >
          <span className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-[#EC1E79]" />
            PSA · CGC · ACE
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-[#EC1E79]" />
            Free UK shipping
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-[#EC1E79]" />
            Same day dispatch
          </span>
        </motion.div>
      </div>
    </section>
  )
}
