/**
 * Lightweight, zero-friction spam defences for public forms (contact, sell).
 * Layered on top of the per-IP rate limits + same-origin CSRF check.
 *
 *  - Honeypot: a hidden field a real person never sees or fills. Bots that
 *    auto-fill every input trip it.
 *  - Time-trap: humans take a few seconds to fill a form; bots POST instantly.
 *
 * Both are invisible to genuine users. On a hit we DON'T tell the sender —
 * the caller returns a success-shaped response and just doesn't save, so bots
 * believe they succeeded and move on.
 */

// The hidden field name the form renders (and bots fill). Mirrored in the forms.
export const HONEYPOT_FIELD = 'company'

// Minimum time a human plausibly takes to complete + submit a form.
const MIN_SUBMIT_MS = 2500

/** True when the honeypot was filled in (→ almost certainly a bot). */
export function honeypotTripped(body: Record<string, unknown>): boolean {
  const v = body[HONEYPOT_FIELD]
  return typeof v === 'string' && v.trim().length > 0
}

/** True when the form was submitted implausibly fast (→ a bot). Only fires
 *  when we received a sane elapsed value, so a missing field never blocks. */
export function submittedTooFast(body: Record<string, unknown>): boolean {
  const n = Number((body as { elapsedMs?: unknown }).elapsedMs)
  return Number.isFinite(n) && n >= 0 && n < MIN_SUBMIT_MS
}

/** Combined check — true if the submission looks like spam and should be dropped. */
export function looksLikeSpam(body: Record<string, unknown>): boolean {
  return honeypotTripped(body) || submittedTooFast(body)
}
