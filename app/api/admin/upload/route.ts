import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    return NextResponse.json(
      { error: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET environment variables.' },
      { status: 400 }
    )
  }

  // Get file metadata
  const filename =
    (file as File).name ??
    `upload-${Date.now()}.${file.type.split('/')[1] ?? 'jpg'}`
  const mimeType = file.type || 'image/jpeg'
  const size = file.size

  // Convert file to base64 data URI
  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const dataUri = `data:${mimeType};base64,${base64}`

  // Upload to Cloudinary
  let secureUrl: string
  try {
    const uploadForm = new FormData()
    uploadForm.append('file', dataUri)
    uploadForm.append('upload_preset', uploadPreset)

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: uploadForm }
    )

    if (!cloudRes.ok) {
      const errData = await cloudRes.json().catch(() => ({}))
      const message =
        (errData as { error?: { message?: string } }).error?.message ??
        'Cloudinary upload failed'
      return NextResponse.json({ error: message }, { status: 502 })
    }

    const cloudData = await cloudRes.json() as { secure_url: string }
    secureUrl = cloudData.secure_url
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // Persist to DB
  const media = await db.media.create({
    data: {
      url: secureUrl,
      filename,
      size,
      mimeType,
    },
  })

  return NextResponse.json({ url: secureUrl, mediaId: media.id }, { status: 201 })
}
