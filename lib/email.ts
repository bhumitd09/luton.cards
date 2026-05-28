// Email sending utility using Resend
// Only sends if RESEND_API_KEY is configured — silently skips if not.
//
// All user-controlled strings (customer names, product names, addresses,
// tracking numbers, carriers) are passed through `escapeHtml` before being
// embedded into the HTML body — otherwise a customer ordering as
// `<img src=x onerror=...>` would inject HTML into every admin notification
// email and the customer's own confirmation.

import { escapeHtml } from '@/lib/html-escape'

export interface OrderEmailData {
  orderId: string
  customerName: string
  customerEmail: string
  items: { productName: string; quantity: number; price: number }[]
  subtotal: number
  shippingCost: number
  discount: number
  total: number
  shippingMethod?: string
  shippingAddress?: string
  trackingNumber?: string
  trackingCarrier?: string
}

function formatPrice(pence: number): string {
  return `£${pence.toFixed(2)}`
}

function buildItemRows(items: OrderEmailData['items']): string {
  return items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">${escapeHtml(item.productName)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:right;">${formatPrice(item.price * item.quantity)}</td>
    </tr>`
    )
    .join('')
}

function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const itemRows = buildItemRows(data.items)
  const discountRow =
    data.discount > 0
      ? `<tr>
          <td colspan="2" style="padding:6px 12px;font-size:13px;color:#666;">Discount</td>
          <td style="padding:6px 12px;font-size:13px;color:#EC1E79;text-align:right;">-${formatPrice(data.discount)}</td>
        </tr>`
      : ''
  const addressBlock = data.shippingAddress
    ? `<div style="margin-top:24px;padding:16px;background:#f9f9f9;border-radius:8px;border:1px solid #eee;">
        <div style="font-size:12px;font-weight:700;color:#999;text-transform:uppercase;margin-bottom:6px;">Shipping Address</div>
        <div style="font-size:14px;color:#333;line-height:1.5;">${escapeHtml(data.shippingAddress).replace(/,\s*/g, '<br>')}</div>
      </div>`
    : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Confirmed</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#EC1E79;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
            <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px;">LUTON CARDS</div>
            <div style="font-size:28px;font-weight:700;color:#fff;margin-top:12px;">Order Confirmed &#10003;</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.85);margin-top:6px;">Order #${data.orderId.slice(-8).toUpperCase()}</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:40px;">
            <p style="font-size:16px;color:#333;margin:0 0 8px 0;">Hi ${escapeHtml(data.customerName)},</p>
            <p style="font-size:15px;color:#555;margin:0 0 28px 0;line-height:1.6;">Thanks for your order &mdash; we&rsquo;ll get it packed up and sent your way.</p>

            <!-- Order table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;border-collapse:collapse;">
              <thead>
                <tr style="background:#f9f9f9;">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Item</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
                  <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
              <tr>
                <td colspan="2" style="padding:6px 12px;font-size:13px;color:#666;">Subtotal</td>
                <td style="padding:6px 12px;font-size:13px;color:#333;text-align:right;">${formatPrice(data.subtotal)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:6px 12px;font-size:13px;color:#666;">Shipping${data.shippingMethod ? ` (${escapeHtml(data.shippingMethod)})` : ''}</td>
                <td style="padding:6px 12px;font-size:13px;color:#333;text-align:right;">${data.shippingCost > 0 ? formatPrice(data.shippingCost) : 'Free'}</td>
              </tr>
              ${discountRow}
              <tr style="border-top:2px solid #eee;">
                <td colspan="2" style="padding:10px 12px;font-size:15px;font-weight:700;color:#111;">Total</td>
                <td style="padding:10px 12px;font-size:15px;font-weight:700;color:#111;text-align:right;">${formatPrice(data.total)}</td>
              </tr>
            </table>

            ${addressBlock}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="font-size:13px;color:#999;margin:0 0 4px 0;">Questions? Email us at <a href="mailto:hello@lutoncards.co.uk" style="color:#EC1E79;text-decoration:none;">hello@lutoncards.co.uk</a></p>
            <p style="font-size:12px;color:#bbb;margin:0;">Luton Cards &mdash; Pok&eacute;mon &amp; One Piece TCG, Luton UK</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildShippingNotificationHtml(data: OrderEmailData): string {
  const tracking = data.trackingNumber ?? ''
  const carrier = (data.trackingCarrier ?? 'Other').trim()

  let trackingLink = ''
  if (carrier.toLowerCase().includes('royal mail')) {
    trackingLink = `https://www.royalmail.com/track-your-item#/tracking-results/${tracking}`
  } else if (carrier.toLowerCase().includes('dpd')) {
    trackingLink = `https://track.dpd.co.uk/search?reference=${tracking}`
  }

  const trackingBlock = trackingLink
    ? `<a href="${trackingLink}" style="display:inline-block;margin-top:12px;padding:12px 24px;background:#EC1E79;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Track Your Parcel &rarr;</a>`
    : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Order Is On Its Way</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#EC1E79;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
            <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px;">LUTON CARDS</div>
            <div style="font-size:28px;font-weight:700;color:#fff;margin-top:12px;">Your order is on its way! &#128230;</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.85);margin-top:6px;">Order #${data.orderId.slice(-8).toUpperCase()}</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:40px;">
            <p style="font-size:16px;color:#333;margin:0 0 8px 0;">Hi ${escapeHtml(data.customerName)},</p>
            <p style="font-size:15px;color:#555;margin:0 0 28px 0;line-height:1.6;">Great news &mdash; your order has been shipped and is on its way to you!</p>

            <!-- Tracking box -->
            <div style="background:#f0fdf9;border:2px solid #EC1E79;border-radius:10px;padding:24px;text-align:center;">
              <div style="font-size:12px;font-weight:700;color:#EC1E79;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Tracking Number</div>
              <div style="font-size:22px;font-weight:900;color:#111;letter-spacing:2px;">${escapeHtml(tracking)}</div>
              <div style="font-size:13px;color:#666;margin-top:6px;">Carrier: ${escapeHtml(carrier)}</div>
              ${trackingBlock}
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="font-size:13px;color:#999;margin:0 0 4px 0;">Questions? Email us at <a href="mailto:hello@lutoncards.co.uk" style="color:#EC1E79;text-decoration:none;">hello@lutoncards.co.uk</a></p>
            <p style="font-size:12px;color:#bbb;margin:0;">Luton Cards &mdash; Pok&eacute;mon &amp; One Piece TCG, Luton UK</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildAdminNotificationHtml(data: OrderEmailData): string {
  // Build the body in plain text and escape ONCE at the end. Safer than
  // remembering to escape every fragment individually.
  const itemLines = data.items
    .map((i) => `  - ${i.productName} x${i.quantity} @ ${formatPrice(i.price)} each`)
    .join('\n')

  const lines = [
    `New order received: #${data.orderId.slice(-8).toUpperCase()}`,
    ``,
    `Customer: ${data.customerName} <${data.customerEmail}>`,
    ``,
    `Items:`,
    itemLines,
    ``,
    `Subtotal: ${formatPrice(data.subtotal)}`,
    `Shipping: ${formatPrice(data.shippingCost)}`,
    data.discount > 0 ? `Discount: -${formatPrice(data.discount)}` : null,
    `Total: ${formatPrice(data.total)}`,
    data.shippingAddress ? `\nShip to: ${data.shippingAddress}` : null,
    data.shippingMethod ? `Method: ${data.shippingMethod}` : null,
  ]
    .filter((l) => l !== null)
    .join('\n')

  const htmlLines = escapeHtml(lines).replace(/\n/g, '<br>')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Order</title></head>
<body style="margin:0;padding:32px;font-family:monospace;font-size:14px;color:#111;background:#fff;line-height:1.8;">
  <div style="white-space:pre-wrap;">${htmlLines}</div>
</body>
</html>`
}

async function sendEmail(payload: {
  from: string
  to: string
  subject: string
  html: string
}): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) return

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('Resend API error:', res.status, text)
  }
}

// In production we refuse to send from the shared Resend test sender
// (looks like phishing and trashes deliverability). EMAIL_FROM and
// ADMIN_EMAIL must be configured explicitly. In dev/test we fall back to
// the test sender so contributors can boot without env config.
//
// Resolved lazily at call time so importing this module never crashes the
// Next build's page-data collection step.
function getFrom(): string {
  const env = process.env.EMAIL_FROM
  if (env) return env
  if (process.env.NODE_ENV === 'production') {
    throw new Error('EMAIL_FROM env var is required in production.')
  }
  return 'onboarding@resend.dev'
}
function getAdminEmail(): string {
  const env = process.env.ADMIN_EMAIL
  if (env) return env
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_EMAIL env var is required in production.')
  }
  return 'admin@lutoncards.co.uk'
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  await sendEmail({
    from: getFrom(),
    to: data.customerEmail,
    subject: `Order confirmed — #${data.orderId.slice(-8).toUpperCase()}`,
    html: buildOrderConfirmationHtml(data),
  })
}

export async function sendAdminOrderNotification(data: OrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  await sendEmail({
    from: getFrom(),
    to: getAdminEmail(),
    subject: `New order #${data.orderId.slice(-8).toUpperCase()} from ${data.customerName}`,
    html: buildAdminNotificationHtml(data),
  })
}

export async function sendShippingNotification(data: OrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  await sendEmail({
    from: getFrom(),
    to: data.customerEmail,
    subject: `Your order is on its way! — #${data.orderId.slice(-8).toUpperCase()}`,
    html: buildShippingNotificationHtml(data),
  })
}

// ─── Back-in-stock notification ────────────────────────────────────────────

export interface BackInStockEmailData {
  customerEmail: string
  productId: string
  productName: string
  productPrice: number
  productImage?: string
}

function buildBackInStockHtml(data: BackInStockEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lutoncards.com'
  const productUrl = `${appUrl}/products/${data.productId}`

  return `<!DOCTYPE html>
<html><body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#f5f5f5;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
    <tr><td style="background:linear-gradient(135deg,#EC1E79 0%,#FF4DA6 100%);padding:28px 32px;text-align:center;">
      <p style="margin:0 0 6px;color:rgba(255,255,255,0.85);font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;">Back in stock</p>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.02em;">It&rsquo;s back. Get it quick.</h1>
    </td></tr>
    <tr><td style="padding:28px 32px;text-align:center;">
      ${data.productImage ? `<img src="${escapeHtml(data.productImage)}" alt="${escapeHtml(data.productName)}" style="max-width:240px;width:100%;height:auto;border-radius:8px;margin-bottom:18px;" />` : ''}
      <h2 style="margin:0 0 8px;color:#111;font-size:18px;font-weight:800;letter-spacing:-0.01em;">${escapeHtml(data.productName)}</h2>
      <p style="margin:0 0 22px;color:#EC1E79;font-size:24px;font-weight:900;letter-spacing:-0.02em;">£${data.productPrice.toLocaleString('en-GB')}</p>
      <a href="${productUrl}" style="display:inline-block;background:linear-gradient(135deg,#EC1E79 0%,#FF4DA6 100%);color:#fff;font-weight:800;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">View product</a>
      <p style="margin:18px 0 0;color:#666;font-size:13px;line-height:1.6;">You asked us to let you know when this came back. Stock can move fast — first to checkout wins.</p>
    </td></tr>
    <tr><td style="background:#fafafa;padding:18px 32px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#999;">
      You’re receiving this because you subscribed to stock alerts on Luton Cards.<br/>
      Luton Cards &mdash; Pok&eacute;mon &amp; One Piece TCG, Luton UK
    </td></tr>
  </table>
</body></html>`
}

export async function sendBackInStockNotification(data: BackInStockEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  await sendEmail({
    from: getFrom(),
    to: data.customerEmail,
    subject: `Back in stock: ${data.productName}`,
    html: buildBackInStockHtml(data),
  })
}
