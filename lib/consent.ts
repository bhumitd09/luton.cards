/**
 * Cookie-consent signal shared by the banner and the analytics loaders.
 *
 * Analytics (PostHog + GA) only run after the visitor explicitly accepts —
 * required for UK/GDPR. The banner writes the choice here and broadcasts a
 * `consent-change` event so analytics can start immediately on accept (no
 * reload), and stay off entirely on decline.
 */

export const CONSENT_KEY = 'cookie_consent'
export type Consent = 'accepted' | 'declined' | null

export function getConsent(): Consent {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(CONSENT_KEY)
  return v === 'accepted' || v === 'declined' ? v : null
}

export function setConsent(v: 'accepted' | 'declined'): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, v)
    window.dispatchEvent(new CustomEvent('consent-change', { detail: v }))
  } catch {
    /* storage blocked — nothing to do */
  }
}

/** Subscribe to consent changes (same tab + cross-tab). Returns an unsubscribe. */
export function onConsentChange(cb: (v: Consent) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => cb(getConsent())
  window.addEventListener('consent-change', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('consent-change', handler)
    window.removeEventListener('storage', handler)
  }
}
