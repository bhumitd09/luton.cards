/**
 * Product categories — single source of truth for the storefront filters, the
 * admin form/filters, and the category badge colours. 'booster' is kept as a
 * recognised LEGACY value (older products) but is no longer offered when
 * adding/editing — new products use 'booster-box' or 'booster-pack'.
 */
export interface ProductCategory {
  value: string
  label: string
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { value: 'single', label: 'Singles' },
  { value: 'graded', label: 'Graded' },
  { value: 'booster-box', label: 'Booster Box' },
  { value: 'booster-pack', label: 'Booster Pack' },
  { value: 'sealed', label: 'Sealed' },
]

export const CATEGORY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  graded: { bg: 'rgba(129,140,248,0.15)', color: '#818cf8', label: 'Graded' },
  single: { bg: 'rgba(236,30,121,0.12)', color: '#EC1E79', label: 'Single' },
  'booster-box': { bg: 'rgba(245,158,11,0.13)', color: '#f59e0b', label: 'Booster Box' },
  'booster-pack': { bg: 'rgba(251,191,36,0.14)', color: '#fbbf24', label: 'Booster Pack' },
  booster: { bg: 'rgba(245,158,11,0.13)', color: '#f59e0b', label: 'Booster' },
  sealed: { bg: 'rgba(52,211,153,0.12)', color: '#34d399', label: 'Sealed' },
}

export function categoryLabel(value: string | null | undefined): string {
  if (!value) return ''
  return CATEGORY_COLORS[value]?.label || value.charAt(0).toUpperCase() + value.slice(1)
}
