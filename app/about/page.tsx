'use client'

import Link from 'next/link'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Trophy, Users } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Particles } from '@/components/magicui/particles'
import { BorderBeam } from '@/components/magicui/border-beam'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text'

type TeamMember = {
  name: string
  role: string
  initials: string
  bio: string
  tag: string
}

const TEAM: TeamMember[] = [
  {
    name: 'Bhumit',
    role: 'Co-Founder',
    initials: 'BH',
    bio: 'Builds and runs the tech. Keeps the site, stock and checkout running smooth.',
    tag: 'Tech & Operations',
  },
  {
    name: 'Bash',
    role: 'Co-Founder',
    initials: 'BA',
    bio: 'Sources the stock. Hunts singles, sealed product and graded slabs across the UK.',
    tag: 'Sourcing & Buying',
  },
  {
    name: 'Ramz',
    role: 'Co-Founder',
    initials: 'RZ',
    bio: 'Runs the socials and the community on Instagram, TikTok and YouTube.',
    tag: 'Community & Content',
  },
  {
    name: 'Allan',
    role: 'Co-Founder',
    initials: 'AL',
    bio: 'The grading specialist. Years of PSA, CGC and ACE submissions under his belt.',
    tag: 'Grading Specialist',
  },
]

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="relative mb-6 size-[120px]">
      {/* outer glow ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#EC1E79] via-[#FF4DA6] to-[#7e1247] opacity-90 blur-[2px]" />
      {/* inner */}
      <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-gradient-to-br from-[#1a0612] via-[#2b0a1f] to-[#0a0a0a]">
        <span className="bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-[2.6rem] font-black tracking-[-0.04em] text-transparent">
          {initials}
        </span>
      </div>
      {/* tiny accent dot */}
      <div className="absolute -right-1 bottom-1 size-3 rounded-full border-2 border-white bg-[#EC1E79]" />
    </div>
  )
}

function TeamCard({ member, index }: { member: TeamMember; index: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-7 transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="flex flex-col items-center text-center">
        <Avatar initials={member.initials} />
        <h3 className="m-0 text-[1.35rem] font-black tracking-[-0.02em] text-neutral-900">
          {member.name}
        </h3>
        <p className="m-0 mb-3 mt-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#EC1E79]">
          {member.role}
        </p>
        <div className="mb-4 inline-block rounded-full bg-[#fff0f7] px-3 py-1 text-[11px] font-bold text-[#7e1247]">
          {member.tag}
        </div>
        <p className="m-0 text-[14px] leading-[1.7] text-neutral-500">{member.bio}</p>
      </div>
      {hovered && <BorderBeam size={240} duration={9} colorFrom="#EC1E79" colorTo="#FF80B8" borderWidth={1.5} />}
    </motion.div>
  )
}

export default function AboutPage() {
  const particlesRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <Header />
      <main className="bg-white">
        {/* hero */}
        <section
          ref={particlesRef}
          className="relative overflow-hidden bg-[#070708] py-24 sm:py-28"
        >
          <Particles
            className="absolute inset-0"
            quantity={70}
            ease={70}
            color="#EC1E79"
            size={0.6}
            staticity={40}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(70% 50% at 50% 0%, rgba(236,30,121,0.22) 0%, rgba(236,30,121,0.05) 35%, transparent 70%)',
            }}
          />

          <div className="relative z-10 mx-auto max-w-[760px] px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 flex justify-center"
            >
              <AnimatedGradientText className="!bg-white/[0.04] !text-white">
                <Users className="mr-1.5 size-3.5 text-[#EC1E79]" />
                <span className="inline animate-gradient bg-gradient-to-r from-[#EC1E79] via-[#FF80B8] to-[#EC1E79] bg-[length:var(--bg-size)_100%] bg-clip-text text-xs font-bold uppercase tracking-[0.14em] text-transparent">
                  Who we are
                </span>
              </AnimatedGradientText>
            </motion.div>

            <motion.img
              src="/logo/luton-cards.png"
              alt="Luton Cards"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mx-auto mb-8 h-[140px] w-auto drop-shadow-[0_18px_40px_rgba(236,30,121,0.35)]"
            />

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="m-0 text-[clamp(2rem,4.5vw,3rem)] font-black leading-[1.05] tracking-[-0.035em] text-white"
            >
              Four collectors from{' '}
              <span className="bg-gradient-to-br from-[#EC1E79] to-[#FF4DA6] bg-clip-text text-transparent">
                Luton
              </span>{' '}
              with one obsession — cards.
            </motion.h1>
          </div>
        </section>

        {/* body */}
        <section className="mx-auto max-w-[720px] px-6 py-16 sm:py-20">
          <div className="flex flex-col gap-4 text-[1.0625rem] leading-[1.8] text-neutral-700">
            <p className="m-0">
              Luton Cards is a UK-based shop for Pok&eacute;mon and One Piece TCG collectors. We started because we
              couldn&apos;t find a UK shop that sold the way we&apos;d want to buy &mdash; properly checked stock, fair pricing,
              no surprises in the post.
            </p>
            <p className="m-0">
              From raw singles to PSA-graded slabs to sealed booster boxes, every card on the site has been through our
              hands. We source carefully, grade honestly, and pack like it matters &mdash; because it does.
            </p>
            <p className="m-0">
              Whether you&apos;re chasing a vintage holo, completing a modern Pok&eacute;mon set, or building a Luffy
              leader deck &mdash; we&apos;re here to help.
            </p>
          </div>
        </section>

        {/* stats strip */}
        <section className="border-y border-neutral-200 bg-neutral-50">
          <div className="mx-auto grid max-w-[1100px] grid-cols-1 divide-y divide-neutral-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { icon: MapPin, value: 'Luton, UK', label: 'Based in' },
              { icon: Trophy, value: '2025', label: 'Established' },
              { icon: Users, value: '4', label: 'Founders', isNumber: true },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                  <Icon size={18} className="text-[#EC1E79]" />
                  <div className="text-[clamp(1.4rem,3vw,1.85rem)] font-black tracking-[-0.025em] text-neutral-900">
                    {stat.isNumber ? <NumberTicker value={parseInt(stat.value)} /> : stat.value}
                  </div>
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-neutral-400">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* team */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-[1180px] px-6">
            <div className="mb-12 text-center">
              <p className="m-0 mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#EC1E79]">
                Meet the team
              </p>
              <h2 className="m-0 text-[clamp(1.8rem,4vw,2.6rem)] font-black leading-[1.1] tracking-[-0.03em] text-neutral-900">
                The four behind the cards.
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM.map((member, i) => (
                <TeamCard key={member.name} member={member} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* mission */}
        <section className="relative overflow-hidden bg-[#0d0d0d] py-24 sm:py-28">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(50% 60% at 50% 0%, rgba(236,30,121,0.15) 0%, transparent 70%)',
            }}
          />
          <div className="relative mx-auto max-w-[680px] px-6 text-center">
            <div className="mx-auto mb-7 h-px w-12 bg-[#EC1E79]" />
            <blockquote className="m-0 text-[clamp(1.15rem,2.6vw,1.5rem)] font-bold italic leading-[1.6] tracking-[-0.01em] text-white">
              &ldquo;A UK card shop run by people who actually collect &mdash; properly sourced stock, fair pricing, and a
              community that puts the hobby first.&rdquo;
            </blockquote>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-[560px] px-6 text-center">
            <h2 className="m-0 mb-3 text-[clamp(1.6rem,4vw,2.3rem)] font-black leading-[1.15] tracking-[-0.03em] text-neutral-900">
              Ready to shop?
            </h2>
            <p className="m-0 mb-7 text-base leading-[1.6] text-neutral-500">
              Browse our full range of Pok&eacute;mon and One Piece &mdash; singles, graded slabs, and sealed boxes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/products?game=pokemon">
                <ShimmerButton className="px-7 py-3 text-sm" background="linear-gradient(135deg, #EC1E79 0%, #FF4DA6 100%)">
                  <span className="flex items-center gap-1.5">
                    Shop Pok&eacute;mon <ArrowRight size={14} />
                  </span>
                </ShimmerButton>
              </Link>
              <Link
                href="/products?game=one-piece"
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#EC1E79] bg-white px-7 py-3 text-sm font-extrabold text-[#EC1E79] transition-colors hover:bg-[#fff0f7]"
              >
                Shop One Piece <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
