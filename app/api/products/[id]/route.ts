import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await db.product.findUnique({ where: { id: params.id } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ ...product, image: product.images?.[0] || '' })
  } catch {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const updated = await db.product.update({
      where: { id: params.id },
      data: {
        ...body,
        price: body.price !== undefined ? Number(body.price) : undefined,
        stock: body.stock !== undefined ? Number(body.stock) : undefined,
      },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.product.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
}
