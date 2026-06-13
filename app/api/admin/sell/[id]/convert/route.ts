import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

/**
 * Convert an accepted buy-back submission into a DRAFT product (inactive,
 * zero stock) so a vendor can finish listing it. Superadmin only — operates
 * on seller PII and creates owned stock.
 */

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// 'mixed' submissions don't map to a single storefront game — default to pokemon.
function mapGame(game: string): string {
  return game === 'mixed' ? 'pokemon' : game
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isSuperadmin(admin)) {
    return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
  }

  const submission = await db.sellSubmission.findUnique({ where: { id: params.id } })
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const productName = `Buy-back from ${submission.name} — ${submission.game}`
  // Slug must be unique — suffix with a short submission-id fragment to avoid
  // collisions between multiple buy-backs from the same seller/game.
  const slug = `${generateSlug(productName)}-${submission.id.slice(-6)}`

  try {
    const product = await db.product.create({
      data: {
        name: productName,
        slug,
        description: submission.details,
        price: submission.offerAmount ?? 0,
        stock: 0,
        category: 'single',
        game: mapGame(submission.game),
        active: false,
        vendorId: admin.userId,
      },
    })

    await db.sellSubmission.update({
      where: { id: params.id },
      data: { status: 'closed' },
    })

    return NextResponse.json({ productId: product.id })
  } catch {
    return NextResponse.json({ error: 'Could not convert submission' }, { status: 500 })
  }
}
