'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * PostHog analytics (EU region), proxied through our own domain at /ingest so
 * ad-blockers don't drop events (see the rewrites in next.config.js). Only
 * initialises when NEXT_PUBLIC_POSTHOG_KEY is set, so it's a clean no-op until
 * the key is configured on Railway.
 *
 * Pageviews are captured manually because the App Router is client-navigated
 * (no full reloads) — autocapture of clicks etc. still works automatically.
 */

let initialised = false

function initPostHog() {
  if (initialised || typeof window === 'undefined') return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return
  posthog.init(key, {
    api_host: '/ingest',
    ui_host: 'https://eu.posthog.com',
    capture_pageview: false, // captured manually below for the App Router
    capture_pageleave: true,
    person_profiles: 'identified_only', // only create profiles for logged-in users
    autocapture: true,
  })
  initialised = true
}

function PostHogPageview() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ph = usePostHog()

  useEffect(() => {
    if (!pathname || !ph) return
    let url = window.origin + pathname
    const qs = searchParams?.toString()
    if (qs) url += `?${qs}`
    ph.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams, ph])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog()
  }, [])

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      {children}
    </PHProvider>
  )
}
