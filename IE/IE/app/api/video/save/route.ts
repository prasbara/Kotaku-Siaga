import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const videoFile = formData.get('video') as Blob | null
    const filename = (formData.get('filename') as string) || 'kotaku-siaga-presentation.webm'

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await videoFile.arrayBuffer())
    const videosDir = path.join(process.cwd(), 'public', 'videos')
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true })
    }

    const filePath = path.join(videosDir, filename)
    fs.writeFileSync(filePath, buffer)

    // Also copy to artifacts directory if available
    const artifactDir = 'C:\\Users\\Nabiel Ilyasa P\\.gemini\\antigravity-ide\\brain\\4e9dac3c-98bb-43fe-a3da-3f47a280ae36'
    if (fs.existsSync(artifactDir)) {
      fs.writeFileSync(path.join(artifactDir, filename), buffer)
    }

    return NextResponse.json({
      success: true,
      url: `/videos/${filename}`,
      bytes: buffer.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save video' }, { status: 500 })
  }
}
