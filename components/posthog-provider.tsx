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

// PostHog project API key. This is a PUBLISHABLE client key (it ships in the
// browser by design and can only ingest events, never read data), so a
// hardcoded fallback is safe — an env var override still wins if set.
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_DbWKjQihnVxdELyXfaqFUsaGnvY6ztu7oTwBDNiHrrZs'

function initPostHog() {
  if (initialised || typeof window === 'undefined') return
  if (!POSTHOG_KEY) return
  posthog.init(POSTHOG_KEY, {
    api_host: '/ingest',                 // proxied to eu.i.posthog.com (dodges ad-blockers)
    ui_host: 'https://eu.posthog.com',
    defaults: '2026-05-30',
    capture_pageview: false, // captured manually below
    capture_pageleave: true,
    person_profiles: 'identified_only',
    autocapture: true,
    // PostHog lazy-loads several add-on bundles from `${api_host}/static/*`
    // (session replay, surveys, web-vitals, dead-clicks). Those proxied asset
    // fetches are blocked by PostHog's own CDN/WAF (the server-side request is
    // 403'd while a direct one passes), so they never loaded — they only
    // spammed the console with 403s. Our dashboard runs on pageviews + custom
    // events (which use a different, working path), so disable the extras.
    // To bring session replay back, the /ingest/static/* proxy needs to stop
    // being blocked upstream (PostHog support / a different asset host).
    disable_session_recording: true,
    disable_surveys: true,
    capture_performance: false,
    capture_dead_clicks: false,
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
