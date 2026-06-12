/**
 * Card-condition + foil constants used by ProductVariant.
 *
 * The DB stores compact slugs (`near-mint`, `holofoil`) and the UI renders
 * the labels here. Keep these arrays as the single source of truth — both
 * the admin variant editor and the public PDP variant selector import from
 * this file so adding a new condition is a one-line change.
 */

export type ConditionSlug =
  | 'near-mint'
  | 'lightly-played'
  | 'moderately-played'
  | 'heavily-played'
  | 'damaged'

export interface ConditionDef {
  slug: ConditionSlug
  label: string
  short: string // 2-3 char abbreviation, e.g. for compact pills
  /** Hex accent for the pill / button — higher condition = greener. */
  color: string
}

export const CONDITIONS: ConditionDef[] = [
  { slug: 'near-mint',         label: 'Near Mint',         short: 'NM', color: '#10b981' },
  { slug: 'lightly-played',    label: 'Lightly Played',    short: 'LP', color: '#22c55e' },
  { slug: 'moderately-played', label: 'Moderately Played', short: 'MP', color: '#f59e0b' },
  { slug: 'heavily-played',    label: 'Heavily Played',    short: 'HP', color: '#fb923c' },
  { slug: 'damaged',           label: 'Damaged',           short: 'DMG', color: '#ef4444' },
]

const CONDITION_BY_SLUG: Record<string, ConditionDef> =
  Object.fromEntries(CONDITIONS.map(c => [c.slug, c]))

export function conditionLabel(slug: string | null | undefined): string {
  if (!slug) return ''
  return CONDITION_BY_SLUG[slug]?.label ?? slug
}

export function conditionShort(slug: string | null | undefined): string {
  if (!slug) return ''
  return CONDITION_BY_SLUG[slug]?.short ?? slug
}

export function conditionColor(slug: string | null | undefined): string {
  if (!slug) return '#9ca3af'
  return CONDITION_BY_SLUG[slug]?.color ?? '#9ca3af'
}

export function isValidCondition(slug: unknown): slug is ConditionSlug {
  return typeof slug === 'string' && slug in CONDITION_BY_SLUG
}

// ─── Foil / finish ─────────────────────────────────────────────────────────

export type FoilSlug = 'normal' | 'holofoil' | 'reverse-holofoil'

export interface FoilDef {
  slug: FoilSlug
  label: string
}

export const FOILS: FoilDef[] = [
  { slug: 'normal',           label: 'Normal' },
  { slug: 'holofoil',         label: 'Holofoil' },
  { slug: 'reverse-holofoil', label: 'Reverse Holofoil' },
]

const FOIL_BY_SLUG: Record<string, FoilDef> =
  Object.fromEntries(FOILS.map(f => [f.slug, f]))

export function foilLabel(slug: string | null | undefined): string {
  if (!slug || slug === 'normal') return ''
  return FOIL_BY_SLUG[slug]?.label ?? slug
}

export function isValidFoil(slug: unknown): slug is FoilSlug {
  return typeof slug === 'string' && slug in FOIL_BY_SLUG
}

/**
 * Display label for a variant button, e.g. "Moderately Played Holofoil".
 * Foil is omitted when it's 'normal' or null so plain cards stay clean.
 */
export function variantLabel(condition: string | null | undefined, foil: string | null | undefined): string {
  const c = conditionLabel(condition)
  const f = foilLabel(foil)
  return f ? `${c} ${f}` : c
}
