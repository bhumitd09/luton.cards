import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'

// GET /api/admin/media — return all media items ordered by createdAt desc
export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''

    const where = search
      ? { filename: { contains: search, mode: 'insensitive' as const } }
      : {}

    const [items, total] = await Promise.all([
      db.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.media.count({ where }),
    ])

    return NextResponse.json({
      media: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Media GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/media — body: { url, filename, alt?, mimeType?, size? }
// Creates a Media record in DB and returns it
export async function POST(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { url, filename, alt, mimeType, size } = body

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json({ error: 'A valid image URL is required' }, { status: 400 })
    }

    const resolvedFilename = (filename && typeof filename === 'string' && filename.trim())
      ? filename.trim()
      : url.split('/').pop()?.split('?')[0] || 'image'

    const media = await db.media.create({
      data: {
        filename: resolvedFilename,
        url,
        size: typeof size === 'number' ? size : 0,
        mimeType: (mimeType && typeof mimeType === 'string') ? mimeType : 'image/jpeg',
        alt: (alt && typeof alt === 'string' && alt.trim()) ? alt.trim() : null,
      },
    })

    return NextResponse.json(media, { status: 201 })
  } catch (error) {
    console.error('Media POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
