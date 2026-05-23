'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export function BuiltByBanner() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section
      ref={ref}
      style={{
        background: '#050505',
        borderTop: '1px solid #111',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Stronger brand glow top-left */}
      <div style={{
        position: 'absolute',
        top: '-80px', left: '-80px',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(236,30,121,0.12) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      {/* Faint glow right */}
      <div style={{
        position: 'absolute',
        top: '50%', right: '-100px',
        transform: 'translateY(-50%)',
        width: '400px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(236,30,121,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <style>{`
        .ctcg-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 4.5rem 1.5rem;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0;
          align-items: center;
        }
        .ctcg-left { padding-right: 4rem; }
        .ctcg-right {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.5rem;
          padding-left: 4rem;
          position: relative;
        }
        /* Brand split line */
        .ctcg-right::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, transparent, #EC1E79 25%, #EC1E79 75%, transparent);
        }
        .ctcg-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #EC1E79;
          color: #000;
          font-weight: 800;
          font-size: 0.9375rem;
          padding: 0.875rem 1.75rem;
          border-radius: 10px;
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .ctcg-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(236,30,121,0.35);
        }
        .ctcg-logo {
          height: 40px;
          width: auto;
          display: block;
        }
        @media (max-width: 760px) {
          .ctcg-inner {
            grid-template-columns: 1fr;
            padding: 3rem 1.5rem;
          }
          .ctcg-left { padding-right: 0; padding-bottom: 2.5rem; }
          .ctcg-right {
            padding-left: 0;
            padding-top: 2.5rem;
          }
          .ctcg-right::before {
            top: 0; bottom: auto;
            left: 0; right: 0;
            width: 100%; height: 2px;
            background: linear-gradient(to right, transparent, #EC1E79 25%, #EC1E79 75%, transparent);
          }
        }
      `}</style>

      <div className="ctcg-inner">
        {/* Left */}
        <motion.div
          className="ctcg-left"
          initial={{ opacity: 0, x: -24 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h2 style={{
            fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.04em',
            lineHeight: 1.0,
            margin: '0 0 1.25rem',
          }}>
            What&apos;s your collection<br />
            <span style={{ color: '#EC1E79' }}>actually worth?</span>
          </h2>
          <p style={{
            fontSize: '1rem',
            color: '#EC1E79',
            lineHeight: 1.65,
            maxWidth: '500px',
            margin: 0,
            fontWeight: 500,
            opacity: 0.75,
          }}>
            Collect TCG is the inventory and pricing platform built for card sellers.
            Track live prices, manage your stock and know your numbers — all in one place.
          </p>
        </motion.div>

        {/* Right */}
        <motion.div
          className="ctcg-right"
          initial={{ opacity: 0, x: 24 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <img
            src="https://collecttcg.co.uk/logo/CollectTCG.png"
            alt="Collect TCG"
            className="ctcg-logo"
          />
          <p style={{
            fontSize: '0.875rem',
            color: 'rgba(255,255,255,0.35)',
            margin: 0,
            lineHeight: 1.55,
            maxWidth: '220px',
          }}>
            Trusted by TCG sellers<br />across the UK.
          </p>
          <a
            href="https://collecttcg.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="ctcg-btn"
          >
            Try it free →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
