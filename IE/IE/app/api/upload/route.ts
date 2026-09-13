import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { processAndValidateImage } from '@/lib/verification/image-validator'
import fs from 'fs'
import path from 'path'

// POST /api/upload — upload photo, validate magic bytes, compute dHash and SHA-256
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 1. Validate magic bytes, size, EXIF, and compute dHash & SHA-256
    const validation = await processAndValidateImage(buffer, file.type)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error || 'File tidak valid.' }, { status: 400 })
    }

    // 2. Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`
    let publicUrl = `/uploads/reports/${filename}`
    let storagePath = `reports/${filename}`

    // 3. Try uploading to Supabase Storage if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase.storage
          .from('report-photos')
          .upload(storagePath, buffer, {
            contentType: validation.mimeType,
            upsert: false,
          })

        if (!error && data) {
          const { data: { publicUrl: sbUrl } } = supabase.storage
            .from('report-photos')
            .getPublicUrl(data.path)
          publicUrl = sbUrl
          storagePath = data.path
        }
      } catch (dbErr) {
        console.warn('Supabase storage upload failed, saving to local public disk:', dbErr)
      }
    }

    // 4. Fallback to saving on local disk for local development
    if (publicUrl.startsWith('/uploads/')) {
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'reports')
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }
        fs.writeFileSync(path.join(uploadDir, filename), buffer)
      } catch (fsErr) {
        console.warn('Local disk write failed, fallback to data URI:', fsErr)
        publicUrl = `data:${validation.mimeType};base64,${buffer.toString('base64').slice(0, 1000)}...`
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: storagePath,
      sha256: validation.sha256,
      dhash: validation.dhash,
      photo_taken_at: validation.photoTakenAt,
      size_bytes: validation.sizeBytes,
      mime_type: validation.mimeType,
    })
  } catch (error) {
    console.error('POST /api/upload error:', error)
    return NextResponse.json({ error: 'Upload gagal diproses.' }, { status: 500 })
  }
}
