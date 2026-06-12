import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { productListScope, isSuperadmin } from '@/lib/vendor-auth'
import { isValidCondition, isValidFoil } from '@/lib/conditions'

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

interface VariantInput {
  condition?: unknown
  foil?: unknown
  price?: unknown
  stock?: unknown
  sku?: unknown
  active?: unknown
}

interface VariantOut {
  condition: string
  foil: string | null
  price: number
  stock: number
  sku: string | null
  active: boolean
}

/** Thrown on validation failure; the handler catches and returns 400.
 *  Avoids returning a discriminated union (which TS narrowing has been
 *  flaky about in this code path). */
class VariantValidationError extends Error {}

/**
 *   - condition must be one of CONDITIONS slugs
 *   - foil may be one of FOILS slugs or null (defaults to null)
 *   - price + stock coerced to number / int, must be non-negative
 *   - duplicates on (condition, foil) are rejected
 */
function parseVariants(raw: unknown): VariantOut[] {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) throw new VariantValidationError('variants must be an array')
  const seen = new Set<string>()
  const out: VariantOut[] = []
  for (const v of raw as VariantInput[]) {
    if (!v || typeof v !== 'object') throw new VariantValidationError('Each variant must be an object')
    if (!isValidCondition(v.condition)) throw new VariantValidationError('Invalid variant condition')
    const foil = v.foil == null || v.foil === '' ? null : (isValidFoil(v.foil) ? v.foil : null)
    const price = Number(v.price)
    if (!Number.isFinite(price) || price < 0) throw new VariantValidationError('Variant price must be a non-negative number')
    const stock = Number.parseInt(String(v.stock ?? 0), 10)
    if (!Number.isInteger(stock) || stock < 0) throw new VariantValidationError('Variant stock must be a non-negative integer')
    const sku = typeof v.sku === 'string' && v.sku.trim() ? v.sku.trim() : null
    const active = v.active === undefined ? true : !!v.active
    const key = `${v.condition}|${foil ?? ''}`
    if (seen.has(key)) throw new VariantValidationError('Duplicate variant (condition + foil)')
    seen.add(key)
    out.push({ condition: v.condition, foil, price, stock, sku, active })
  }
  return out
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const game = searchParams.get('game')
    const featured = searchParams.get('featured')
    const active = searchParams.get('active')
    const search = searchParams.get('search')
    const vendorFilter = searchParams.get('vendor') // 'mine' | adminUserId | null
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    // Start from ownership-scoped where: vendors see only own; superadmin
    // sees all. Then layer the other filters.
    const where: Record<string, unknown> = { ...productListScope(admin) }

    // Superadmin can additionally narrow by vendor via ?vendor=mine or =<id>
    if (isSuperadmin(admin) && vendorFilter) {
      where.vendorId = vendorFilter === 'mine' ? admin.userId : vendorFilter
    }

    if (category) where.category = category
    if (game && (game === 'pokemon' || game === 'one-piece')) where.game = game
    if (featured !== null && featured !== '') where.featured = featured === 'true'
    if (active !== null && active !== '') where.active = active === 'true'
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          vendor: { select: { id: true, name: true, email: true } },
          variants: { orderBy: [{ condition: 'asc' }, { foil: 'asc' }] },
        },
      }),
      db.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      slug,
      description,
      price,
      comparePrice,
      stock,
      category,
      game,
      images,
      grade,
      grader,
      featured,
      active,
      tags,
      variants, // optional [{ condition, foil?, price, stock, sku?, active? }]
      vendorId, // optional override; only superadmin can assign to someone else
    } = body

    if (!name || price === undefined || !category) {
      return NextResponse.json({ error: 'name, price, and category are required' }, { status: 400 })
    }

    let parsedVariants: VariantOut[]
    try {
      parsedVariants = parseVariants(variants)
    } catch (e) {
      if (e instanceof VariantValidationError) {
        return NextResponse.json({ error: e.message }, { status: 400 })
      }
      throw e
    }

    const resolvedSlug = slug || generateSlug(name)
    const resolvedGame = game === 'one-piece' || game === 'pokemon' ? game : 'pokemon'

    // Vendor assignment: superadmin can assign to another admin via vendorId;
    // everyone else owns what they create.
    const resolvedVendorId =
      isSuperadmin(admin) && typeof vendorId === 'string' && vendorId.length > 0
        ? vendorId
        : admin.userId

    const product = await db.product.create({
      data: {
        name,
        slug: resolvedSlug,
        description: description ?? null,
        price: parseFloat(price),
        comparePrice: comparePrice !== undefined ? parseFloat(comparePrice) : null,
        stock: stock !== undefined ? parseInt(stock, 10) : 0,
        category,
        game: resolvedGame,
        images: images ?? [],
        grade: grade ?? null,
        grader: grader ?? null,
        featured: featured ?? false,
        active: active !== undefined ? active : true,
        tags: tags ?? [],
        vendorId: resolvedVendorId,
        ...(parsedVariants.length > 0
          ? { variants: { create: parsedVariants } }
          : {}),
      },
      include: { variants: true },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error: unknown) {
    console.error('Products POST error:', error)
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
