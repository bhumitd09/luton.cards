import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import type { StorageDriver } from './index'

/**
 * LocalStorage — writes uploaded files to disk.
 *
 * On Railway: mount a volume at /data, set UPLOAD_DIR=/data/uploads.
 * In dev: defaults to ./uploads (gitignored).
 *
 * Public URL: /api/uploads/<key>. The route handler at
 * app/api/uploads/[...path]/route.ts streams files back from this driver.
 */
export class LocalStorage implements StorageDriver {
  readonly name = 'local'
  private root: string
  private publicBase: string

  constructor() {
    // Resolve upload dir from env or default to ./uploads relative to cwd.
    const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
    this.root = path.resolve(dir)
    // Public URL base — usually just /api/uploads, but allow override for
    // CDN-fronted setups (e.g. /cdn-uploads if you proxy through Cloudflare)
    this.publicBase = (process.env.UPLOAD_PUBLIC_BASE || '/api/uploads').replace(/\/$/, '')
  }

  private safeExt(filename: string, mimeType: string): string {
    // Prefer extension from filename if it looks like an image extension.
    const m = filename.match(/\.([a-zA-Z0-9]{2,5})$/)
    if (m) {
      const ext = m[1].toLowerCase()
      if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'].includes(ext)) {
        return ext === 'jpeg' ? 'jpg' : ext
      }
    }
    // Fall back to MIME type
    const fromMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/avif': 'avif',
      'image/svg+xml': 'svg',
    }
    return fromMime[mimeType] || 'bin'
  }

  // Prevent directory-traversal attacks
  private resolveKey(key: string): string {
    const clean = key.replace(/^\/+/, '')
    const full = path.resolve(this.root, clean)
    if (!full.startsWith(this.root + path.sep) && full !== this.root) {
      throw new Error('Invalid key (traversal blocked)')
    }
    return full
  }

  async put(input: {
    data: Buffer
    filename: string
    mimeType: string
    prefix?: string
  }): Promise<{ url: string; key: string }> {
    const ext = this.safeExt(input.filename, input.mimeType)
    const id = randomUUID()
    // Date-prefixed for easier maintenance: YYYY/MM
    const now = new Date()
    const datePrefix = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`
    const prefix = input.prefix ? `${input.prefix}/${datePrefix}` : datePrefix
    const key = `${prefix}/${id}.${ext}`
    const fullPath = this.resolveKey(key)

    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, input.data)

    const url = `${this.publicBase}/${key}`
    return { url, key }
  }

  async get(key: string): Promise<{ data: Buffer; mimeType: string } | null> {
    try {
      const fullPath = this.resolveKey(key)
      const data = await fs.readFile(fullPath)
      const ext = path.extname(fullPath).slice(1).toLowerCase()
      const mimeType = MIME_BY_EXT[ext] || 'application/octet-stream'
      return { data, mimeType }
    } catch (err) {
      const e = err as NodeJS.ErrnoException
      if (e.code === 'ENOENT') return null
      throw err
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const fullPath = this.resolveKey(key)
      await fs.unlink(fullPath)
    } catch (err) {
      const e = err as NodeJS.ErrnoException
      if (e.code === 'ENOENT') return // already gone — idempotent
      throw err
    }
  }
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  svg: 'image/svg+xml',
}
