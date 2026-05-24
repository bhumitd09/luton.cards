import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Format a card grade for display.
 *   formatGrade('7', 'PSA') → 'PSA 7'
 *   formatGrade('PSA 7', 'PSA') → 'PSA 7' (no duplication if grader already in grade)
 *   formatGrade('7', null) → '7'
 *   formatGrade(null, 'PSA') → null
 *   formatGrade(null, null) → null
 *
 * The admin product form stores grader + grade separately. Storefront badges
 * should display them combined ('PSA 7') rather than the bare number.
 */
export function formatGrade(
  grade?: string | null,
  grader?: string | null
): string | null {
  const g = (grade ?? '').trim()
  const gr = (grader ?? '').trim()
  if (!g) return null
  if (!gr) return g
  // Avoid 'PSA PSA 7' if admin typed the grader prefix into the grade field too
  if (g.toLowerCase().startsWith(gr.toLowerCase())) return g
  return `${gr} ${g}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateCardId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
