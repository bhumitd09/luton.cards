/**
 * HTML / JSON-LD escape helpers. Kept dependency-free — no DOMPurify, no
 * sanitize-html — because every place we use these escapes user-controlled
 * text into a known sink (a text node, an attribute, or a <script type=
 * "application/ld+json"> body), where the rules are mechanical.
 *
 * If we ever render user-controlled HTML (e.g. a rich-text product
 * description), promote to DOMPurify with a tight allowlist.
 */

/**
 * Escape user-controlled text for safe embedding in HTML text content or
 * attribute values. Defends against `<script>`, `"onclick`, etc.
 */
export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return ''
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// U+2028 LINE SEPARATOR and U+2029 PARAGRAPH SEPARATOR. Built via
// String.fromCharCode so the source stays pure ASCII — embedding these
// characters literally in a regex breaks the parser (the file shows them as
// invisible glyphs that look like ordinary spaces).
const LINE_SEPARATOR_RE = new RegExp(String.fromCharCode(0x2028), 'g')
const PARAGRAPH_SEPARATOR_RE = new RegExp(String.fromCharCode(0x2029), 'g')

/**
 * Escape JSON for safe embedding inside a `<script>` tag.
 *
 * `JSON.stringify` alone is NOT safe inside a script tag — the substring
 * `</script>` inside any string field will close the tag and let an attacker
 * inject HTML/JS after it. Convert the risky byte sequences to their Unicode
 * escapes (still valid JSON, no parser changes needed).
 *
 * Also escape U+2028 / U+2029 which JSON allows but JavaScript treats as
 * line terminators (would break the script).
 */
export function escapeJsonForScriptTag(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(LINE_SEPARATOR_RE, '\\u2028')
    .replace(PARAGRAPH_SEPARATOR_RE, '\\u2029')
}
