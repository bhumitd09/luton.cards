'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { getConsent, onConsentChange } from '@/lib/consent'

/**
 * PostHog analytics (EU region), proxied through our own domain at /ingest so
 * ad-blockers don't drop events (see the rewrites in next.config.js).
 *
 *  - Only loads after the visitor ACCEPTS cookies (UK/GDPR) and only when
 *    NEXT_PUBLIC_POSTHOG_KEY is set.
 *  - NEVER tracks the back office: before_send drops any event fired from an
 *    /admin path, and pageviews skip /admin too.
 *  - Pageviews are captured manually (the App Router is client-navigated).
 */

let initialised = false

function isAdminPath(): boolean {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
}

function initPostHog() {
  if (initialised || typeof window === 'undefined') return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return
  posthog.init(key, {
    api_host: '/ingest',
    ui_host: 'https://eu.posthog.com',
    capture_pageview: false, // captured manually below
    capture_pageleave: true,
    person_profiles: 'identified_only',
    autocapture: true,
    // Exclude the back office entirely — drop anything fired from /admin.
    before_send: (event) => (isAdminPath() ? null : event),
  })
  initialised = true
}

function PostHogPageview() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ph = usePostHog()

  useEffect(() => {
    if (!pathname || !ph) return
    if (pathname.startsWith('/admin')) return // never track the back office
    let url = window.origin + pathname
    const qs = searchParams?.toString()
    if (qs) url += `?${qs}`
    ph.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams, ph])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Start only if consent already given; otherwise wait for the banner.
    if (getConsent() === 'accepted') initPostHog()
    const off = onConsentChange((v) => {
      if (v === 'accepted') initPostHog()
    })
    return off
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
