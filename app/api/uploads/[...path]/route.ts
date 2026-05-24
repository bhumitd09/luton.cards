import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

/**
 * GET /api/uploads/<key>
 *
 * Public-facing file streaming endpoint. Hits the active Storage driver
 * (local volume, or future S3) and returns the file with the right
 * Content-Type. Cached aggressively at the CDN since uploads are
 * content-addressed (UUID filenames, never reused).
 */

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const segments = (params.path || []).filter(Boolean)
  if (segments.length === 0) {
    return new NextResponse('Not found', { status: 404 })
  }
  const key = segments.map(s => decodeURIComponent(s)).join('/')

  try {
    const file = await storage().get(key)
    if (!file) {
      return new NextResponse('Not found', { status: 404 })
    }
    // Wrap the Node Buffer in a Blob for the Web Response body
    const blob = new Blob([file.data as unknown as ArrayBuffer], { type: file.mimeType })
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType,
        'Content-Length': String(file.data.byteLength),
        // UUID-filenamed — safe to cache immutably for a year on CDN/browser
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    console.error('Upload serve error:', err)
    return new NextResponse('Server error', { status: 500 })
  }
}
