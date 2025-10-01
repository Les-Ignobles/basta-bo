import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const fileName = formData.get('fileName') as string
        const bucket = formData.get('bucket') as string

        if (!file || !fileName || !bucket) {
            return NextResponse.json(
                { error: 'Missing required fields: file, fileName, bucket' },
                { status: 400 }
            )
        }

        // Convertir le fichier en buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Redimensionner l'image à 100x100px
        const resizedBuffer = await sharp(buffer)
            .resize(100, 100, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 90 })
            .toBuffer()

        // Upload file to Supabase Storage
        const { data, error } = await supabaseServer.storage
            .from(bucket)
            .upload(fileName, resizedBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: 'image/jpeg'
            })

        if (error) {
            console.error('Upload error:', error)
            return NextResponse.json(
                { error: 'Failed to upload file' },
                { status: 500 }
            )
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseServer.storage
            .from(bucket)
            .getPublicUrl(fileName)

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: data.path
        })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}