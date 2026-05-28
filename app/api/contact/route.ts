import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'

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

    const timestamp = Date.now()
    const key = `contact_submission_${timestamp}`
    const value = JSON.stringify({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      submittedAt: new Date().toISOString(),
    })

    await db.content.create({
      data: {
        key,
        value,
        type: 'contact_submission',
        label: `Contact from ${name.trim()} — ${subject.trim()}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 })
  }
}
