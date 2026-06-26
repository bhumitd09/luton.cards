import { db } from '@/lib/db'
import { decrementStockForOrderOnce, redeemDiscountByCode } from '@/lib/orders'
import { sendOrderConfirmation, sendAdminSaleNotification } from '@/lib/email'
import { notifyAdmins } from '@/lib/notifications'

/**
 * Mark an order paid — exactly once — and run everything that must happen when
 * money lands: take stock off the shelf, redeem the discount, email the
 * customer + alert the shop. Shared by BOTH the Stripe webhook and the
 * success-page reconciliation backstop, so a missed webhook can't leave a paid
 * order stuck pending, and the two paths can never double-process (the
 * pending→paid flip is a single atomic guard — only the first caller wins).
 *
 * Returns whether THIS call flipped the order, plus the order's status so the
 * caller can surface a "paid but cancelled" reconciliation case.
 */
export async function markOrderPaidOnce(orderId: string): Promise<{ flipped: boolean; status: string }> {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } })
  if (!order) return { flipped: false, status: 'missing' }

  const updated = await db.order.updateMany({
    where: { id: orderId, status: 'pending' },
    data: { status: 'paid' },
  })
  if (updated.count === 0) {
    // Someone/something else already moved it off 'pending'. Benign replay if
    // it's already paid; a real concern if it's cancelled (handled by caller).
    return { flipped: false, status: order.status }
  }

  const ref = order.id.slice(-8).toUpperCase()

  // Stock — idempotent + variant-aware + conditional (never negative). If a
  // line couldn't be decremented we OVERSOLD (took money for stock we don't
  // have): alert loudly so it's refunded/restocked, never shipped blindly.
  try {
    const oversold = await decrementStockForOrderOnce(order.id)
    if (oversold.length) {
      await notifyAdmins({
        type: 'refund',
        title: '⚠️ Oversold — paid item out of stock',
        body: `Order #${ref} took payment for ${oversold.length} item(s) past available stock (${oversold.map(o => o.productName).filter(Boolean).join(', ')}). Refund or restock.`,
        href: '/admin/orders',
      }).catch(() => {})
    }
  } catch (err) {
    console.error('markOrderPaidOnce: stock decrement failed', { orderId, err })
  }

  // Discount: claim the use now it's actually paid (abandoned checkouts never
  // burn a limited-use code). Idempotent flip above guarantees once.
  if (order.discountCode) {
    await redeemDiscountByCode(order.discountCode).catch(err =>
      console.error('markOrderPaidOnce: discount redeem failed', { orderId, err }),
    )
  }

  // Emails + in-app sale alert (best effort — never block the money path).
  try {
    const ids = Array.from(new Set(order.items.map(i => i.productId).filter(Boolean)))
    const imageByProduct = new Map<string, string>()
    if (ids.length) {
      const prods = await db.product.findMany({ where: { id: { in: ids } }, select: { id: true, images: true } })
      for (const p of prods) {
        const first = Array.isArray(p.images) ? p.images.find((u): u is string => typeof u === 'string' && !!u) : undefined
        if (first) imageByProduct.set(p.id, first)
      }
    }
    const emailData = {
      orderId: order.id,
      customerName: order.name,
      customerEmail: order.email,
      items: order.items.map(i => ({
        productName: i.productName,
        quantity: i.quantity,
        price: i.price,
        productImage: imageByProduct.get(i.productId),
      })),
      subtotal: order.total - (order.shippingCost ?? 0) + (order.discountAmount ?? 0),
      shippingCost: order.shippingCost ?? 0,
      discount: order.discountAmount ?? 0,
      total: order.total,
      shippingMethod: order.shippingMethod ?? undefined,
      shippingAddress: [order.shippingLine1, order.shippingCity, order.shippingPostcode].filter(Boolean).join(', '),
    }
    await Promise.allSettled([sendOrderConfirmation(emailData), sendAdminSaleNotification(emailData)])
    await notifyAdmins({
      type: 'sale',
      title: `Sale — £${order.total.toFixed(2)} paid`,
      body: `Order #${ref} · ${order.items.map(i => `${i.quantity}× ${i.productName}`).join(', ')}`,
      href: '/admin/orders',
    }).catch(() => {})
  } catch (err) {
    console.error('markOrderPaidOnce: notifications failed', { orderId, err })
  }

  return { flipped: true, status: 'paid' }
}
