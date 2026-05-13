'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('cookie_consent')
      if (!consent) {
        setVisible(true)
      }
    }
  }, [])

  function handleAccept() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie_consent', 'accepted')
    }
    setVisible(false)
  }

  function handleDecline() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie_consent', 'declined')
    }
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'rgba(10,10,10,0.97)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <style>{`
            @media (max-width: 768px) {
              .cookie-inner { grid-template-columns: 1fr !important; gap: 1rem !important; }
              .cookie-btns { flex-direction: row !important; width: 100%; }
              .cookie-btns button { flex: 1 !important; }
            }
          `}</style>
          <div
            className="cookie-inner"
            style={{
              maxWidth: '1100px',
              margin: '0 auto',
              padding: '1.25rem 1.5rem',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: '1.5rem',
              alignItems: 'center',
            }}
          >
            {/* Text */}
            <p
              style={{
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              🍪 We use cookies to keep your cart, remember your login, and (with your permission) improve the site with analytics. Read our{' '}
              <Link
                href="/cookies"
                style={{ color: '#EC1E79', textDecoration: 'underline', textUnderlineOffset: '2px' }}
              >
                Cookie Policy
              </Link>
              .
            </p>

            {/* Buttons */}
            <div
              className="cookie-btns"
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                flexShrink: 0,
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={handleAccept}
                style={{
                  background: '#EC1E79',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  padding: '0.65rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                Accept All
              </button>
              <button
                onClick={handleDecline}
                style={{
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.4)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  padding: '0.65rem 1rem',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                Decline
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
