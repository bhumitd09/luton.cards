import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const source = await db.product.findUnique({ where: { id: params.id } })
  if (!source) {
    return NextResponse.json({ error: 'Source product not found' }, { status: 404 })
  }

  // Find a free slug: original-copy, original-copy-2, original-copy-3...
  const baseName = `${source.name} (Copy)`
  const baseSlug = slugify(baseName)
  let slug = baseSlug
  let suffix = 2
  // Loop is bounded by reasonable retries — slugs are unique-indexed
  // so collision is the only normal exit reason.
  while (await db.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`
    if (suffix > 50) {
      return NextResponse.json({ error: 'Could not find free slug after 50 attempts' }, { status: 500 })
    }
  }

  const duplicate = await db.product.create({
    data: {
      name: baseName,
      slug,
      description: source.description,
      price: source.price,
      comparePrice: source.comparePrice,
      // Stock resets to 0 — duplicates are intentionally drafts you finish
      stock: 0,
      category: source.category,
      game: source.game,
      images: source.images,
      grade: source.grade,
      grader: source.grader,
      // Featured + active reset to false so duplicate doesn't show on storefront until finished
      featured: false,
      active: false,
      tags: source.tags,
    },
  })

  return NextResponse.json({ product: duplicate }, { status: 201 })
}
