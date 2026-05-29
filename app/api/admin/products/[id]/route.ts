import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { sendBackInStockNotification } from '@/lib/email'
import { isSuperadmin } from '@/lib/vendor-auth'

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const product = await db.product.findUnique({
      where: { id: params.id },
      include: { vendor: { select: { id: true, name: true, email: true } } },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // View permission: superadmin can view any; vendors only their own.
    if (!isSuperadmin(admin) && product.vendorId !== admin.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Tell the client whether the current user can edit so the UI can lock fields.
    const canEdit =
      product.vendorId === admin.userId ||
      (isSuperadmin(admin) && !product.vendorId)

    return NextResponse.json({ product, canEdit })
  } catch (error) {
    console.error('Product GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await db.product.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Ownership: only the owning vendor can edit. Superadmin can adopt
    // orphan products (no vendor) but cannot touch another vendor's stock.
    const isOwner = existing.vendorId === admin.userId
    const isOrphanAdoption = !existing.vendorId && isSuperadmin(admin)
    if (!isOwner && !isOrphanAdoption) {
      return NextResponse.json(
        { error: 'You can only edit your own products' },
        { status: 403 }
      )
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

    const newStock = stock !== undefined ? parseInt(stock, 10) : existing.stock
    const stockTransitionedOOSToIn = existing.stock === 0 && newStock > 0

    // If this is a superadmin adopting an orphan product, set them as the
    // owner now. Otherwise vendorId is preserved (not editable via this route).
    const newVendorId = existing.vendorId ?? admin.userId

    const product = await db.product.update({
      where: { id: params.id },
      data: {
        name: name ?? existing.name,
        slug: resolvedSlug,
        description: description !== undefined ? description : existing.description,
        price: price !== undefined ? parseFloat(price) : existing.price,
        comparePrice: comparePrice !== undefined ? parseFloat(comparePrice) : existing.comparePrice,
        stock: newStock,
        category: category ?? existing.category,
        images: images ?? existing.images,
        grade: grade !== undefined ? grade : existing.grade,
        grader: grader !== undefined ? grader : existing.grader,
        featured: featured !== undefined ? featured : existing.featured,
        active: active !== undefined ? active : existing.active,
        tags: tags ?? existing.tags,
        vendorId: newVendorId,
      },
    })

    // Fire back-in-stock emails to anyone subscribed (fire-and-forget; no await)
    if (stockTransitionedOOSToIn) {
      ;(async () => {
        try {
          const pending = await db.stockNotification.findMany({
            where: { productId: product.id, notifiedAt: null },
          })
          if (pending.length === 0) return

          await Promise.all(
            pending.map(sub =>
              sendBackInStockNotification({
                customerEmail: sub.email,
                productId: product.id,
                productName: product.name,
                productPrice: product.price,
                productImage: product.images?.[0],
              }).catch(err => console.error('Back-in-stock send error:', err))
            )
          )

          // Mark all as notified so they don't get re-emailed on the next stock bump
          await db.stockNotification.updateMany({
            where: { productId: product.id, notifiedAt: null },
            data: { notifiedAt: new Date() },
          })
        } catch (err) {
          console.error('Back-in-stock fan-out failed:', err)
        }
      })()
    }

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
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await db.product.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Same ownership rule as PUT — vendors can only delete their own;
    // superadmin can clean up orphan products.
    const isOwner = existing.vendorId === admin.userId
    const isOrphan = !existing.vendorId && isSuperadmin(admin)
    if (!isOwner && !isOrphan) {
      return NextResponse.json(
        { error: 'You can only delete your own products' },
        { status: 403 }
      )
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
