import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const product = await db.product.findUnique({ where: { id: params.id } })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Product GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await db.product.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
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
      images,
      grade,
      grader,
      featured,
      active,
      tags,
    } = body

    const resolvedSlug = slug ?? (name ? generateSlug(name) : existing.slug)

    const product = await db.product.update({
      where: { id: params.id },
      data: {
        name: name ?? existing.name,
        slug: resolvedSlug,
        description: description !== undefined ? description : existing.description,
        price: price !== undefined ? parseFloat(price) : existing.price,
        comparePrice: comparePrice !== undefined ? parseFloat(comparePrice) : existing.comparePrice,
        stock: stock !== undefined ? parseInt(stock, 10) : existing.stock,
        category: category ?? existing.category,
        images: images ?? existing.images,
        grade: grade !== undefined ? grade : existing.grade,
        grader: grader !== undefined ? grader : existing.grader,
        featured: featured !== undefined ? featured : existing.featured,
        active: active !== undefined ? active : existing.active,
        tags: tags ?? existing.tags,
      },
    })

    return NextResponse.json({ product })
  } catch (error: unknown) {
    console.error('Product PUT error:', error)
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await db.product.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const hard = searchParams.get('hard') === 'true'

    if (hard) {
      await db.product.delete({ where: { id: params.id } })
      return NextResponse.json({ success: true, deleted: true })
    }

    const product = await db.product.update({
      where: { id: params.id },
      data: { active: false },
    })

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Product DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
