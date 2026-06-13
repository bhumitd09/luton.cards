import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Public read of a single PUBLISHED CMS page by slug. No auth — these are
 * the FAQ / Privacy / Terms / Cookies (and similar) pages anyone can view.
 *
 * Returns 404 when the page does not exist or is unpublished, which lets the
 * public pages fall back to their hardcoded content cleanly.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = String(params.slug || '').toLowerCase()
    if (!slug) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const page = await db.page.findFirst({
      where: { slug, published: true },
      select: { slug: true, title: true, body: true, updatedAt: true },
    })

    if (!page) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Public page GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
