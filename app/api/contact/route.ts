import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { sendContactNotification } from '@/lib/email'
import { notifyAdmins } from '@/lib/notifications'
import { looksLikeSpam, turnstileConfigured, verifyTurnstile, clientIp } from '@/lib/anti-spam'

export async function POST(req: NextRequest) {
  // 5 per hour per IP. The previous code wrote one Content row per submission
  // and had no cap — combined with the now-fixed /api/content data leak that
  // could fill the table and exfiltrate every submission later.
  const block = enforceRateLimit(req, {
    bucket: 'contact-form',
    max: 5,
    windowMs: 60 * 60_000,
  })
  if (block) return block

  try {
    const body = await req.json()

    // Honeypot + time-trap: pretend success, but don't save, so bots move on.
    if (looksLikeSpam(body)) {
      return NextResponse.json({ success: true })
    }

    // Cloudflare Turnstile (when configured) — a failed/missing token is a real
    // verification failure, so tell the user to retry.
    if (turnstileConfigured() && !(await verifyTurnstile(body.turnstileToken, clientIp(req)))) {
      return NextResponse.json({ error: 'Could not verify you are human. Please try again.' }, { status: 400 })
    }

    const { name, email, subject, message } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const saved = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    }
    await db.contactMessage.create({ data: saved })

    // Notify the team — email + in-app bell. Best-effort; the message is
    // already safely stored + visible in the admin inbox.
    sendContactNotification(saved).catch(e => console.error('Contact email failed:', e))
    notifyAdmins({
      type: 'contact',
      title: 'New contact message',
      body: `${saved.name}: ${saved.subject}`,
      href: '/admin/contact',
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 })
  }
}
