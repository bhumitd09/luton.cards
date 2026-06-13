import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const source = await db.product.findUnique({
    where: { id: params.id },
    include: { variants: true },
  })
  if (!source) {
    return NextResponse.json({ error: 'Source product not found' }, { status: 404 })
  }

  // Vendors can only duplicate their own products. Superadmin can duplicate
  // anything (the copy will be owned by the duplicator either way).
  if (source.vendorId !== admin.userId && !isSuperadmin(admin)) {
    return NextResponse.json(
      { error: 'You can only duplicate your own products' },
      { status: 403 }
    )
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
      // The duplicate is owned by whoever clicked Duplicate, not the original
      // vendor. Lets a superadmin clone an orphan / legacy product into their
      // own catalogue cleanly.
      vendorId: admin.userId,
      // Copy condition variants too (price + foil + sku preserved; stock
      // reset to 0 to match the product-level draft behaviour above).
      ...(source.variants.length > 0
        ? {
            variants: {
              create: source.variants.map(v => ({
                condition: v.condition,
                foil: v.foil,
                price: v.price,
                stock: 0,
                sku: v.sku,
                active: v.active,
              })),
            },
          }
        : {}),
    },
    include: { variants: true },
  })

  return NextResponse.json({ product: duplicate }, { status: 201 })
}
