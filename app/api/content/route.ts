import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { filterPublicKeys } from '@/lib/content-keys'

/**
 * Public content reader. STRICT — only returns keys in the public allowlist.
 *
 *   GET /api/content?keys=hero_headline,marquee_items
 *   → { hero_headline: '...', marquee_items: '[...]' }
 *
 * Previously, calling with no `?keys=` param dumped EVERY row in the Content
 * table. That table also stores `instagram_access_token`, CollectTCG webhook
 * secrets, and every `contact_submission_*` blob — one anonymous curl would
 * return all of it. This handler now:
 *   1. Requires the `keys` param (400 if missing/empty)
 *   2. Silently filters out keys that aren't in the public allowlist
 *      (see lib/content-keys.ts). Silent filter means attackers can't probe
 *      which secret keys exist by inspecting response shape.
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const keysParam = searchParams.get('keys') || ''
  const requested = keysParam.split(',').map(k => k.trim()).filter(Boolean)

  if (requested.length === 0) {
    return NextResponse.json(
      { error: 'The `keys` query parameter is required.' },
      { status: 400 },
    )
  }

  const allowed = filterPublicKeys(requested)
  if (allowed.length === 0) {
    return NextResponse.json({})
  }

  const items = await db.content.findMany({ where: { key: { in: allowed } } })
  const result: Record<string, string> = {}
  items.forEach(c => { result[c.key] = c.value })
  return NextResponse.json(result)
}
