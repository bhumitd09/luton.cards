/**
 * Storage abstraction — swap drivers via STORAGE_DRIVER env var.
 *
 *   STORAGE_DRIVER=local  → LocalStorage (Railway volume / local disk)
 *   STORAGE_DRIVER=s3     → S3Storage (future)
 *
 * All admin uploads (product images, team photos, IG manual posts, future
 * customer-attached photos for buy-back submissions) flow through this layer.
 */

export interface StorageDriver {
  /**
   * Save a binary payload. Returns a public URL that can be embedded in `<img>`.
   */
  put(input: {
    data: Buffer
    filename: string
    mimeType: string
    /** Optional logical folder prefix, e.g. 'products', 'team'. */
    prefix?: string
  }): Promise<{ url: string; key: string }>

  /**
   * Read a stored file. Used by the public-facing /api/uploads/* route.
   * Returns null if the key doesn't exist.
   */
  get(key: string): Promise<{ data: Buffer; mimeType: string } | null>

  /**
   * Delete a stored file. Idempotent — succeeds if file is missing.
   */
  delete(key: string): Promise<void>

  /**
   * Driver name (for diagnostics).
   */
  readonly name: string
}

import { LocalStorage } from './local'

let _driver: StorageDriver | null = null

export function storage(): StorageDriver {
  if (_driver) return _driver

  const driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase()

  switch (driver) {
    case 's3':
      // Lazy-load to avoid pulling AWS SDK into the bundle when not used.
      // To enable: `npm i @aws-sdk/client-s3` and uncomment the import + return below.
      // Required env: STORAGE_S3_BUCKET, STORAGE_S3_REGION,
      //               AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
      //               (optional) STORAGE_S3_PUBLIC_URL_BASE for CDN/CloudFront.
      // const { S3Storage } = require('./s3')
      // _driver = new S3Storage()
      // return _driver
      throw new Error(
        'S3 storage driver not yet enabled. Install @aws-sdk/client-s3 and uncomment ./s3 import.'
      )

    case 'local':
    default:
      _driver = new LocalStorage()
      return _driver
  }
}

/**
 * Derive the storage key from a public upload URL so we can delete the
 * underlying file. URLs look like `${UPLOAD_PUBLIC_BASE}/<key>` (default
 * base `/api/uploads`). Returns null for external/absolute URLs we don't
 * own (e.g. a pasted https:// image), so the caller can skip the delete.
 */
export function keyFromUrl(url: string): string | null {
  if (!url) return null
  const base = (process.env.UPLOAD_PUBLIC_BASE || '/api/uploads').replace(/\/$/, '')
  // Only our own uploads are deletable. Match either a relative
  // "/api/uploads/<key>" or an absolute URL whose path starts with base.
  let path = url
  try {
    if (/^https?:\/\//i.test(url)) path = new URL(url).pathname
  } catch {
    return null
  }
  const prefix = base + '/'
  if (!path.startsWith(prefix)) return null
  const key = path.slice(prefix.length)
  return key || null
}
