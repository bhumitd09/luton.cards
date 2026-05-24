import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Public search endpoint.
 *
 *   GET /api/search?q=charizard           — top 8 results (used by header autocomplete)
 *   GET /api/search?q=charizard&full=1    — up to 60 results (used by /search results page)
 *
 * Ranking (simple but effective):
 *   1. Exact name match
 *   2. Name starts with query
 *   3. Name contains query
 *   4. Description / grade / tags contain query
 *
 * All filters respect active=true. Falls back to most-recent if no query.
 */

export const dynamic = 'force-dynamic'

type SearchHit = {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  category: string
  game: string
  grade: string | null
  image: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const full = searchParams.get('full') === '1'
  const limit = full ? 60 : 8

  try {
    if (!q) {
      // No query — return most recent featured/in-stock so the dropdown isn't empty
      const recent = await db.product.findMany({
        where: { active: true, stock: { gt: 0 } },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        select: {
          id: true, name: true, slug: true, price: true, stock: true,
          category: true, game: true, grade: true, images: true,
        },
      })
      return NextResponse.json({
        query: q,
        count: recent.length,
        results: recent.map(toHit),
      })
    }

    // Case-insensitive contains across multiple fields
    const products = await db.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { grade: { contains: q, mode: 'insensitive' } },
          { tags: { has: q.toLowerCase() } },
        ],
      },
      take: limit * 2, // overfetch so client-side ranking has options
      select: {
        id: true, name: true, slug: true, price: true, stock: true,
        category: true, game: true, grade: true, images: true,
      },
    })

    // Rank: exact name > starts with > contains
    const lower = q.toLowerCase()
    const ranked = products
      .map(p => {
        const name = p.name.toLowerCase()
        let score = 0
        if (name === lower) score = 1000
        else if (name.startsWith(lower)) score = 500
        else if (name.includes(lower)) score = 250
        else score = 100
        // Boost in-stock results above out-of-stock
        if (p.stock > 0) score += 50
        return { p, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(x => toHit(x.p))

    return NextResponse.json({
      query: q,
      count: ranked.length,
      results: ranked,
    })
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json({ query: q, count: 0, results: [], error: 'Search failed' }, { status: 500 })
  }
}

function toHit(p: {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  category: string
  game: string
  grade: string | null
  images: string[]
}): SearchHit {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    stock: p.stock,
    category: p.category,
    game: p.game,
    grade: p.grade,
    image: p.images?.[0] || '',
  }
}
