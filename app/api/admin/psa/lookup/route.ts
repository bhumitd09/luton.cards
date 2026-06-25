import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { enforceRateLimit } from '@/lib/rate-limit'
import { fetchPsaCert, fetchPsaImages, buildListingFromCert, guessGame, PsaError } from '@/lib/psa'

/**
 * POST /api/admin/psa/lookup — preview a graded card from its PSA cert number.
 * Body: { certNumber }. Returns the cert details, the PSA image URLs (for
 * preview), and a suggested listing name/description/game. Does NOT create
 * anything — the admin reviews, sets a price, then calls /import.
 */
export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const block = enforceRateLimit(req, { bucket: 'psa-lookup', keyParts: [admin.userId], max: 60, windowMs: 60_000 })
  if (block) return block

  const body = await req.json().catch(() => ({}))
  const certNumber = typeof body.certNumber === 'string' ? body.certNumber.trim() : ''
  if (!certNumber) return NextResponse.json({ error: 'Cert number is required' }, { status: 400 })

  try {
    const cert = await fetchPsaCert(certNumber)
    const images = await fetchPsaImages(certNumber)
    const listing = buildListingFromCert(cert)
    return NextResponse.json({
      cert,
      images: images.map((i) => i.url),
      listing,
      suggestedGame: guessGame(cert),
    })
  } catch (err) {
    if (err instanceof PsaError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('PSA lookup error:', err)
    return NextResponse.json({ error: 'PSA lookup failed' }, { status: 500 })
  }
}
