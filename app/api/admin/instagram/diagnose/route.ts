import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifySuperadminSession } from '@/lib/admin-auth'

/**
 * Admin-only diagnostic endpoint. Hits Meta's Graph API directly using the
 * stored access token and returns the raw response so admins can see exactly
 * what's happening (account name, type, post count, any error).
 */

type Diagnostic = {
  ok: boolean
  step: 'no-token' | 'profile' | 'media' | 'success'
  message?: string
  profile?: {
    id?: string
    username?: string
    account_type?: string
    media_count?: number
    name?: string
  }
  postsReturned?: number
  rawProfileResponse?: unknown
  rawMediaResponse?: unknown
}

export async function GET(req: NextRequest) {
  const admin = await verifySuperadminSession(req)
  if (!admin) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  const tokenRow = await db.content.findUnique({ where: { key: 'instagram_access_token' } }).catch(() => null)
  const token = tokenRow?.value?.trim()

  if (!token || token.length < 20) {
    const result: Diagnostic = { ok: false, step: 'no-token', message: 'No access token saved.' }
    return NextResponse.json(result)
  }

  // 1) Fetch profile (id, username, account_type, media_count)
  let profileData: Record<string, unknown> = {}
  try {
    const url = `https://graph.instagram.com/me?fields=id,username,account_type,media_count,name&access_token=${encodeURIComponent(token)}`
    const res = await fetch(url, { cache: 'no-store' })
    profileData = await res.json()
    if (!res.ok) {
      const result: Diagnostic = {
        ok: false,
        step: 'profile',
        message: `Profile fetch failed (HTTP ${res.status})`,
        rawProfileResponse: profileData,
      }
      return NextResponse.json(result)
    }
  } catch (err) {
    const result: Diagnostic = {
      ok: false,
      step: 'profile',
      message: err instanceof Error ? err.message : 'Profile fetch error',
    }
    return NextResponse.json(result)
  }

  // 2) Fetch media
  let mediaData: { data?: unknown[] } = {}
  try {
    const fields = 'id,caption,media_url,media_type,permalink,thumbnail_url,timestamp'
    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=8&access_token=${encodeURIComponent(token)}`
    const res = await fetch(url, { cache: 'no-store' })
    mediaData = await res.json()
    if (!res.ok) {
      const result: Diagnostic = {
        ok: false,
        step: 'media',
        message: `Media fetch failed (HTTP ${res.status})`,
        profile: {
          id: String(profileData.id ?? ''),
          username: String(profileData.username ?? ''),
          account_type: String(profileData.account_type ?? ''),
          media_count: typeof profileData.media_count === 'number' ? profileData.media_count : undefined,
          name: profileData.name ? String(profileData.name) : undefined,
        },
        rawMediaResponse: mediaData,
      }
      return NextResponse.json(result)
    }
  } catch (err) {
    const result: Diagnostic = {
      ok: false,
      step: 'media',
      message: err instanceof Error ? err.message : 'Media fetch error',
    }
    return NextResponse.json(result)
  }

  const postsReturned = Array.isArray(mediaData.data) ? mediaData.data.length : 0

  const result: Diagnostic = {
    ok: true,
    step: 'success',
    profile: {
      id: String(profileData.id ?? ''),
      username: String(profileData.username ?? ''),
      account_type: String(profileData.account_type ?? ''),
      media_count: typeof profileData.media_count === 'number' ? profileData.media_count : undefined,
      name: profileData.name ? String(profileData.name) : undefined,
    },
    postsReturned,
  }
  return NextResponse.json(result)
}
