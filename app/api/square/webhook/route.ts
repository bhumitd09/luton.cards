import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/square/webhook — STUB, ready to implement alongside
 * lib/payments/square.ts.
 *
 * When implementing Square, this handler must mirror the Stripe webhook's
 * hardening (see app/api/stripe/webhook/route.ts):
 *
 *   1. Verify the `x-square-hmacsha256-signature` header against the raw
 *      body using SQUARE_WEBHOOK_SIGNATURE_KEY + the notification URL
 *      (Square's HMAC-SHA256 scheme). Reject on mismatch.
 *   2. On `payment.updated` (status COMPLETED) or
 *      `order.fulfillment.updated`, resolve our Order by paymentRef (the
 *      payment-link id) or order.referenceId.
 *   3. Verify the paid amount equals Order.total (within 1p) — refuse to
 *      flip on mismatch.
 *   4. Idempotent flip: updateMany({ where: { id, status: 'pending' },
 *      data: { status: 'paid' } }); only decrement stock if count === 1.
 *      Decrement ProductVariant.stock when the line has a variantId, else
 *      Product.stock — identical to the Stripe webhook.
 *
 * Until then it acknowledges receipt so Square doesn't retry-storm, but
 * takes no action.
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json({ received: true, note: 'Square webhook not implemented yet' })
}
