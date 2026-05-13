'use client'

import { useEffect, useState } from 'react'

type AnnouncementColor = 'mint' | 'dark' | 'warning'

const COLOR_MAP: Record<AnnouncementColor, { bg: string; text: string }> = {
  mint: { bg: '#EC1E79', text: '#000' },
  dark: { bg: '#111', text: '#fff' },
  warning: { bg: '#f59e0b', text: '#000' },
}

type AnnouncementData = {
  announcement_enabled: string
  announcement_text: string
  announcement_link: string
  announcement_cta: string
  announcement_color: string
}

export function AnnouncementBar() {
  const [data, setData] = useState<AnnouncementData | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch('/api/content?keys=announcement_enabled,announcement_text,announcement_link,announcement_cta,announcement_color')
      .then(r => r.json())
      .then((json: AnnouncementData) => {
        setData(json)
      })
      .catch(() => {
        // silently fail — no announcement shown
      })
  }, [])

  useEffect(() => {
    if (!data) return
    if (data.announcement_enabled !== 'true') return
    if (!data.announcement_text) return

    const storageKey = `announcement_dismissed_${data.announcement_text}`
    const isDismissed = typeof window !== 'undefined'
      ? localStorage.getItem(storageKey) === 'true'
      : false

    if (isDismissed) {
      setDismissed(true)
      return
    }

    // Small delay so the animate-in is visible
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [data])

  const handleDismiss = () => {
    if (!data?.announcement_text) return
    const storageKey = `announcement_dismissed_${data.announcement_text}`
    localStorage.setItem(storageKey, 'true')
    setVisible(false)
    // Remove from DOM after transition
    setTimeout(() => setDismissed(true), 300)
  }

  if (!data) return null
  if (data.announcement_enabled !== 'true') return null
  if (!data.announcement_text) return null
  if (dismissed) return null

  const colorKey = (data.announcement_color as AnnouncementColor) in COLOR_MAP
    ? (data.announcement_color as AnnouncementColor)
    : 'mint'
  const colors = COLOR_MAP[colorKey]

  const hasLink = Boolean(data.announcement_link)
  const hasCta = Boolean(data.announcement_cta)

  return (
    <div
      role="banner"
      style={{
        background: colors.bg,
        color: colors.text,
        width: '100%',
        overflow: 'hidden',
        maxHeight: visible ? '120px' : '0px',
        opacity: visible ? 1 : 0,
        transition: 'max-height 0.3s ease, opacity 0.3s ease',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .announcement-text { font-size: 0.75rem !important; }
          .announcement-inner { padding: 0.5rem 2.5rem !important; min-height: 36px !important; }
          .announcement-dismiss { width: 36px !important; height: 36px !important; right: 0.25rem !important; }
        }
      `}</style>
      <div className="announcement-inner" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '0.625rem 3rem',
        minHeight: '40px',
      }}>
        {/* Center content */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          textAlign: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <span className="announcement-text" style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            lineHeight: 1.4,
          }}>
            {data.announcement_text}
          </span>

          {hasCta && hasLink && (
            <a
              href={data.announcement_link}
              style={{
                fontSize: '0.8125rem',
                fontWeight: 800,
                color: colors.text,
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
                whiteSpace: 'nowrap',
                opacity: 0.85,
              }}
            >
              {data.announcement_cta}
            </a>
          )}

          {hasCta && !hasLink && (
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: 800,
              opacity: 0.85,
              whiteSpace: 'nowrap',
            }}>
              {data.announcement_cta}
            </span>
          )}
        </div>

        {/* Dismiss button — far right, absolutely positioned */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="announcement-dismiss"
          style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: colors.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            opacity: 0.7,
            fontSize: '1rem',
            lineHeight: 1,
            padding: 0,
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7' }}
        >
          &#x2715;
        </button>
      </div>
    </div>
  )
}
