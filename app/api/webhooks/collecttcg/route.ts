export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  getCollectTCGSettings,
  fetchCollectTCGProducts,
  syncProducts,
  verifyWebhookSignature,
  type CollectTCGProduct,
} from '@/lib/collecttcg'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // Verify signature. The previous version skipped verification if EITHER
    // the secret OR the signature header was missing — meaning an attacker
    // who found the URL could fire forged product mutations. Now we REQUIRE
    // a configured secret AND a present signature, and reject otherwise.
    const settings = await getCollectTCGSettings()
    const webhookSecret = settings?.webhookSecret || ''
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook secret not configured.' },
        { status: 503 },
      )
    }

    const signatureHeader =
      req.headers.get('x-collecttcg-signature') ||
      req.headers.get('x-hub-signature-256') ||
      req.headers.get('x-signature') ||
      ''
    if (!signatureHeader) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }
    const valid = verifyWebhookSignature(rawBody, signatureHeader, webhookSecret)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let body: { event: string; product?: CollectTCGProduct; signature?: string }
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { event, product } = body

    switch (event) {
      case 'product.updated':
      case 'inventory.updated': {
        if (!product) break
        const slug = `ctcg-${product.id}`
        const existing = await db.product.findFirst({ where: { slug } })
        const data = {
          name: product.name,
          category: (product.category || 'single').toLowerCase(),
          price: typeof product.price === 'number' ? product.price : Number(product.price),
          stock: typeof product.stock === 'number' ? Math.max(0, product.stock) : 0,
          description: product.description || null,
          images: product.images || [],
          grade: product.grade || null,
          grader: product.grader || null,
          tags: product.tags || [],
          featured: product.featured || false,
          active: true,
          comparePrice: product.comparePrice || null,
        }
        if (existing) {
          await db.product.update({ where: { id: existing.id }, data })
        } else {
          await db.product.create({ data: { ...data, slug } })
        }
        break
      }

      case 'product.created': {
        if (!product) break
        const slug = `ctcg-${product.id}`
        const existing = await db.product.findFirst({ where: { slug } })
        if (!existing) {
          await db.product.create({
            data: {
              slug,
              name: product.name,
              category: (product.category || 'single').toLowerCase(),
              price: typeof product.price === 'number' ? product.price : Number(product.price),
              stock: typeof product.stock === 'number' ? Math.max(0, product.stock) : 0,
              description: product.description || null,
              images: product.images || [],
              grade: product.grade || null,
              grader: product.grader || null,
              tags: product.tags || [],
              featured: product.featured || false,
              active: true,
              comparePrice: product.comparePrice || null,
            },
          })
        }
        break
      }

      case 'product.deleted': {
        if (!product) break
        const slug = `ctcg-${product.id}`
        await db.product.updateMany({ where: { slug }, data: { active: false } })
        break
      }

      case 'sync.full': {
        if (!settings) break
        const products = await fetchCollectTCGProducts(settings.apiUrl, settings.apiKey)
        await syncProducts(products)
        break
      }

      default:
        // Unknown event — still acknowledge receipt
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('CollectTCG webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
