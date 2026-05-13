import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VALID_GAMES = new Set(['pokemon', 'one-piece'])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const game = searchParams.get('game')
  const featured = searchParams.get('featured')

  try {
    const products = await db.product.findMany({
      where: {
        active: true,
        ...(category && category !== 'all' ? { category } : {}),
        ...(game && VALID_GAMES.has(game) ? { game } : {}),
        ...(featured === 'true' ? { featured: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })
    const normalised = products.map(p => ({ ...p, image: p.images?.[0] || '' }))
    return NextResponse.json(normalised)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = body.name as string
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const game = VALID_GAMES.has(body.game) ? body.game : 'pokemon'
    const product = await db.product.create({
      data: {
        name,
        slug,
        category: body.category,
        game,
        price: Number(body.price),
        stock: Number(body.stock),
        description: body.description || null,
        grade: body.grade || null,
        grader: body.grader || null,
        featured: Boolean(body.featured),
        active: true,
        images: body.images || [],
        tags: body.tags || [],
      },
    })
    return NextResponse.json(product, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 400 })
  }
}
