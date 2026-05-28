import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

/**
 * GET /api/uploads/<key>
 *
 * Public file streaming for the self-hosted Storage driver. Locked down
 * against traversal + content-sniffing XSS:
 *   - URL segments are decoded and concatenated, then any segment that
 *     contains traversal (`..`), null bytes, or backslashes is rejected
 *     before the path even reaches the driver.
 *   - `X-Content-Type-Options: nosniff` stops the browser inferring a
 *     different MIME from the bytes (defence vs the SVG XSS path, even
 *     though we no longer accept SVG uploads).
 *   - Cache-Control immutable because uploaded files are UUID-keyed.
 */

export const dynamic = 'force-dynamic'

function isSafeSegment(segment: string): boolean {
  if (!segment) return false
  if (segment.includes('\0')) return false
  if (segment.includes('\\')) return false
  if (segment === '..' || segment === '.') return false
  if (segment.startsWith('/')) return false
  return true
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const raw = (params.path || []).filter(Boolean)
  if (raw.length === 0) return new NextResponse('Not found', { status: 404 })

  // Decode each segment, then validate. URL decoding happens BEFORE the
  // safety check so encoded ".." (%2E%2E) gets caught too.
  const decoded: string[] = []
  for (const seg of raw) {
    let s: string
    try { s = decodeURIComponent(seg) } catch { return new NextResponse('Bad request', { status: 400 }) }
    if (!isSafeSegment(s)) return new NextResponse('Bad request', { status: 400 })
    decoded.push(s)
  }
  const key = decoded.join('/')

  try {
    const file = await storage().get(key)
    if (!file) return new NextResponse('Not found', { status: 404 })

    const blob = new Blob([file.data as unknown as ArrayBuffer], { type: file.mimeType })
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType,
        'Content-Length': String(file.data.byteLength),
        // Don't let the browser sniff a different MIME from the bytes.
        'X-Content-Type-Options': 'nosniff',
        // Belt-and-braces: even if an attacker uploaded an HTML/SVG (they
        // can't — see /api/admin/upload allowlist) it would NOT execute
        // because of this restrictive CSP.
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    console.error('Upload serve error:', err)
    return new NextResponse('Server error', { status: 500 })
  }
}
