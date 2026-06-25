import { db } from '@/lib/db'
import { splitLineTotal } from '@/lib/vendor-auth'

/**
 * Shared, server-authoritative order pricing.
 *
 * Both the public checkout (/api/orders) and admin manual-order creation
 * (/api/admin/orders) MUST price orders the same way: the caller supplies
 * only { productId, quantity, variantId? } and every price comes from the
 * live Product/ProductVariant row — never from the request body. Keeping
 * this in one place is what guarantees the two paths can't drift (Critical
 * finding C5).
 */

export interface PriceItemInput {
  productId?: string
  quantity: number
  /** If a specific condition variant was chosen. */
  variantId?: string
}

export interface PricedLine {
  productId: string
  productName: string
  price: number
  quantity: number
  variantId: string | null
  variantCondition: string | null
  variantFoil: string | null
  vendorId: string | null
  commissionRate: number
}

export interface PriceResult {
  lines: PricedLine[]
  subtotal: number
}

/** Thrown by priceOrderLines on any validation failure. Callers map .status
 *  + .message onto the HTTP response. */
export class PricingError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'PricingError'
    this.status = status
  }
}

/**
 * Validate every line against the live catalogue and return trusted pricing.
 * Enforces: every item has a productId, the product is active, a variant is
 * chosen when the product has variants, the variant is active, and there is
 * enough stock. Throws PricingError on any violation.
 */
export async function priceOrderLines(items: PriceItemInput[]): Promise<PriceResult> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new PricingError('Order must contain at least one item')
  }

  const productIds = items
    .map(i => i.productId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
  if (productIds.length !== items.length) {
    throw new PricingError('Every item must have a productId.')
  }

  const products = await db.product.findMany({
    where: { id: { in: productIds }, active: true },
    select: {
      id: true, name: true, price: true, stock: true,
      vendorId: true,
      vendor: { select: { commissionRate: true } },
      variants: { select: { id: true, condition: true, foil: true, price: true, stock: true, active: true } },
    },
  })
  const productById = new Map(products.map(p => [p.id, p]))

  const lines: PricedLine[] = []
  for (const item of items) {
    const qty = Number(item.quantity)
    if (!Number.isInteger(qty) || qty <= 0 || qty > 99) {
      throw new PricingError('Invalid quantity.')
    }
    const p = productById.get(item.productId as string)
    if (!p) {
      throw new PricingError('A product in this order is no longer available.')
    }

    let variantId: string | null = null
    let variantCondition: string | null = null
    let variantFoil: string | null = null
    let unitPrice = p.price
    let availableStock = p.stock

    if (item.variantId) {
      const v = p.variants.find(x => x.id === item.variantId)
      if (!v || !v.active) {
        throw new PricingError(`The selected variant of "${p.name}" is no longer available.`)
      }
      variantId = v.id
      variantCondition = v.condition
      variantFoil = v.foil
      unitPrice = v.price
      availableStock = v.stock
    } else if (p.variants.length > 0) {
      throw new PricingError(`Please choose a condition for "${p.name}".`)
    }

    if (availableStock < qty) {
      throw new PricingError(`Only ${availableStock} of "${p.name}" left in stock.`)
    }

    lines.push({
      productId: p.id,
      productName: p.name,
      price: unitPrice,
      quantity: qty,
      variantId,
      variantCondition,
      variantFoil,
      vendorId: p.vendorId ?? null,
      commissionRate: p.vendor?.commissionRate ?? 0,
    })
  }

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
  return { lines, subtotal }
}

export interface AppliedDiscount {
  id: string
  code: string
  type: string
  value: number
  savings: number
  maxUses: number | null
}

/** Validate a discount code server-side and compute its saving against the
 *  server subtotal. Returns null when the code is missing/invalid. */
export async function applyDiscountCode(
  discountCode: string | undefined | null,
  subtotal: number,
): Promise<AppliedDiscount | null> {
  if (!discountCode || typeof discountCode !== 'string') return null
  const discount = await db.discount.findUnique({
    where: { code: discountCode.trim().toUpperCase() },
  })
  const ok = discount
    && discount.active
    && (!discount.expiresAt || discount.expiresAt > new Date())
    && (discount.maxUses == null || discount.uses < discount.maxUses)
    && (discount.minOrder == null || subtotal >= discount.minOrder)
  if (!ok || !discount) return null

  const savingsRaw = discount.type === 'percentage'
    ? (subtotal * discount.value) / 100
    : discount.value
  return {
    id: discount.id,
    code: discount.code,
    type: discount.type,
    value: discount.value,
    savings: Math.min(savingsRaw, subtotal),
    maxUses: discount.maxUses ?? null,
  }
}

/**
 * Atomically claim one use of a discount, enforcing maxUses at the database
 * level. Returns true if the use was claimed, false if the code is already at
 * its limit. This closes the check-then-act race in applyDiscountCode: a
 * single conditional UPDATE (`WHERE uses < maxUses`) serialises concurrent
 * redemptions so a "single-use" code can never be redeemed twice.
 *
 * Call this BEFORE creating the order; if it returns false, drop the discount
 * and recompute the total without it.
 */
export async function redeemDiscountUse(discount: AppliedDiscount): Promise<boolean> {
  if (discount.maxUses == null) {
    // Unlimited code — just record the use (best-effort, never blocks).
    await db.discount.update({
      where: { id: discount.id },
      data: { uses: { increment: 1 } },
    }).catch(() => {})
    return true
  }
  const res = await db.discount.updateMany({
    where: { id: discount.id, uses: { lt: discount.maxUses } },
    data: { uses: { increment: 1 } },
  })
  return res.count > 0
}

/** Build the Prisma OrderItem.create payloads from priced lines, including
 *  the vendor payout / platform fee split. */
export function buildOrderItemCreates(lines: PricedLine[]) {
  return lines.map(l => {
    const lineTotal = l.price * l.quantity
    const { vendorPayout, platformFee } = splitLineTotal(lineTotal, l.commissionRate)
    return {
      productId: l.productId,
      productName: l.productName,
      price: l.price,
      quantity: l.quantity,
      variantId: l.variantId,
      variantCondition: l.variantCondition,
      variantFoil: l.variantFoil,
      vendorId: l.vendorId,
      vendorPayout,
      platformFee,
    }
  })
}

/**
 * Resolve the AUTHORITATIVE shipping cost from the live ShippingZone/Rate
 * tables — the buyer must not be able to set their own shipping price. Mirrors
 * the public /api/shipping/rates logic so the quote shown at checkout and the
 * amount actually charged come from the same source.
 *
 * - No zones configured at all → 0 (shipping not set up yet; can't charge it).
 * - Zone exists but the chosen method doesn't resolve to an active rate → throw
 *   PricingError(400) so we never silently trust a client number.
 * - Honours freeAbove against the SERVER subtotal.
 *
 * `method` is matched by rate id first, then by name (tolerating the
 * " (FREE)" suffix the rates endpoint appends to free rates).
 */
export async function resolveShippingCost(
  country: string | null | undefined,
  method: string | null | undefined,
  subtotal: number,
): Promise<number> {
  const zones = await db.shippingZone.findMany({
    where: { active: true },
    include: { rates: { where: { active: true } } },
  })
  if (zones.length === 0) return 0

  const dest = (country || 'GB').trim()
  const zone = zones.find(z => z.countries.includes(dest)) || zones.find(z => z.countries.includes('*'))
  if (!zone) throw new PricingError('We do not ship to that country yet.', 400)

  const norm = (s: string) => s.replace(/\s*\(free\)\s*$/i, '').trim().toLowerCase()
  const wanted = norm(method || '')
  const rate = zone.rates.find(r => r.id === method) || zone.rates.find(r => norm(r.name) === wanted)
  if (!rate) throw new PricingError('Please choose a valid shipping option.', 400)

  const free = rate.freeAbove != null && subtotal >= rate.freeAbove
  return free ? 0 : rate.price
}

/** Atomically claim one use of a discount BY CODE (for the webhook, which only
 *  has the order's stored code). Enforces maxUses at the DB level; safe no-op
 *  if the code is gone or already at its limit. */
export async function redeemDiscountByCode(code: string | null | undefined): Promise<void> {
  if (!code) return
  const discount = await db.discount.findUnique({ where: { code: code.trim().toUpperCase() } })
  if (!discount) return
  if (discount.maxUses == null) {
    await db.discount.update({ where: { id: discount.id }, data: { uses: { increment: 1 } } }).catch(() => {})
    return
  }
  await db.discount.updateMany({
    where: { id: discount.id, uses: { lt: discount.maxUses } },
    data: { uses: { increment: 1 } },
  }).catch(() => {})
}

/** Decrement stock for sold lines, variant-aware. Mirrors the Stripe webhook
 *  so manual/admin orders (which have no gateway webhook) keep inventory
 *  accurate. Conditional (`stock >= qty`) so it can't drive stock negative;
 *  returns the lines that could NOT be decremented (oversold / row deleted) so
 *  the caller can surface them instead of silently shipping. */
export async function decrementStockForLines(
  lines: { productId: string; variantId: string | null; quantity: number; productName?: string }[],
): Promise<{ productId: string; variantId: string | null; quantity: number; productName?: string }[]> {
  const failed: typeof lines = []
  for (const l of lines) {
    try {
      if (l.variantId) {
        const res = await db.productVariant.updateMany({
          where: { id: l.variantId, stock: { gte: l.quantity } },
          data: { stock: { decrement: l.quantity } },
        })
        if (res.count === 0) failed.push(l)
      } else if (l.productId) {
        const res = await db.product.updateMany({
          where: { id: l.productId, stock: { gte: l.quantity } },
          data: { stock: { decrement: l.quantity } },
        })
        if (res.count === 0) failed.push(l)
      }
    } catch {
      failed.push(l)
    }
  }
  return failed
}
