import posthog from 'posthog-js'

/**
 * Thin, crash-proof wrappers around PostHog for custom events. Safe to call
 * even when PostHog isn't configured (no key) — every call is a no-op then.
 * CLIENT-ONLY: only import this from 'use client' components.
 */

export function track(event: string, props?: Record<string, unknown>): void {
  try {
    posthog.capture(event, props)
  } catch {
    /* analytics must never break the app */
  }
}

/** Tie events to a known customer after login. */
export function identify(distinctId: string, props?: Record<string, unknown>): void {
  try {
    posthog.identify(distinctId, props)
  } catch {
    /* no-op */
  }
}

/** Clear the identity on logout so the next visitor is anonymous. */
export function resetAnalytics(): void {
  try {
    posthog.reset()
  } catch {
    /* no-op */
  }
}
