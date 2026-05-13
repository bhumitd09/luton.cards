'use client'

import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const DEFAULTS = {
  ethos_label: 'How we operate',
  ethos_headline: 'We buy them,\ngrade them, sell them.',
  ethos_01_title: 'We grade. We source.',
  ethos_01_body: "Some cards we buy raw and send off ourselves — PSA, CGC, ACE. Others we pick up already slabbed. Either way, we know the card before it goes on the site.",
  ethos_02_title: 'No funny pricing.',
  ethos_02_body: "We're collectors too. We know what things are worth and we price accordingly. You won't find us sticking a random number on something and hoping for the best.",
  ethos_03_title: 'Packed like it matters.',
  ethos_03_body: "Because it does. We've all had that sinking feeling when a parcel arrives dented. Every order goes out wrapped properly — not just chucked in a bag.",
}

type EthosData = typeof DEFAULTS

const CMS_KEYS = Object.keys(DEFAULTS).join(',')

export function EthosStrip() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const [cms, setCms] = useState<EthosData>(DEFAULTS)

  useEffect(() => {
    fetch(`/api/content?keys=${CMS_KEYS}`)
      .then(r => r.json())
      .then((data: Partial<EthosData>) => {
        setCms(prev => ({
          ethos_label: data.ethos_label || prev.ethos_label,
          ethos_headline: data.ethos_headline || prev.ethos_headline,
          ethos_01_title: data.ethos_01_title || prev.ethos_01_title,
          ethos_01_body: data.ethos_01_body || prev.ethos_01_body,
          ethos_02_title: data.ethos_02_title || prev.ethos_02_title,
          ethos_02_body: data.ethos_02_body || prev.ethos_02_body,
          ethos_03_title: data.ethos_03_title || prev.ethos_03_title,
          ethos_03_body: data.ethos_03_body || prev.ethos_03_body,
        }))
      })
      .catch(() => {
        // Keep defaults on error
      })
  }, [])

  const pillars = [
    { number: '01', title: cms.ethos_01_title, body: cms.ethos_01_body },
    { number: '02', title: cms.ethos_02_title, body: cms.ethos_02_body },
    { number: '03', title: cms.ethos_03_title, body: cms.ethos_03_body },
  ]

  return (
    <section
      ref={ref}
      style={{
        background: '#fff',
        padding: '7rem 0 6rem',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .ethos-section { padding: 3rem 0 2.5rem !important; }
          .ethos-grid { grid-template-columns: 1fr !important; }
          .ethos-pillar { border-left: none !important; padding-left: 0 !important; padding-right: 0 !important; border-top: 1px solid #ebebeb; padding-top: 1.5rem; margin-top: 1.5rem; }
          .ethos-pillar:first-child { border-top: none !important; padding-top: 0 !important; margin-top: 0 !important; }
          .ethos-headline { margin-bottom: 2.5rem !important; }
        }
      `}</style>
      <div className="container">

        {/* Top label */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          style={{
            fontSize: '0.6875rem',
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#EC1E79',
            marginBottom: '1.5rem',
          }}
        >
          {cms.ethos_label}
        </motion.p>

        {/* Bold statement */}
        <motion.h2
          className="ethos-headline"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.05 }}
          style={{
            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
            fontWeight: 900,
            color: '#000',
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            maxWidth: '600px',
            marginBottom: '5rem',
            whiteSpace: 'pre-line',
          }}
        >
          {cms.ethos_headline}
        </motion.h2>

        {/* Three pillars — horizontal rule layout */}
        <div className="ethos-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0,
        }}>
          {pillars.map((p, i) => (
            <motion.div
              key={p.number}
              className="ethos-pillar"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              style={{
                paddingRight: i < 2 ? '3rem' : 0,
                paddingLeft: i > 0 ? '3rem' : 0,
                borderLeft: i > 0 ? '1px solid #ebebeb' : 'none',
              }}
            >
              <span style={{
                display: 'block',
                fontSize: '0.6875rem',
                fontWeight: 800,
                color: '#EC1E79',
                letterSpacing: '0.1em',
                marginBottom: '0.875rem',
              }}>
                {p.number}
              </span>
              <h3 style={{
                fontSize: '1.1875rem',
                fontWeight: 800,
                color: '#000',
                letterSpacing: '-0.025em',
                marginBottom: '0.75rem',
                lineHeight: 1.2,
              }}>
                {p.title}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                lineHeight: 1.7,
                margin: 0,
              }}>
                {p.body}
              </p>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Full-width rule at bottom */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #EC1E79 30%, #EC1E79 70%, transparent)',
          marginTop: '5rem',
          transformOrigin: 'left',
        }}
      />
    </section>
  )
}
