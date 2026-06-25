import React from 'react'

/** Escape characters that have special meaning inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Highlight every (case-insensitive) occurrence of `query` within `text`.
 *
 * Returns a React node built from an array of strings and <mark> elements —
 * React escapes the text automatically, so this is safe against XSS (no use of
 * dangerouslySetInnerHTML). When `query` is empty or whitespace-only, the plain
 * `text` is returned unchanged.
 *
 *   highlightMatch('Charizard Holo', 'char') → 'Char' wrapped in a pink <mark>,
 *   followed by the literal 'izard Holo'.
 */
export function highlightMatch(text: string, query: string): React.ReactNode {
  const trimmed = query.trim()
  if (!trimmed) return text

  const regex = new RegExp(`(${escapeRegExp(trimmed)})`, 'ig')
  const parts = text.split(regex)

  return parts.map((part, i) =>
    // Odd indices are the captured matches (split keeps the capture group).
    i % 2 === 1 ? (
      <mark
        key={i}
        style={{ background: '#EC1E79', color: '#000', borderRadius: '2px', padding: '0 1px' }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  )
}
