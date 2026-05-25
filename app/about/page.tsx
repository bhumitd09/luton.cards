'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Calendar, Users, Sparkles, Gamepad2, UserPlus, Tent, Store } from 'lucide-react'
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
  bio: string
  tag: string
  photo?: string
}

const DEFAULT_TEAM: TeamMember[] = [
  {
    name: 'Bhumit',
    role: 'Vintage Pokémon Specialist',
    bio: 'The vintage hunter. Hand picks pre-2003 Pokémon, Base Set holos, gold stars and sealed wax that\'s older than most of the people buying it.',
    tag: 'Base Set & Beyond',
  },
  {
    name: 'Bash',
    role: 'One Piece Specialist',
    bio: 'Lives and breathes One Piece TCG. Knows every set, every alt art, every leader meta. If it\'s an OP card, Bash has an opinion on it.',
    tag: 'OP-01 to Now',
  },
  {
    name: 'Ramz',
    role: 'Pokémon & One Piece Specialist',
    bio: 'The all rounder. Tracks modern Pokémon sets and One Piece releases side by side. First to know what\'s about to spike.',
    tag: 'Modern Sets Master',
  },
  {
    name: 'Allan',
    role: 'Grading & Sealed Specialist',
    bio: 'Years of PSA, CGC and ACE submissions plus a sealed vault that\'s the envy of UK collectors. Every slab on the site has been through his hands.',
    tag: 'PSA · CGC · ACE',
  },
]

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function Avatar({ name, photo }: { name: string; photo?: string }) {
  return (
    <div className="relative mb-6 size-[120px]">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#EC1E79] via-[#FF4DA6] to-[#7e1247] opacity-90 blur-[2px]" />
      {photo ? (
        <div className="absolute inset-[3px] overflow-hidden rounded-full bg-neutral-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt={name} className="size-full object-cover" />
        </div>
      ) : (
        <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-gradient-to-br from-[#1a0612] via-[#2b0a1f] to-[#0a0a0a]">
          <span className="bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-[2.6rem] font-black tracking-[-0.04em] text-transparent">
            {initialsOf(name)}
          </span>
        </div>
      )}
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
        <Avatar name={member.name} photo={member.photo} />
        <h3 className="m-0 text-[1.35rem] font-black tracking-[-0.02em] text-neutral-900">
          {member.name}
        </h3>
        {member.role && (
          <div className="mb-3 mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#EC1E79]/25 bg-gradient-to-r from-[#fff0f7] to-white px-3 py-1">
            <span className="size-1.5 rounded-full bg-[#EC1E79]" />
            <span className="bg-gradient-to-r from-[#EC1E79] to-[#7e1247] bg-clip-text text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-transparent">
              {member.role}
            </span>
          </div>
        )}
        {member.tag && (
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            {member.tag}
          </div>
        )}
        {member.bio && (
          <p className="m-0 text-[14px] leading-[1.7] text-neutral-500">{member.bio}</p>
        )}
      </div>
      {hovered && <BorderBeam size={240} duration={9} colorFrom="#EC1E79" colorTo="#FF80B8" borderWidth={1.5} />}
    </motion.div>
  )
}

type TimelineMoment = {
  icon: typeof Gamepad2
  year: string
  title: string
  body: string
}

const TIMELINE: TimelineMoment[] = [
  {
    icon: Gamepad2,
    year: '2020',
    title: 'Warzone lobbies, late nights',
    body: 'Bash, Ramz and Bhumit linked up during lockdown. Endless Warzone, endless chat, nothing else to do. The crew was formed before any of it was about cards.',
  },
  {
    icon: Sparkles,
    year: '2022',
    title: 'The card obsession hit',
    body: 'Pokémon pulled us back in, One Piece TCG dropped, and suddenly group chats were 90% cards. Singles, slabs, sealed product. We were hooked.',
  },
  {
    icon: UserPlus,
    year: '2024',
    title: 'Met Allan in Milton Keynes',
    body: 'We were vending at an event in MK when Allan rocked up to talk grading and sealed product. Knew his stuff instantly. Four became the lineup and it has stayed that way ever since.',
  },
  {
    icon: Tent,
    year: 'Now',
    title: 'Vending crew, properly',
    body: 'Catch us at events around the UK with raw singles, graded slabs and sealed product you can actually trust. Online shop is open 24/7 too.',
  },
  {
    icon: Store,
    year: 'Soon',
    title: 'A proper Luton shop',
    body: 'The long game is a bricks and mortar spot in Luton. Doors, shelves, a glass case full of slabs. When the timing is right, we open. Not a day before.',
  },
]

function TimelineItem({ moment, index }: { moment: TimelineMoment; index: number }) {
  const Icon = moment.icon
  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className="relative pl-14 pb-9 last:pb-0"
    >
      {/* dot */}
      <span
        className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-full border border-[#EC1E79]/30 bg-gradient-to-br from-[#190614] to-[#2a0a20] shadow-[0_8px_24px_-10px_rgba(236,30,121,0.6)]"
      >
        <Icon size={16} className="text-[#FF80B8]" />
      </span>
      {/* connector */}
      <span
        aria-hidden
        className="absolute left-[19px] top-10 h-[calc(100%-2rem)] w-px bg-gradient-to-b from-[#EC1E79]/40 via-[#EC1E79]/10 to-transparent"
      />
      <div className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#EC1E79]">
        {moment.year}
      </div>
      <div className="mt-1 text-[1.1rem] font-black tracking-[-0.02em] text-white sm:text-[1.2rem]">
        {moment.title}
      </div>
      <p className="m-0 mt-2 max-w-[560px] text-[14.5px] leading-[1.7] text-neutral-400">
        {moment.body}
      </p>
    </motion.li>
  )
}

export default function AboutPage() {
  const particlesRef = useRef<HTMLDivElement>(null)
  const [team, setTeam] = useState<TeamMember[]>(DEFAULT_TEAM)
  const [groupPhoto, setGroupPhoto] = useState<string>('')

  useEffect(() => {
    fetch('/api/content?keys=team_members,about_group_photo')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data) return
        if (typeof data.about_group_photo === 'string') {
          setGroupPhoto(data.about_group_photo.trim())
        }
        if (data.team_members) {
          try {
            const parsed = JSON.parse(String(data.team_members))
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTeam(parsed.filter((m: unknown): m is TeamMember => {
                const x = m as TeamMember
                return !!x && typeof x.name === 'string' && x.name.length > 0
              }))
            }
          } catch {}
        }
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <Header />
      <main className="bg-white">
        {/* ─── HERO ───────────────────────────────────────────────────────── */}
        <section
          ref={particlesRef}
          className="relative overflow-hidden bg-[#070708] pt-20 pb-16 sm:pt-24 sm:pb-20"
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

          <div className="relative z-10 mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6 flex justify-center lg:justify-start"
              >
                <AnimatedGradientText className="!bg-white/[0.04] !text-white">
                  <Users className="mr-1.5 size-3.5 text-[#EC1E79]" />
                  <span className="inline animate-gradient bg-gradient-to-r from-[#EC1E79] via-[#FF80B8] to-[#EC1E79] bg-[length:var(--bg-size)_100%] bg-clip-text text-xs font-bold uppercase tracking-[0.14em] text-transparent">
                    Meet the crew
                  </span>
                </AnimatedGradientText>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="m-0 text-[clamp(2.1rem,5vw,3.4rem)] font-black leading-[1.02] tracking-[-0.04em] text-white"
              >
                Four mates from{' '}
                <span className="bg-gradient-to-br from-[#EC1E79] to-[#FF4DA6] bg-clip-text text-transparent">
                  all around
                </span>
                <br className="hidden sm:block" />
                who turned a card obsession into a crew.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.18 }}
                className="m-0 mt-6 max-w-[520px] text-[1.05rem] leading-[1.7] text-neutral-400 lg:max-w-[480px]"
              >
                We vend at events across the UK. Pokémon, One Piece, raw singles, graded slabs, sealed product.
                A proper shop is on the way. Until then, find us at the next event or shop online.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.26 }}
                className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
              >
                <Link href="/products?game=pokemon">
                  <ShimmerButton className="px-7 py-3 text-sm" background="linear-gradient(135deg, #EC1E79 0%, #FF4DA6 100%)">
                    <span className="flex items-center gap-1.5 text-white">
                      Shop the drop <ArrowRight size={14} />
                    </span>
                  </ShimmerButton>
                </Link>
                <Link
                  href="#our-story"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-extrabold text-white transition-colors hover:bg-white/[0.08]"
                >
                  Our story
                </Link>
              </motion.div>
            </div>

            {/* Right: group photo / fallback */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="relative mx-auto w-full max-w-[520px]"
            >
              {/* Outer glow */}
              <div
                aria-hidden
                className="absolute -inset-3 rounded-[28px] bg-gradient-to-br from-[#EC1E79]/40 via-[#7e1247]/30 to-transparent blur-2xl"
              />
              <div className="relative aspect-[5/4] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#160512] via-[#0d0b0e] to-[#070708] shadow-[0_28px_70px_-20px_rgba(236,30,121,0.55)]">
                {groupPhoto ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={groupPhoto}
                    alt="The Luton Cards crew"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center px-8 text-center">
                    <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-[#EC1E79]/30 bg-[#190614]">
                      <Users size={22} className="text-[#FF80B8]" />
                    </div>
                    <p className="m-0 text-[15px] font-bold text-white">
                      Group photo coming soon
                    </p>
                    <p className="m-0 mt-1.5 max-w-[300px] text-[12.5px] leading-[1.55] text-neutral-500">
                      Upload via <span className="font-mono text-[#FF80B8]">/admin/team</span> to drop the crew in here.
                    </p>
                  </div>
                )}
                {/* corner badge */}
                <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1 backdrop-blur-md">
                  <span className="size-1.5 rounded-full bg-[#EC1E79]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">
                    The Crew
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── STATS STRIP ─────────────────────────────────────────────── */}
        <section className="border-y border-neutral-200 bg-neutral-50">
          <div className="mx-auto grid max-w-[1100px] grid-cols-2 divide-y divide-neutral-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {[
              { icon: MapPin, value: 'Luton, UK', label: 'Based in' },
              { icon: Users, value: String(team.length), label: 'In the crew', isNumber: true },
              { icon: Tent, value: 'UK Events', label: 'Where to find us' },
              { icon: Calendar, value: '2020', label: 'Friends since' },
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

        {/* ─── OUR STORY (narrative) ───────────────────────────────────── */}
        <section id="our-story" className="mx-auto max-w-[760px] px-6 py-20 sm:py-24">
          <div className="mb-8 text-center">
            <p className="m-0 mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#EC1E79]">
              How it started
            </p>
            <h2 className="m-0 text-[clamp(1.9rem,4vw,2.7rem)] font-black leading-[1.08] tracking-[-0.035em] text-neutral-900">
              Three lads, one lockdown, a load of cards.
            </h2>
          </div>

          <div className="flex flex-col gap-5 text-[1.05rem] leading-[1.85] text-neutral-700">
            <p className="m-0">
              Bash, Ramz and Bhumit became mates during COVID. Warzone lobbies, late nights, no jobs to wake up
              for. The friendship stuck. When lockdown lifted, the cards came in. Pokémon dragged us back to
              the hobby, One Piece TCG dropped and we were properly cooked.
            </p>
            <p className="m-0">
              Allan came in later. We were vending at an event in Milton Keynes when he pulled up to talk
              grading and sealed product. Knew his stuff instantly. Four became the lineup and it has stayed
              that way ever since.
            </p>
            <p className="m-0">
              We are not a shop yet. We vend at events around the UK with raw singles, graded slabs and sealed
              product you can actually trust. The long game is a proper bricks and mortar spot in Luton. We open
              when the timing is right, not a day before.
            </p>
            <p className="m-0">
              Think of us as a dysfunctional family that hypes each other up over every PSA 10 and roasts each
              other over every PSA 7. Different specialisms, same obsession.
            </p>
          </div>
        </section>

        {/* ─── TIMELINE ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#0a0a0b] py-20 sm:py-24">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(60% 50% at 50% 0%, rgba(236,30,121,0.12) 0%, transparent 70%)',
            }}
          />
          <div className="relative mx-auto max-w-[860px] px-6">
            <div className="mb-12 text-center">
              <p className="m-0 mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#FF80B8]">
                Crew timeline
              </p>
              <h2 className="m-0 text-[clamp(1.7rem,3.8vw,2.4rem)] font-black leading-[1.08] tracking-[-0.03em] text-white">
                From Warzone lobbies to event stalls.
              </h2>
            </div>

            <ol className="relative m-0 list-none p-0">
              {TIMELINE.map((moment, i) => (
                <TimelineItem key={moment.title} moment={moment} index={i} />
              ))}
            </ol>
          </div>
        </section>

        {/* ─── TEAM GRID ───────────────────────────────────────────────── */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-[1180px] px-6">
            <div className="mb-12 text-center">
              <p className="m-0 mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#EC1E79]">
                Meet the four
              </p>
              <h2 className="m-0 text-[clamp(1.8rem,4vw,2.6rem)] font-black leading-[1.1] tracking-[-0.03em] text-neutral-900">
                Different specialisms, same obsession.
              </h2>
            </div>

            <div
              className={[
                'grid grid-cols-1 gap-5 sm:grid-cols-2',
                team.length === 3 ? 'lg:grid-cols-3' :
                team.length >= 4 ? 'lg:grid-cols-4' :
                team.length === 2 ? 'lg:grid-cols-2' :
                'lg:grid-cols-1',
              ].join(' ')}
            >
              {team.map((member, i) => (
                <TeamCard key={member.name + i} member={member} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── MISSION PULL QUOTE ──────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#0d0d0d] py-24 sm:py-28">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(50% 60% at 50% 0%, rgba(236,30,121,0.15) 0%, transparent 70%)',
            }}
          />
          <div className="relative mx-auto max-w-[760px] px-6 text-center">
            <div className="mx-auto mb-7 h-px w-12 bg-[#EC1E79]" />
            <blockquote className="m-0 text-[clamp(1.2rem,2.6vw,1.55rem)] font-bold italic leading-[1.55] tracking-[-0.01em] text-white">
              &ldquo;A vending crew run by people who actually collect. Properly sourced stock, fair pricing, and
              a community that puts the hobby first.&rdquo;
            </blockquote>
            <div className="mx-auto mt-7 h-px w-12 bg-[#EC1E79]" />
          </div>
        </section>

        {/* ─── CTA ─────────────────────────────────────────────────────── */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-[640px] px-6 text-center">
            <h2 className="m-0 mb-3 text-[clamp(1.7rem,4vw,2.4rem)] font-black leading-[1.12] tracking-[-0.03em] text-neutral-900">
              Catch us at the next event.
            </h2>
            <p className="m-0 mb-8 text-base leading-[1.65] text-neutral-500">
              Or skip the queue and shop the latest singles, graded slabs and sealed product online. We pack
              every order like it matters, because it does.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/products?game=pokemon">
                <ShimmerButton className="px-7 py-3 text-sm" background="linear-gradient(135deg, #EC1E79 0%, #FF4DA6 100%)">
                  <span className="flex items-center gap-1.5 text-white">
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
