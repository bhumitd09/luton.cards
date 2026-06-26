import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { sendSellNotification } from '@/lib/email'
import { notifyAdmins } from '@/lib/notifications'
import { looksLikeSpam, turnstileConfigured, verifyTurnstile, clientIp } from '@/lib/anti-spam'

const MAX_IMAGES = 12
const MAX_IMAGE_BYTES = 3 * 1024 * 1024 // 3MB per image (base64)
const VALID_GAMES = new Set(['pokemon', 'one-piece', 'mixed'])

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(req: NextRequest) {
  // 3 per hour per IP. Each submission can include up to 5x ~3MB base64
  // images = ~15MB per call; before this cap an attacker could fill the
  // Railway volume in minutes.
  const block = enforceRateLimit(req, {
    bucket: 'sell-form',
    max: 3,
    windowMs: 60 * 60_000,
  })
  if (block) return block

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Honeypot + time-trap: pretend success, but don't save, so bots move on.
  if (looksLikeSpam(body)) {
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  // Cloudflare Turnstile (when configured).
  if (turnstileConfigured() && !(await verifyTurnstile(body.turnstileToken, clientIp(req)))) {
    return NextResponse.json({ error: 'Could not verify you are human. Please try again.' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const gameRaw = typeof body.game === 'string' ? body.game : ''
  const details = typeof body.details === 'string' ? body.details.trim() : ''
  const estimate = typeof body.estimate === 'string' ? body.estimate.trim() : ''
  const images = Array.isArray(body.images) ? body.images.filter((x): x is string => typeof x === 'string') : []

  // Validation
  if (!name || name.length > 120) {
    return NextResponse.json({ error: 'Name is required (max 120 chars).' }, { status: 400 })
  }
  if (!email || !isEmail(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }
  if (!VALID_GAMES.has(gameRaw)) {
    return NextResponse.json({ error: 'Please choose a game (Pokémon / One Piece / Mixed).' }, { status: 400 })
  }
  if (!details || details.length < 10) {
    return NextResponse.json({ error: 'Please describe the cards you want to sell (min 10 chars).' }, { status: 400 })
  }
  if (details.length > 4000) {
    return NextResponse.json({ error: 'Details are too long (max 4000 chars).' }, { status: 400 })
  }
  if (images.length > MAX_IMAGES) {
    return NextResponse.json({ error: `Maximum ${MAX_IMAGES} images allowed.` }, { status: 400 })
  }
  for (const img of images) {
    if (!img.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format.' }, { status: 400 })
    }
    // Rough base64 size check (string length × 3/4 ≈ byte size)
    if (img.length * 0.75 > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: `Each image must be under ${MAX_IMAGE_BYTES / 1024 / 1024}MB.` }, { status: 400 })
    }
  }

  try {
    const submission = await db.sellSubmission.create({
      data: {
        name,
        email,
        phone: phone || null,
        game: gameRaw,
        details,
        estimate: estimate || null,
        images,
      },
    })

    // Notify the team — email (with the photos attached) + in-app bell.
    // Best-effort; the submission is already saved + visible in admin → Buy-back.
    sendSellNotification({ name, email, phone, game: gameRaw, details, estimate, images })
      .catch(e => console.error('Sell email failed:', e))
    notifyAdmins({
      type: 'contact',
      title: 'New sell submission',
      body: `${name} wants to sell${estimate ? ` (est. ${estimate})` : ''} · ${images.length} photo${images.length === 1 ? '' : 's'}`,
      href: '/admin/sell',
    }).catch(() => {})

    return NextResponse.json({ ok: true, id: submission.id }, { status: 201 })
  } catch (err) {
    console.error('Sell submission error:', err)
    return NextResponse.json({ error: 'Could not save submission. Please try again.' }, { status: 500 })
  }
}
