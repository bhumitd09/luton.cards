import { NextResponse } from 'next/server'

const CHANNEL_ID = 'UC5UC_w6F9gxpxpJEH94PWQg'
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`

function stripEmojis(str: string) {
  return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '').trim()
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return '1 week ago'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 60) return '1 month ago'
  return `${Math.floor(days / 30)} months ago`
}

function isShort(title: string, durationSecs: number | null) {
  // Duration is the most reliable signal — Shorts are <= 60s
  if (durationSecs !== null && durationSecs <= 60) return true
  const lower = title.toLowerCase()
  if (lower.includes('#shorts') || lower.includes('#short')) return true
  // 2+ hashtags strongly indicates a Short
  const hashCount = (title.match(/#\w/g) || []).length
  return hashCount >= 2
}

export async function GET() {
  try {
    const res = await fetch(RSS_URL, {
      next: { revalidate: 3600 }, // cache 1 hour
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })

    if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`)

    const xml = await res.text()

    // Extract entries using regex
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => m[1])

    const videos = entries
      .map(entry => {
        const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)
        const titleMatch = entry.match(/<title>([^<]+)<\/title>/)
        const publishedMatch = entry.match(/<published>([^<]+)<\/published>/)

        if (!videoIdMatch || !titleMatch) return null

        const videoId = videoIdMatch[1]
        const rawTitle = titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
        const title = stripEmojis(rawTitle)
        const published = publishedMatch ? publishedMatch[1] : ''

        // Parse duration from media:content (seconds)
        const durationMatch = entry.match(/duration="(\d+)"/)
        const durationSecs = durationMatch ? parseInt(durationMatch[1]) : null

        const isYouTubeShort = entry.includes('youtube.com/shorts/')
        if (isYouTubeShort || isShort(rawTitle, durationSecs)) return null

        return {
          id: videoId,
          title,
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          date: timeAgo(published),
        }
      })
      .filter(Boolean)
      .slice(0, 6)

    return NextResponse.json(videos)
  } catch (err) {
    console.error('YouTube RSS error:', err)
    // Fallback to known real videos
    return NextResponse.json([
      { id: 'sQmwcSJj6ko', title: 'Can I make my money back on an Ascended Heroes ETB?!', thumbnail: 'https://img.youtube.com/vi/sQmwcSJj6ko/mqdefault.jpg', date: '3 weeks ago' },
      { id: 'xsbzGsqjo5g', title: 'We went to our FIRST Pokemon Card Show...', thumbnail: 'https://img.youtube.com/vi/xsbzGsqjo5g/mqdefault.jpg', date: '1 month ago' },
    ])
  }
}
