'use client'

import { useEffect, useRef } from 'react'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/** True when a Turnstile site key is configured (so forms know to require it). */
export const turnstileEnabled = Boolean(SITE_KEY)

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
    }
  }
}

/**
 * Cloudflare Turnstile widget. Renders nothing until NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * is set, so the site works without it. Calls onVerify with the token (or '' on
 * error/expiry, which clears it).
 */
export function Turnstile({ onVerify }: { onVerify: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const rendered = useRef(false)
  const cb = useRef(onVerify)
  cb.current = onVerify

  useEffect(() => {
    if (!SITE_KEY) return
    let cancelled = false

    const render = () => {
      if (cancelled || rendered.current || !ref.current || !window.turnstile) return
      rendered.current = true
      window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        callback: (t: string) => cb.current(t),
        'error-callback': () => cb.current(''),
        'expired-callback': () => cb.current(''),
        theme: 'auto',
      })
    }

    if (window.turnstile) {
      render()
      return () => { cancelled = true }
    }

    const id = 'cf-turnstile-script'
    let s = document.getElementById(id) as HTMLScriptElement | null
    if (!s) {
      s = document.createElement('script')
      s.id = id
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      s.async = true
      s.defer = true
      document.head.appendChild(s)
    }
    s.addEventListener('load', render)
    return () => { cancelled = true; s?.removeEventListener('load', render) }
  }, [])

  if (!SITE_KEY) return null
  return <div ref={ref} style={{ marginTop: '0.25rem' }} />
}
