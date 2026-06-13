import type { CheckoutOrder, CheckoutResult, PaymentDriver } from './index'
import { orderLineItems } from './index'

/**
 * Square payment driver — STUB, ready to implement.
 *
 * When you're ready to switch on Square:
 *
 *   1. Install the SDK:        npm i square
 *   2. Set env vars on Railway:
 *        PAYMENT_PROVIDER=square
 *        SQUARE_ACCESS_TOKEN=...        (production access token)
 *        SQUARE_LOCATION_ID=...         (the location to take payment at)
 *        SQUARE_ENVIRONMENT=production  (or 'sandbox' while testing)
 *        SQUARE_WEBHOOK_SIGNATURE_KEY=... (for /api/square/webhook)
 *   3. Implement createCheckout() below using Square's Checkout API
 *      (createPaymentLink). Sketch:
 *
 *        import { Client, Environment } from 'square'
 *        const client = new Client({
 *          accessToken: process.env.SQUARE_ACCESS_TOKEN!,
 *          environment: process.env.SQUARE_ENVIRONMENT === 'sandbox'
 *            ? Environment.Sandbox : Environment.Production,
 *        })
 *        const { result } = await client.checkoutApi.createPaymentLink({
 *          idempotencyKey: order.id,                 // dedupe retries
 *          order: {
 *            locationId: process.env.SQUARE_LOCATION_ID!,
 *            referenceId: order.id,                  // ← maps back to our Order
 *            lineItems: orderLineItems(order).map(li => ({
 *              name: li.name,
 *              quantity: String(li.quantity),
 *              basePriceMoney: { amount: BigInt(Math.round(li.unitPrice * 100)), currency: 'GBP' },
 *            })),
 *            // + a shipping line + discount, mirroring the Stripe driver
 *          },
 *          checkoutOptions: {
 *            redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
 *          },
 *          prePopulatedData: { buyerEmail: order.email },
 *        })
 *        return { url: result.paymentLink!.url!, ref: result.paymentLink!.id! }
 *
 *   4. Implement /api/square/webhook (stub already created): verify the
 *      X-Square-HmacSha256-Signature header with SQUARE_WEBHOOK_SIGNATURE_KEY,
 *      handle `payment.updated` / `order.fulfillment.updated`, look the Order
 *      up by paymentRef (the payment link id) or order.referenceId, verify the
 *      amount matches order.total, then flip status → 'paid' (idempotent
 *      updateMany guard) and decrement stock — exactly like the Stripe webhook.
 *
 * Until implemented, selecting PAYMENT_PROVIDER=square fails loudly at
 * checkout rather than silently doing nothing.
 */
export class SquareDriver implements PaymentDriver {
  readonly name = 'square'

  async createCheckout(order: CheckoutOrder): Promise<CheckoutResult> {
    // Touch the params + helper so they're not flagged unused, and so the
    // intended usage is obvious when implementing.
    void order
    void orderLineItems
    throw new Error(
      'Square payments are not implemented yet. Set PAYMENT_PROVIDER=stripe, ' +
      'or implement lib/payments/square.ts (see the comment block in this file).',
    )
  }
}
