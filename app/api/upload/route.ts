import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { Jimp } from 'jimp'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const fileName = formData.get('fileName') as string
        const bucket = formData.get('bucket') as string
        const targetSize = formData.get('targetSize') as string || '100'

        if (!file || !fileName || !bucket) {
            return NextResponse.json(
                { error: 'Missing required fields: file, fileName, bucket' },
                { status: 400 }
            )
        }

        // Parser la taille cible
        const size = parseInt(targetSize, 10)
        if (isNaN(size) || size <= 0) {
            return NextResponse.json(
                { error: 'Invalid targetSize parameter' },
                { status: 400 }
            )
        }

        // Convertir le fichier en buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Détecter le type MIME de l'image
        const mimeType = file.type
        const isPng = mimeType === 'image/png'

        // Redimensionner l'image à la taille cible avec Jimp
        const image = await Jimp.read(buffer)
        image.cover({ w: size, h: size }) // Redimensionne en mode cover

        // Convertir en buffer selon le format
        const resizedBuffer = await image.getBuffer(isPng ? 'image/png' : 'image/jpeg')

        // Upload file to Supabase Storage
        const { data, error } = await supabaseServer.storage
            .from(bucket)
            .upload(fileName, resizedBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: isPng ? 'image/png' : 'image/jpeg'
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