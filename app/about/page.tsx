'use client'

import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

type TeamMember = {
  name: string
  role: string
  initials: string
  bio: string
  tag: string
  accent: string
}

const TEAM: TeamMember[] = [
  {
    name: 'Bhumit',
    role: 'Co-Founder & Developer',
    initials: 'B',
    bio: 'Builds and runs the tech behind Luton Cards. Keeps the site, the stock and the checkout running so the rest of the team can focus on the cards.',
    tag: 'Tech & Operations',
    accent: '#EC1E79',
  },
  {
    name: 'Bash',
    role: 'Co-Founder & Buyer',
    initials: 'B',
    bio: 'Sources the stock. Spends his days hunting down singles, sealed product and graded slabs across the UK — if it goes on the site, Bash has held it first.',
    tag: 'Sourcing & Buying',
    accent: '#FF4DA6',
  },
  {
    name: 'Ramz',
    role: 'Co-Founder & Social Media',
    initials: 'R',
    bio: 'Runs the socials and the community. The voice on Instagram, TikTok and YouTube — making sure collectors know what we have and what is dropping next.',
    tag: 'Community & Content',
    accent: '#EC1E79',
  },
  {
    name: 'Allan',
    role: 'Co-Founder & Grading',
    initials: 'A',
    bio: 'The grading specialist. Years of experience with PSA, CGC and ACE submissions — every slab listed on the site has been through his hands.',
    tag: 'Grading Specialist',
    accent: '#FF4DA6',
  },
]

function Avatar({ initials, accent }: { initials: string; accent: string }) {
  return (
    <div
      style={{
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${accent} 0%, #7e1247 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.25rem',
        boxShadow: `0 12px 30px -10px ${accent}66`,
      }}
    >
      <span style={{ color: '#fff', fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
        {initials}
      </span>
    </div>
  )
}

export default function AboutPage() {
  return (
    <>
      <style>{`
        .btn-primary { transition: background 0.2s, transform 0.15s; }
        .btn-primary:hover { background: #c81c6b !important; transform: translateY(-2px); }
        .team-card { transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
        .team-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -20px rgba(0,0,0,0.12);
          border-color: #d1d5db !important;
        }
        @media (max-width: 900px) {
          .about-team-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .about-hero { padding: 4rem 1.25rem 2.5rem !important; }
          .about-hero-logo { height: 100px !important; }
          .about-stats { grid-template-columns: 1fr !important; }
          .about-team-grid { grid-template-columns: 1fr !important; }
          .about-body-wrap { padding: 2.5rem 1.25rem !important; }
          .about-mission { padding: 3rem 1.25rem !important; }
          .about-cta { padding: 3rem 1.25rem !important; }
        }
      `}</style>

      <Header />
      <main style={{ background: '#fff' }}>

        {/* Hero banner */}
        <section
          className="about-hero"
          style={{
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0612 60%, #2b0a1f 100%)',
            position: 'relative',
            overflow: 'hidden',
            padding: '5rem 1.5rem 3.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-200px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '700px',
              height: '700px',
              background: 'radial-gradient(circle, rgba(236,30,121,0.22) 0%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px', margin: '0 auto' }}>
            <img
              src="/logo/luton-cards.png"
              alt="Luton Cards"
              className="about-hero-logo"
              style={{
                height: '140px',
                width: 'auto',
                display: 'block',
                margin: '0 auto 1.5rem',
                filter: 'drop-shadow(0 12px 32px rgba(236,30,121,0.3))',
              }}
            />
            <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#EC1E79', margin: '0 0 0.85rem' }}>
              Who we are
            </p>
            <h1 style={{
              fontSize: 'clamp(2rem, 4.5vw, 3rem)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              margin: 0,
            }}>
              Four collectors from Luton with one obsession &mdash; cards.
            </h1>
          </div>
        </section>

        {/* Who we are body */}
        <section className="about-body-wrap" style={{ maxWidth: '760px', margin: '0 auto', padding: '4rem 1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', margin: 0 }}>
              Luton Cards is a UK-based shop for Pok&eacute;mon and One Piece TCG collectors. We started because we couldn&apos;t find a UK shop that sold the way we&apos;d want to buy &mdash; properly checked stock, fair pricing, and no surprises in the post.
            </p>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', margin: 0 }}>
              From raw singles to PSA-graded slabs to sealed booster boxes, every card on the site has been through our hands. We source carefully, grade honestly, and pack like it matters &mdash; because it does.
            </p>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', margin: 0 }}>
              Whether you&apos;re chasing a vintage holo, completing a modern Pok&eacute;mon set, or building a Luffy leader deck &mdash; we&apos;re here to help.
            </p>
          </div>
        </section>

        {/* Stats strip */}
        <section style={{ background: '#0d0d0d' }}>
          <div
            className="about-stats"
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
            }}
          >
            {[
              { value: 'Luton, UK', label: 'Based in' },
              { value: 'Pokémon & One Piece', label: 'Speciality' },
              { value: '4 Founders', label: 'Built by' },
            ].map((stat, i) => (
              <div key={i} style={{
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : undefined,
              }}>
                <p style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: 900, color: '#EC1E79', margin: '0 0 0.35rem', letterSpacing: '-0.02em' }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, margin: 0 }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section style={{ background: '#fff', padding: '5rem 1.5rem' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#EC1E79', margin: '0 0 0.75rem' }}>
                Meet the team
              </p>
              <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: '#111', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
                The four behind the cards
              </h2>
            </div>

            <div
              className="about-team-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1.5rem',
              }}
            >
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className="team-card"
                  style={{
                    background: '#fff',
                    borderRadius: '20px',
                    border: '1.5px solid #eee',
                    padding: '2.25rem 1.5rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  <Avatar initials={member.initials} accent={member.accent} />

                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
                    {member.name}
                  </h3>

                  <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#EC1E79', textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 1rem' }}>
                    {member.role}
                  </p>

                  <div style={{
                    display: 'inline-block',
                    background: '#fff0f7',
                    color: '#7e1247',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.3rem 0.8rem',
                    borderRadius: '20px',
                    marginBottom: '1.25rem',
                  }}>
                    {member.tag}
                  </div>

                  <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: '#555', margin: 0 }}>
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission quote */}
        <section className="about-mission" style={{ background: '#0d0d0d', padding: '5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '660px', margin: '0 auto' }}>
            <div style={{ width: '36px', height: '3px', background: '#EC1E79', borderRadius: '2px', margin: '0 auto 2rem' }} />
            <blockquote style={{
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.65,
              margin: 0,
              letterSpacing: '-0.01em',
              fontStyle: 'italic',
            }}>
              &ldquo;A UK card shop run by people who actually collect &mdash; properly sourced stock, fair pricing, and a community that puts the hobby first.&rdquo;
            </blockquote>
          </div>
        </section>

        {/* CTA */}
        <section className="about-cta" style={{ background: '#fff', padding: '4.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, color: '#111', letterSpacing: '-0.03em', margin: '0 0 0.75rem', lineHeight: 1.15 }}>
              Ready to shop?
            </h2>
            <p style={{ fontSize: '1rem', color: '#666', margin: '0 0 2rem', lineHeight: 1.6 }}>
              Browse our full range of Pok&eacute;mon and One Piece &mdash; singles, graded slabs, and sealed boxes.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/products?game=pokemon" style={{ textDecoration: 'none' }}>
                <button
                  className="btn-primary"
                  style={{
                    background: '#EC1E79',
                    color: '#fff',
                    border: 'none',
                    padding: '0.9rem 2rem',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                    fontFamily: 'inherit',
                  }}
                >
                  Shop Pok&eacute;mon
                </button>
              </Link>
              <Link href="/products?game=one-piece" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    background: 'transparent',
                    color: '#EC1E79',
                    border: '2px solid #EC1E79',
                    padding: '0.9rem 2rem',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                    fontFamily: 'inherit',
                  }}
                >
                  Shop One Piece
                </button>
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
