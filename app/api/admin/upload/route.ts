import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { storage } from '@/lib/storage'

/**
 * POST /api/admin/upload  (multipart/form-data: { file, prefix? })
 *
 * Admin-only. Streams the uploaded file through the active Storage driver
 * (local/Railway-volume now, S3 later) and saves a Media row for the asset.
 *
 * Returns { url, mediaId } — the URL is wired straight into product images,
 * team photos, etc.
 *
 * SVG is intentionally NOT in the allow list: SVG files can carry inline
 * <script> that would execute when loaded as /api/uploads/.../foo.svg on
 * the same origin as the auth cookie — stored XSS. If we ever need SVG
 * support, sanitize via DOMPurify on upload AND serve from a separate
 * origin with `Content-Security-Policy: sandbox`.
 */

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp',
  'image/gif', 'image/avif',
  // 'image/svg+xml' deliberately removed — see file header.
])

// Constrain admin-supplied `prefix` to a tight charset so it can't escape
// the storage root via traversal or null-byte tricks. Empty / invalid →
// fall back to 'misc'.
const SAFE_PREFIX_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/

export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const filename = (file as File).name ?? `upload-${Date.now()}`
  const mimeType = file.type || 'application/octet-stream'
  const size = file.size

  if (size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large — max ${MAX_BYTES / 1024 / 1024} MB.` },
      { status: 413 }
    )
  }

  if (!ALLOWED_MIME.has(mimeType)) {
    return NextResponse.json(
      { error: `Unsupported file type "${mimeType}". Use JPG, PNG, WebP, GIF, or AVIF.` },
      { status: 415 }
    )
  }

  const rawPrefix = formData.get('prefix')
  const prefixCandidate = typeof rawPrefix === 'string' ? rawPrefix.toLowerCase() : ''
  const prefix = SAFE_PREFIX_RE.test(prefixCandidate) ? prefixCandidate : 'misc'

  // Read into buffer + hand off to storage driver
  const arrayBuffer = await file.arrayBuffer()
  const data = Buffer.from(arrayBuffer)

  let saved: { url: string; key: string }
  try {
    saved = await storage().put({ data, filename, mimeType, prefix })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Storage error'
    console.error('Upload storage error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // Persist a Media row so admin can browse uploaded assets later
  let mediaId: string | null = null
  try {
    const media = await db.media.create({
      data: { url: saved.url, filename, size, mimeType, vendorId: admin.userId },
    })
    mediaId = media.id
  } catch (err) {
    // Non-fatal — file is uploaded, just the DB record is missing
    console.error('Media DB insert failed (non-fatal):', err)
  }

  return NextResponse.json({ url: saved.url, key: saved.key, mediaId }, { status: 201 })
}
