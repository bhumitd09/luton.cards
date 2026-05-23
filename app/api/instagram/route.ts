import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Public Instagram feed endpoint.
 *
 * Resolution order:
 *   1. If `instagram_access_token` is set in CMS Content, fetch live posts from
 *      Meta's Instagram Graph API. Tokens last 60 days — we auto-refresh
 *      anything older than 50 days before each fetch.
 *   2. Otherwise, fall back to manually curated posts (`instagram_posts`).
 *   3. If neither, return `{ handle, posts: [] }`.
 *
 * Response is cached for 15 minutes via Next's fetch revalidation when going
 * out to the Graph API.
 */

type IGPost = {
  url: string
  image: string
  caption?: string
}

type Resp = {
  handle: string
  posts: IGPost[]
  source: 'graph' | 'manual' | 'empty'
  cachedUntil?: string
}

const REFRESH_BEFORE_DAYS = 50

async function getContent(key: string): Promise<string | null> {
  try {
    const row = await db.content.findUnique({ where: { key } })
    return row?.value ?? null
  } catch {
    return null
  }
}

async function setContent(key: string, value: string, label: string, type = 'text') {
  try {
    await db.content.upsert({
      where: { key },
      update: { value, type, label },
      create: { key, value, type, label, updatedAt: new Date() },
    })
  } catch (err) {
    console.error(`Failed to save content ${key}:`, err)
  }
}

async function refreshTokenIfNeeded(token: string): Promise<string> {
  const lastRefreshStr = await getContent('instagram_token_refreshed_at')
  const lastRefresh = lastRefreshStr ? Date.parse(lastRefreshStr) : 0
  const daysOld = lastRefresh ? (Date.now() - lastRefresh) / (1000 * 60 * 60 * 24) : 999

  if (daysOld < REFRESH_BEFORE_DAYS) return token

  try {
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.warn('IG token refresh failed:', res.status, await res.text())
      return token
    }
    const data = await res.json() as { access_token?: string; expires_in?: number }
    if (data.access_token) {
      await setContent('instagram_access_token', data.access_token, 'Instagram Access Token', 'text')
      await setContent('instagram_token_refreshed_at', new Date().toISOString(), 'Instagram Token Refreshed At', 'text')
      return data.access_token
    }
  } catch (err) {
    console.warn('IG token refresh error:', err)
  }
  return token
}

async function fetchFromGraph(token: string, limit = 8): Promise<IGPost[] | null> {
  try {
    const fields = 'id,caption,media_url,media_type,permalink,thumbnail_url,timestamp'
    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`
    const res = await fetch(url, { next: { revalidate: 900 } }) // 15-min cache
    if (!res.ok) {
      console.warn('IG graph fetch failed:', res.status, await res.text())
      return null
    }
    const data = await res.json() as { data?: Array<{ id: string; caption?: string; media_url: string; media_type: string; permalink: string; thumbnail_url?: string }> }
    if (!Array.isArray(data.data)) return null

    return data.data.map(post => ({
      url: post.permalink,
      // For VIDEO posts, media_url is the .mp4 — use thumbnail_url instead.
      image: post.media_type === 'VIDEO' && post.thumbnail_url ? post.thumbnail_url : post.media_url,
      caption: post.caption?.slice(0, 200),
    }))
  } catch (err) {
    console.warn('IG graph fetch error:', err)
    return null
  }
}

export async function GET() {
  const [handleVal, token, manualVal] = await Promise.all([
    getContent('instagram_handle'),
    getContent('instagram_access_token'),
    getContent('instagram_posts'),
  ])

  const handle = (handleVal || 'lutoncards').replace(/^@/, '').trim()

  // 1) Try Graph API
  if (token && token.trim().length > 20) {
    const freshToken = await refreshTokenIfNeeded(token.trim())
    const graphPosts = await fetchFromGraph(freshToken)
    if (graphPosts && graphPosts.length > 0) {
      const resp: Resp = { handle, posts: graphPosts, source: 'graph' }
      return NextResponse.json(resp, {
        headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' },
      })
    }
  }

  // 2) Fallback to manual
  if (manualVal) {
    try {
      const parsed = JSON.parse(manualVal)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned: IGPost[] = parsed
          .filter((p): p is IGPost => p && typeof p.url === 'string' && typeof p.image === 'string')
          .slice(0, 12)
        const resp: Resp = { handle, posts: cleaned, source: 'manual' }
        return NextResponse.json(resp, {
          headers: { 'Cache-Control': 'public, s-maxage=300' },
        })
      }
    } catch {
      // ignore parse errors
    }
  }

  // 3) Empty
  const resp: Resp = { handle, posts: [], source: 'empty' }
  return NextResponse.json(resp)
}
