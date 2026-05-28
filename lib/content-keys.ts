/**
 * CMS Content key access rules.
 *
 * Background: the `Content` table is dual-purpose — it stores both the public
 * marketing copy (hero_headline, marquee_items, ethos_*) AND secrets / PII
 * (instagram_access_token, collecttcg_*, contact_submission_*). Before this
 * file, `GET /api/content` with no `?keys=` param dumped the entire table to
 * any anonymous visitor — handing out the IG token and every contact form
 * submission. Fix is a strict allowlist for the public reader plus a denylist
 * for the admin writer (even the inline editor can't accidentally overwrite
 * a secret-looking key from the storefront).
 *
 * Add a new editable key? Append its prefix or exact name to PUBLIC_KEY_ALLOWLIST.
 */

/**
 * Keys (or key prefixes ending in *) that may be returned by the unauthenticated
 * `GET /api/content` endpoint. Anything not listed here is treated as private.
 */
const PUBLIC_KEY_ALLOWLIST = new Set<string>([
  // Hero
  'hero_headline',
  'hero_subtext',
  'hero_cta_text',
  'hero_cta_link',
  'hero_cta2_text',
  'hero_cta2_link',
  // Marquee / global
  'marquee_items',
  'site_tagline',
  'footer_tagline',
  // Instagram (handle + display posts, but NOT the access token)
  'instagram_handle',
  'instagram_posts',
  // Team + about
  'team_members',
  'about_group_photo',
  'about_hero_subtitle',
  'about_story_p1',
  'about_story_p2',
  'about_story_p3',
  'about_story_p4',
  'about_mission_quote',
  'about_cta_body',
  // Ethos strip
  'ethos_label',
  'ethos_headline',
  'ethos_01_title',
  'ethos_01_body',
  'ethos_02_title',
  'ethos_02_body',
  'ethos_03_title',
  'ethos_03_body',
  // Public social URLs (no secrets, just hrefs)
  'social_instagram',
  'social_youtube',
  'social_twitter',
  'social_facebook',
  // Contact page display copy (NOT the contact_submission_* rows — those
  // are private and excluded because they aren't in this allowlist).
  'contact_email',
  'contact_heading',
  'contact_subtext',
])

export function isPublicContentKey(key: string): boolean {
  return PUBLIC_KEY_ALLOWLIST.has(key)
}

/**
 * Returns the subset of `keys` that may be served publicly.
 * Silent filter — non-public keys are dropped without error so attackers
 * can't probe which secret keys exist via response shape.
 */
export function filterPublicKeys(keys: string[]): string[] {
  return keys.filter(isPublicContentKey)
}

/**
 * Patterns matching CMS keys that should NEVER be written via the admin
 * inline editor (even by superadmin). These are managed by their dedicated
 * code paths (`/api/instagram`, CollectTCG settings, contact form ingest)
 * and accidentally overwriting them from the storefront would break things
 * or rotate live secrets to junk.
 */
const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  /^instagram_access_token$/,
  /^instagram_token_/, // refresh dates, etc.
  /^collecttcg_/,
  /^contact_submission_/,
  /_secret$/i,
  /_token$/i,
  /_apikey$/i,
  /_password$/i,
]

export function isSensitiveContentKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some(re => re.test(key))
}
