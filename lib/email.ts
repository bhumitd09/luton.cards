// Email sending utility using Resend
// Only sends if RESEND_API_KEY is configured — silently skips if not.
//
// All user-controlled strings (customer names, product names, addresses,
// tracking numbers, carriers) are passed through `escapeHtml` before being
// embedded into the HTML body — otherwise a customer ordering as
// `<img src=x onerror=...>` would inject HTML into every admin notification
// email and the customer's own confirmation.

import { escapeHtml } from '@/lib/html-escape'
import { db } from '@/lib/db'

export interface OrderEmailData {
  orderId: string
  customerName: string
  customerEmail: string
  items: { productName: string; quantity: number; price: number; productImage?: string }[]
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

// ─── Shared dark-mode email shell ──────────────────────────────────────────
// Every customer email uses one template: a black canvas, the centred Luton
// Cards logo, a pink accent bar, a dark rounded card, and a muted footer.
// Inline styles only (clients ignore <style>); bgcolor attributes back up the
// gradients for Outlook's Word engine.

function appBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://lutoncards.com').replace(/\/+$/, '')
}

const DEFAULT_BAR = 'linear-gradient(90deg,#EC1E79 0%,#FF4DA6 100%)'

function emailShell(opts: {
  title: string
  content: string
  preheader?: string
  accentColor?: string
  accentBar?: string
}): string {
  const logo = `${appBase()}/logo/luton-cards.png`
  const bar = opts.accentBar || DEFAULT_BAR
  const barColor = opts.accentColor || '#EC1E79'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#050505;font-size:1px;line-height:1px;">${escapeHtml(opts.preheader)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#050505" style="background:#050505;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">

        <tr><td align="center" style="padding:8px 0 26px;">
          <img src="${logo}" alt="Luton Cards" height="78" style="height:78px;width:auto;display:block;border:0;outline:none;text-decoration:none;" />
        </td></tr>

        <tr><td bgcolor="#0f0f10" style="background:#0f0f10;border:1px solid #202022;border-radius:16px;overflow:hidden;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td bgcolor="${barColor}" style="height:4px;line-height:4px;font-size:4px;background:${bar};">&nbsp;</td></tr>
            <tr><td style="padding:36px 36px 32px;">
              ${opts.content}
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding:24px 16px 8px;">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">Questions? Email <a href="mailto:hello@lutoncards.co.uk" style="color:#EC1E79;text-decoration:none;">hello@lutoncards.co.uk</a></p>
          <p style="margin:0;font-size:11px;color:#52525b;">Luton Cards · Pok&eacute;mon &amp; One Piece TCG · Luton, UK</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function eyebrow(text: string, color = '#EC1E79'): string {
  return `<p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${color};">${escapeHtml(text)}</p>`
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 4px;font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#f4f4f5;line-height:1.25;">${escapeHtml(text)}</h1>`
}

function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 2px;"><tr>
    <td bgcolor="#EC1E79" style="border-radius:11px;background:${DEFAULT_BAR};">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 30px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:11px;">${escapeHtml(label)}</a>
    </td></tr></table>`
}

function addressBlock(address: string): string {
  return `<div style="margin-top:18px;background:#161617;border:1px solid #202022;border-radius:12px;padding:16px 18px;">
    <div style="font-size:11px;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Shipping to</div>
    <div style="font-size:14px;color:#e4e4e7;line-height:1.6;">${escapeHtml(address).replace(/,\s*/g, '<br>')}</div>
  </div>`
}

// Resolve a (possibly relative) stored image path to an absolute URL email
// clients can load.
function absUrl(src: string): string {
  return /^https?:\/\//i.test(src) ? src : `${appBase()}${src.startsWith('/') ? '' : '/'}${src}`
}

function buildItemRows(items: OrderEmailData['items']): string {
  return items
    .map((item) => {
      const thumb = item.productImage
        ? `<img src="${escapeHtml(absUrl(item.productImage))}" width="44" height="44" alt="" style="width:44px;height:44px;border-radius:8px;border:1px solid #2a2a2c;object-fit:cover;display:block;" />`
        : `<div style="width:44px;height:44px;border-radius:8px;border:1px solid #2a2a2c;background:#1a1a1c;"></div>`
      return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1a1a1c;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;" valign="middle">${thumb}</td>
          <td valign="middle" style="font-size:14px;color:#e4e4e7;line-height:1.4;">${escapeHtml(item.productName)}</td>
        </tr></table>
      </td>
      <td style="padding:12px 10px;border-bottom:1px solid #1a1a1c;font-size:14px;color:#9ca3af;text-align:center;white-space:nowrap;" valign="middle">&times;${item.quantity}</td>
      <td style="padding:12px 0;border-bottom:1px solid #1a1a1c;font-size:14px;color:#f4f4f5;text-align:right;font-weight:600;white-space:nowrap;" valign="middle">${formatPrice(item.price * item.quantity)}</td>
    </tr>`
    })
    .join('')
}

// The order summary card: items + totals inside one dark rounded box. Shared
// by the customer confirmation and the admin notification.
function buildOrderTable(data: OrderEmailData): string {
  const shippingLabel = `Shipping${data.shippingMethod ? ` (${escapeHtml(data.shippingMethod)})` : ''}`
  const shippingVal = data.shippingCost > 0 ? formatPrice(data.shippingCost) : 'Free'
  const discountRow =
    data.discount > 0
      ? `<tr><td colspan="2" style="padding:5px 0;font-size:13px;color:#9ca3af;">Discount</td><td style="padding:5px 0;font-size:13px;text-align:right;color:#FF4DA6;">-${formatPrice(data.discount)}</td></tr>`
      : ''
  return `<div style="background:#161617;border:1px solid #202022;border-radius:12px;padding:4px 18px 14px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead><tr>
        <th align="left" style="padding:12px 0 10px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #202022;">Item</th>
        <th align="center" style="padding:12px 10px 10px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #202022;">Qty</th>
        <th align="right" style="padding:12px 0 10px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #202022;">Price</th>
      </tr></thead>
      <tbody>${buildItemRows(data.items)}</tbody>
      <tfoot>
        <tr><td colspan="2" style="padding:14px 0 5px;font-size:13px;color:#9ca3af;">Subtotal</td><td style="padding:14px 0 5px;font-size:13px;text-align:right;color:#e4e4e7;">${formatPrice(data.subtotal)}</td></tr>
        <tr><td colspan="2" style="padding:5px 0;font-size:13px;color:#9ca3af;">${shippingLabel}</td><td style="padding:5px 0;font-size:13px;text-align:right;color:#e4e4e7;">${shippingVal}</td></tr>
        ${discountRow}
        <tr><td colspan="2" style="padding:12px 0 4px;font-size:15px;font-weight:800;color:#f4f4f5;border-top:1px solid #202022;">Total</td><td style="padding:12px 0 4px;font-size:15px;font-weight:800;text-align:right;color:#f4f4f5;border-top:1px solid #202022;">${formatPrice(data.total)}</td></tr>
      </tfoot>
    </table>
  </div>`
}

function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const ref = data.orderId.slice(-8).toUpperCase()
  const content = `
    ${eyebrow('Order confirmed')}
    ${heading(`Thanks, ${data.customerName}!`)}
    <p style="margin:0;font-size:13px;color:#6b7280;">Order #${ref}</p>
    <p style="margin:18px 0 22px;font-size:15px;line-height:1.7;color:#a1a1aa;">We've got your order and we're packing it up. Here's what's on the way:</p>
    ${buildOrderTable(data)}
    ${data.shippingAddress ? addressBlock(data.shippingAddress) : ''}
    ${ctaButton(`${appBase()}/products`, 'Browse more cards')}`
  return emailShell({
    title: 'Order confirmed',
    preheader: `Order #${ref} confirmed — thanks for shopping with Luton Cards.`,
    content,
  })
}

function buildShippingNotificationHtml(data: OrderEmailData): string {
  const tracking = data.trackingNumber ?? ''
  const carrier = (data.trackingCarrier ?? 'Other').trim()

  let trackingLink = ''
  if (carrier.toLowerCase().includes('royal mail')) {
    trackingLink = `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(tracking)}`
  } else if (carrier.toLowerCase().includes('dpd')) {
    trackingLink = `https://track.dpd.co.uk/search?reference=${encodeURIComponent(tracking)}`
  }

  const ref = data.orderId.slice(-8).toUpperCase()
  const trackBox = tracking
    ? `<div style="background:#161617;border:1px solid #202022;border-radius:12px;padding:24px;text-align:center;">
        <div style="font-size:11px;font-weight:800;color:#EC1E79;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px;">Tracking number</div>
        <div style="font-size:22px;font-weight:800;color:#f4f4f5;letter-spacing:0.06em;word-break:break-all;">${escapeHtml(tracking)}</div>
        <div style="font-size:13px;color:#9ca3af;margin-top:8px;">via ${escapeHtml(carrier)}</div>
      </div>`
    : `<div style="background:#161617;border:1px solid #202022;border-radius:12px;padding:20px;text-align:center;font-size:14px;color:#9ca3af;">Your parcel is on its way via ${escapeHtml(carrier)}.</div>`

  const content = `
    ${eyebrow('Shipped')}
    ${heading('Your order is on its way')}
    <p style="margin:0;font-size:13px;color:#6b7280;">Order #${ref}</p>
    <p style="margin:18px 0 22px;font-size:15px;line-height:1.7;color:#a1a1aa;">Hi ${escapeHtml(data.customerName)}, good news, your cards have left the building.</p>
    ${trackBox}
    ${trackingLink ? ctaButton(trackingLink, 'Track your parcel') : ''}`
  return emailShell({
    title: 'Your order is on its way',
    preheader: `Order #${ref} has shipped via ${carrier}.`,
    content,
  })
}

function buildAdminNotificationHtml(data: OrderEmailData): string {
  const ref = data.orderId.slice(-8).toUpperCase()
  const content = `
    ${eyebrow('New order')}
    ${heading(`Order #${ref}`)}
    <p style="margin:16px 0 22px;font-size:15px;line-height:1.7;color:#a1a1aa;">From <strong style="color:#f4f4f5;">${escapeHtml(data.customerName)}</strong> &lt;<a href="mailto:${escapeHtml(data.customerEmail)}" style="color:#EC1E79;text-decoration:none;">${escapeHtml(data.customerEmail)}</a>&gt;</p>
    ${buildOrderTable(data)}
    ${data.shippingAddress ? addressBlock(data.shippingAddress) : ''}
    ${ctaButton(`${appBase()}/admin/orders`, 'Open in admin')}`
  return emailShell({
    title: `New order #${ref}`,
    preheader: `New order from ${data.customerName} — ${formatPrice(data.total)}`,
    content,
  })
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
    // Surface a concise, human reason so callers (e.g. the "Send test"
    // button) can tell the admin WHY it failed — usually an unverified
    // sending domain. Resend returns JSON like {"message":"..."}.
    let reason = text
    try { reason = JSON.parse(text)?.message || text } catch { /* keep raw text */ }
    throw new Error(reason || `Email provider returned ${res.status}`)
  }
}

// The "From" + admin recipient resolve from the Settings UI first (the
// `email_from_address` / `contact_email` Content rows the admin saves), then
// fall back to the EMAIL_FROM / ADMIN_EMAIL env vars, then a dev-only test
// sender. This is what makes Settings → Email actually take effect; without
// it the saved address was cosmetic. Resolved lazily at call time so importing
// this module never touches the DB during the Next build.
async function contentValue(key: string): Promise<string | null> {
  try {
    const row = await db.content.findUnique({ where: { key }, select: { value: true } })
    const v = row?.value?.trim()
    return v && v.length > 0 ? v : null
  } catch {
    return null
  }
}

async function getFrom(): Promise<string> {
  const saved = await contentValue('email_from_address')
  if (saved) return saved
  const env = process.env.EMAIL_FROM
  if (env) return env
  if (process.env.NODE_ENV === 'production') {
    throw new Error('No sender address is set. Add one in Settings → Email (or set the EMAIL_FROM env var).')
  }
  return 'onboarding@resend.dev'
}
async function getAdminEmail(): Promise<string> {
  const env = process.env.ADMIN_EMAIL
  if (env) return env
  const saved = await contentValue('contact_email')
  if (saved) return saved
  if (process.env.NODE_ENV === 'production') {
    throw new Error('No admin recipient is set. Set the contact email in Settings (or the ADMIN_EMAIL env var).')
  }
  return 'admin@lutoncards.co.uk'
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  await sendEmail({
    from: await getFrom(),
    to: data.customerEmail,
    subject: `Order confirmed: #${data.orderId.slice(-8).toUpperCase()}`,
    html: buildOrderConfirmationHtml(data),
  })
}

export async function sendAdminOrderNotification(data: OrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  await sendEmail({
    from: await getFrom(),
    to: await getAdminEmail(),
    subject: `New order #${data.orderId.slice(-8).toUpperCase()} from ${data.customerName}`,
    html: buildAdminNotificationHtml(data),
  })
}

// Fires when a card actually SELLS (payment captured) — distinct from the
// "new order placed" notification, which goes out at checkout before payment.
function buildAdminSaleHtml(data: OrderEmailData): string {
  const ref = data.orderId.slice(-8).toUpperCase()
  const content = `
    ${eyebrow('Payment received', '#10b981')}
    ${heading(`Cha-ching! ${formatPrice(data.total)} paid`)}
    <p style="margin:16px 0 22px;font-size:15px;line-height:1.7;color:#a1a1aa;">Order #${ref} from <strong style="color:#f4f4f5;">${escapeHtml(data.customerName)}</strong> has been paid. Time to pack it up.</p>
    ${buildOrderTable(data)}
    ${data.shippingAddress ? addressBlock(data.shippingAddress) : ''}
    ${ctaButton(`${appBase()}/admin/orders`, 'Open in admin')}`
  return emailShell({
    title: `Sale: order #${ref} paid`,
    preheader: `${data.customerName} just paid ${formatPrice(data.total)} — order #${ref}.`,
    content,
    accentColor: '#10b981',
    accentBar: 'linear-gradient(90deg,#10b981 0%,#34d399 100%)',
  })
}

export async function sendAdminSaleNotification(data: OrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  await sendEmail({
    from: await getFrom(),
    to: await getAdminEmail(),
    subject: `💸 Sale: order #${data.orderId.slice(-8).toUpperCase()} paid — ${formatPrice(data.total)}`,
    html: buildAdminSaleHtml(data),
  })
}

export async function sendShippingNotification(data: OrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  await sendEmail({
    from: await getFrom(),
    to: data.customerEmail,
    subject: `Your order is on its way! #${data.orderId.slice(-8).toUpperCase()}`,
    html: buildShippingNotificationHtml(data),
  })
}

// ─── Delivered + Cancelled (status-transition emails) ──────────────────────

function buildSimpleStatusHtml(opts: {
  orderId: string
  customerName: string
  heading: string
  eyebrow: string
  body: string
  accentColor: string
  accentBar: string
}): string {
  const ref = opts.orderId.slice(-8).toUpperCase()
  const content = `
    ${eyebrow(opts.eyebrow, opts.accentColor)}
    ${heading(opts.heading)}
    <p style="margin:0;font-size:13px;color:#6b7280;">Order #${ref}</p>
    <p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:#a1a1aa;">Hi ${escapeHtml(opts.customerName)},</p>
    <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#a1a1aa;">${escapeHtml(opts.body)}</p>`
  return emailShell({
    title: opts.heading,
    preheader: opts.body.slice(0, 90),
    content,
    accentColor: opts.accentColor,
    accentBar: opts.accentBar,
  })
}

export async function sendDeliveredNotification(data: OrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  await sendEmail({
    from: await getFrom(),
    to: data.customerEmail,
    subject: `Delivered: #${data.orderId.slice(-8).toUpperCase()}`,
    html: buildSimpleStatusHtml({
      orderId: data.orderId,
      customerName: data.customerName,
      eyebrow: 'Delivered',
      heading: 'Your order has landed.',
      body: 'Your order has been marked as delivered. We hope the cards are everything you wanted. If anything is not right, just reply and we will sort it.',
      accentColor: '#10b981',
      accentBar: 'linear-gradient(90deg,#10b981 0%,#34d399 100%)',
    }),
  })
}

export async function sendOrderCancelledNotification(data: OrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  await sendEmail({
    from: await getFrom(),
    to: data.customerEmail,
    subject: `Order cancelled: #${data.orderId.slice(-8).toUpperCase()}`,
    html: buildSimpleStatusHtml({
      orderId: data.orderId,
      customerName: data.customerName,
      eyebrow: 'Cancelled',
      heading: 'Your order was cancelled.',
      body: 'This order has been cancelled. If you paid, a refund will follow to your original payment method. If this was a mistake or you have any questions, just reply to this email.',
      accentColor: '#9ca3af',
      accentBar: 'linear-gradient(90deg,#6b7280 0%,#9ca3af 100%)',
    }),
  })
}

// ─── Refund confirmation (customer) ─────────────────────────────────────────

export interface RefundEmailData {
  orderId: string
  customerName: string
  customerEmail: string
  amount: number
  reason?: string
  fullyRefunded: boolean
}

export async function sendRefundNotification(data: RefundEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const ref = data.orderId.slice(-8).toUpperCase()
  const reasonBlock = data.reason
    ? `<div style="margin-top:18px;background:#161617;border:1px solid #202022;border-radius:12px;padding:16px 18px;">
        <div style="font-size:11px;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Reason</div>
        <div style="font-size:14px;color:#e4e4e7;line-height:1.6;">${escapeHtml(data.reason)}</div>
      </div>`
    : ''
  const content = `
    ${eyebrow('Refund processed')}
    ${heading(data.fullyRefunded ? 'Your refund is on its way' : 'A partial refund is on its way')}
    <p style="margin:0;font-size:13px;color:#6b7280;">Order #${ref}</p>
    <p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:#a1a1aa;">Hi ${escapeHtml(data.customerName)}, we're sorry this one didn't work out. We've refunded <strong style="color:#f4f4f5;">${formatPrice(data.amount)}</strong> to your original payment method${data.fullyRefunded ? '' : ' (a partial refund on this order)'}. It can take 5–10 working days to land, depending on your bank.</p>
    ${reasonBlock}
    <p style="margin:20px 0 0;font-size:15px;line-height:1.7;color:#a1a1aa;">Apologies for any inconvenience — if there's anything else we can help with, just reply to this email and we'll sort it.</p>`
  await sendEmail({
    from: await getFrom(),
    to: data.customerEmail,
    subject: `Refund processed: order #${ref}`,
    html: emailShell({
      title: 'Refund processed',
      preheader: `We've refunded ${formatPrice(data.amount)} for order #${ref}.`,
      content,
    }),
  })
}

/**
 * Fires the right customer email for a status transition, exactly once.
 * Called after an order's status is changed (single update or bulk). No-ops
 * when the status didn't actually change, or for statuses with no email
 * (pending / paid — the order confirmation already went out at creation).
 */
type StatusEmailOrder = {
  id: string
  name: string
  email: string
  total: number
  shippingCost: number | null
  trackingNumber: string | null
  trackingCarrier: string | null
  status: string
  items: { productName: string; quantity: number; price: number }[]
}

export async function sendStatusTransitionEmail(prevStatus: string, order: StatusEmailOrder): Promise<void> {
  if (prevStatus === order.status) return
  const base = {
    orderId: order.id,
    customerName: order.name,
    customerEmail: order.email,
    items: order.items.map(i => ({ productName: i.productName, quantity: i.quantity, price: i.price })),
    subtotal: order.total,
    shippingCost: order.shippingCost ?? 0,
    discount: 0,
    total: order.total,
  }
  switch (order.status) {
    case 'shipped':
      await sendShippingNotification({
        ...base,
        trackingNumber: order.trackingNumber ?? undefined,
        trackingCarrier: order.trackingCarrier ?? 'Other',
      })
      break
    case 'delivered':
      await sendDeliveredNotification(base)
      break
    case 'cancelled':
      await sendOrderCancelledNotification(base)
      break
    default:
      // 'pending' / 'paid' → no transactional email (confirmation already sent)
      break
  }
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
  const productUrl = `${appBase()}/products/${data.productId}`
  const img = data.productImage
    ? `<div align="center" style="margin:6px 0 20px;"><img src="${escapeHtml(data.productImage)}" alt="${escapeHtml(data.productName)}" width="220" style="width:220px;max-width:100%;height:auto;border-radius:12px;border:1px solid #202022;display:inline-block;" /></div>`
    : ''
  const content = `
    ${eyebrow('Back in stock')}
    ${heading("It's back. Grab it quick.")}
    <p style="margin:18px 0 4px;font-size:15px;line-height:1.7;color:#a1a1aa;">The card you wanted just landed back in stock.</p>
    ${img}
    <div style="text-align:center;">
      <div style="font-size:18px;font-weight:800;color:#f4f4f5;margin:0 0 4px;">${escapeHtml(data.productName)}</div>
      <div style="font-size:26px;font-weight:900;color:#FF4DA6;letter-spacing:-0.02em;">£${data.productPrice.toLocaleString('en-GB')}</div>
    </div>
    <div align="center">${ctaButton(productUrl, 'View product')}</div>
    <p style="margin:18px 0 0;font-size:13px;color:#6b7280;line-height:1.6;text-align:center;">You asked us to let you know when this came back. Stock can move fast, first to checkout wins.</p>`
  return emailShell({
    title: 'Back in stock',
    preheader: `${data.productName} is back in stock at Luton Cards.`,
    content,
  })
}

export async function sendBackInStockNotification(data: BackInStockEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  await sendEmail({
    from: await getFrom(),
    to: data.customerEmail,
    subject: `Back in stock: ${data.productName}`,
    html: buildBackInStockHtml(data),
  })
}

// ─── Buy-back offer (sell-back) ────────────────────────────────────────────

export interface BuybackOfferEmailData {
  to: string
  sellerName: string
  offerAmount: number
  details?: string
}

function buildBuybackOfferHtml(data: BuybackOfferEmailData): string {
  const amount = `£${data.offerAmount.toLocaleString('en-GB')}`
  const detailsBlock = data.details
    ? `<div style="margin-top:20px;background:#161617;border:1px solid #202022;border-radius:12px;padding:16px 18px;">
        <div style="font-size:11px;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">What you sent us</div>
        <div style="font-size:14px;color:#e4e4e7;line-height:1.6;white-space:pre-wrap;">${escapeHtml(data.details)}</div>
      </div>`
    : ''
  const content = `
    ${eyebrow('Buy-back offer')}
    ${heading(`We'd like to offer ${amount}`)}
    <p style="margin:18px 0 22px;font-size:15px;line-height:1.7;color:#a1a1aa;">Hi ${escapeHtml(data.sellerName)}, thanks for sending your cards to Luton Cards. We've reviewed your submission and here's our offer:</p>
    <div style="background:#161617;border:1px solid #2a1622;border-radius:14px;padding:26px;text-align:center;">
      <div style="font-size:11px;font-weight:800;color:#EC1E79;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:8px;">Our offer</div>
      <div style="font-size:36px;font-weight:900;color:#f4f4f5;letter-spacing:-0.02em;">${amount}</div>
    </div>
    ${detailsBlock}
    <p style="margin:22px 0 0;font-size:15px;line-height:1.7;color:#a1a1aa;">Happy with it? Just <strong style="color:#f4f4f5;">reply to this email to accept</strong> and we'll sort the next steps. Any questions, reply here too.</p>`
  return emailShell({
    title: 'Your Luton Cards offer',
    preheader: `We'd like to offer ${amount} for your cards.`,
    content,
  })
}

export async function sendBuybackOfferEmail(data: BuybackOfferEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  await sendEmail({
    from: await getFrom(),
    to: data.to,
    subject: `Your Luton Cards offer: £${data.offerAmount.toLocaleString('en-GB')}`,
    html: buildBuybackOfferHtml(data),
  })
}

// ─── Low-stock alert (admin) ───────────────────────────────────────────────

export interface LowStockAlertData {
  threshold: number
  outOfStock: number
  low: number
  products: { name: string; game: string; category: string; stock: number }[]
}

export function buildLowStockHtml(data: LowStockAlertData): string {
  const headCell = 'padding:12px 0 10px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #202022;'
  const rows = data.products
    .map((p) => {
      const color = p.stock === 0 ? '#ef4444' : '#f59e0b'
      const gameLabel = p.game === 'one-piece' ? 'One Piece' : 'Pokémon'
      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #1a1a1c;font-size:14px;color:#e4e4e7;font-weight:600;">${escapeHtml(p.name)}</td>
        <td style="padding:12px 10px;border-bottom:1px solid #1a1a1c;font-size:12px;color:#9ca3af;text-transform:capitalize;">${escapeHtml(gameLabel)} · ${escapeHtml(p.category)}</td>
        <td style="padding:12px 0;border-bottom:1px solid #1a1a1c;font-size:13px;font-weight:800;color:${color};text-align:right;white-space:nowrap;">${p.stock === 0 ? 'Out' : p.stock}</td>
      </tr>`
    })
    .join('')
  const content = `
    ${eyebrow('Stock alert', '#f59e0b')}
    ${heading('Time to restock')}
    <p style="margin:0;font-size:13px;color:#6b7280;">${data.outOfStock} out of stock · ${data.low} low (≤${data.threshold})</p>
    <p style="margin:18px 0 18px;font-size:15px;line-height:1.7;color:#a1a1aa;">These products need restocking:</p>
    <div style="background:#161617;border:1px solid #202022;border-radius:12px;padding:4px 18px 10px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <thead><tr>
          <th align="left" style="${headCell}">Product</th>
          <th align="left" style="${headCell}">Category</th>
          <th align="right" style="${headCell}">Stock</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${ctaButton(`${appBase()}/admin/products?stock=out`, 'Manage products')}`
  return emailShell({
    title: 'Stock alert',
    preheader: `${data.outOfStock} out of stock, ${data.low} low at Luton Cards.`,
    content,
    accentColor: '#f59e0b',
    accentBar: 'linear-gradient(90deg,#f59e0b 0%,#fbbf24 100%)',
  })
}

// ─── Password reset ────────────────────────────────────────────────────────

export interface PasswordResetEmailData {
  to: string
  name?: string | null
  resetUrl: string
  /** Minutes until the link expires, for the copy. */
  expiresInMinutes: number
}

// ─── Email verification ────────────────────────────────────────────────────

export interface EmailVerificationData {
  to: string
  name?: string | null
  verifyUrl: string
  /** Hours until the link expires, for the copy. */
  expiresInHours: number
}

export async function sendEmailVerification(data: EmailVerificationData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const content = `
    ${eyebrow('Verify your email')}
    ${heading('Confirm your email address')}
    <p style="margin:18px 0 18px;font-size:15px;line-height:1.7;color:#a1a1aa;">${data.name ? `Hi ${escapeHtml(data.name)}, ` : ''}thanks for creating a Luton Cards account. Confirm your email to finish setting up — once verified, any past orders you placed with this email will appear in your account. This link expires in ${data.expiresInHours} hours.</p>
    <div align="center">${ctaButton(data.verifyUrl, 'Verify my email')}</div>
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">If you didn't create an account, you can safely ignore this email.</p>`
  await sendEmail({
    from: await getFrom(),
    to: data.to,
    subject: 'Verify your Luton Cards email',
    html: emailShell({
      title: 'Verify your email',
      preheader: 'Confirm your email to finish setting up your Luton Cards account.',
      content,
    }),
  })
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const content = `
    ${eyebrow('Password reset')}
    ${heading('Reset your password')}
    <p style="margin:18px 0 18px;font-size:15px;line-height:1.7;color:#a1a1aa;">${data.name ? `Hi ${escapeHtml(data.name)}, ` : ''}we got a request to reset your Luton Cards password. Click below to choose a new one. This link expires in ${data.expiresInMinutes} minutes and can only be used once.</p>
    <div align="center">${ctaButton(data.resetUrl, 'Reset password')}</div>
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">If you didn't ask for this, you can safely ignore this email, your password won't change.</p>`
  await sendEmail({
    from: await getFrom(),
    to: data.to,
    subject: 'Reset your Luton Cards password',
    html: emailShell({
      title: 'Reset your password',
      preheader: 'Reset your Luton Cards password (link expires soon).',
      content,
    }),
  })
}
