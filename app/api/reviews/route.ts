import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/customer-auth'

/**
 * Public reviews API.
 *
 * GET  /api/reviews                       → approved reviews (legacy: all approved, for homepage)
 * GET  /api/reviews?productId=ID          → approved reviews for a specific product + avg rating
 * GET  /api/reviews?featured=1            → approved + featured only
 *
 * POST /api/reviews → submit a new review (requires login).
 *   Body: { productId, rating, title?, body }
 *   Validates: rating 1-5, body ≥ 8 chars, one per (user, product)
 *   Auto-flags verifiedPurchase=true if user has a shipped/delivered order
 *   containing this product. Starts approved=false; admin moderates.
 */

export const dynamic = 'force-dynamic'

const SHIPPED_STATUSES = ['paid', 'shipped', 'delivered'] as const

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')
  const featured = searchParams.get('featured') === '1'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)

  try {
    const where: Record<string, unknown> = { approved: true }
    if (productId) where.productId = productId
    if (featured) where.featured = true

    const [reviews, agg] = await Promise.all([
      db.review.findMany({
        where,
        orderBy: featured
          ? [{ featured: 'desc' }, { createdAt: 'desc' }]
          : { createdAt: 'desc' },
        take: limit,
        select: {
          id: true, name: true, location: true, rating: true, title: true,
          body: true, verifiedPurchase: true, featured: true, createdAt: true,
          productRef: true,
        },
      }),
      productId
        ? db.review.aggregate({
            where: { approved: true, productId },
            _avg: { rating: true },
            _count: { _all: true },
          })
        : Promise.resolve(null),
    ])

    return NextResponse.json({
      reviews,
      count: agg?._count._all ?? reviews.length,
      avgRating: agg?._avg.rating ?? null,
    })
  } catch (err) {
    console.error('Reviews GET error:', err)
    return NextResponse.json({ reviews: [], count: 0, avgRating: null }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = getCustomerFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'You must be signed in to write a review' }, { status: 401 })

  let body: { productId?: string; rating?: number; title?: string; body?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const productId = body.productId?.trim()
  const rating = Number(body.rating)
  const reviewBody = (body.body || '').trim()
  const title = (body.title || '').trim() || null

  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
  }
  if (reviewBody.length < 8) {
    return NextResponse.json({ error: 'Review must be at least 8 characters' }, { status: 400 })
  }
  if (reviewBody.length > 2000) {
    return NextResponse.json({ error: 'Review too long (max 2000 chars)' }, { status: 400 })
  }

  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, name: true } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // One review per user per product
  const existing = await db.review.findFirst({ where: { userId: auth.userId, productId } })
  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 })
  }

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    select: { name: true, email: true, city: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Verified purchase check: any shipped/delivered/paid order with this productId
  const matchingOrder = await db.order.findFirst({
    where: {
      OR: [{ userId: auth.userId }, { email: user.email }],
      status: { in: Array.from(SHIPPED_STATUSES) },
      items: { some: { productId } },
    },
    select: { id: true },
  })
  const verifiedPurchase = !!matchingOrder

  const review = await db.review.create({
    data: {
      name: user.name || user.email.split('@')[0],
      location: user.city || null,
      rating,
      title,
      body: reviewBody,
      productId,
      productRef: product.name,
      userId: auth.userId,
      verifiedPurchase,
      approved: false,
      featured: false,
    },
  })

  return NextResponse.json({ ok: true, review, verifiedPurchase, pendingModeration: true }, { status: 201 })
}
