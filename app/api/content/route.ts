import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/content?keys=key1,key2,key3
// Returns { key1: value1, key2: value2 } — public, no auth
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const keysParam = searchParams.get('keys') || ''
  const keys = keysParam.split(',').filter(Boolean)

  if (!keys.length) {
    const all = await db.content.findMany()
    const result: Record<string, string> = {}
    all.forEach(c => { result[c.key] = c.value })
    return NextResponse.json(result)
  }

  const items = await db.content.findMany({ where: { key: { in: keys } } })
  const result: Record<string, string> = {}
  items.forEach(c => { result[c.key] = c.value })
  return NextResponse.json(result)
}
