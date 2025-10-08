import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import sharp from 'sharp'

// ============================================
// VERSION JIMP (commentée pour fallback)
// ============================================
// import { createJimp } from '@jimp/core'
// import { defaultFormats, defaultPlugins } from 'jimp'
// import webp from '@jimp/wasm-webp'
// 
// const Jimp = createJimp({
//     formats: [...defaultFormats, webp],
//     plugins: defaultPlugins,
// })

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

        // ============================================
        // VERSION SHARP (active)
        // ============================================
        // Map des MIME types vers les formats Sharp
        const mimeToSharpFormat: Record<string, 'png' | 'jpeg' | 'webp' | 'gif' | 'tiff' | 'avif'> = {
            'image/png': 'png',
            'image/jpeg': 'jpeg',
            'image/jpg': 'jpeg',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'image/tiff': 'tiff',
            'image/avif': 'avif'
        }

        const outputFormat = mimeToSharpFormat[mimeType] || 'jpeg'

        // Redimensionner avec Sharp (cover = resize + crop au centre)
        let sharpInstance = sharp(buffer)
            .resize(size, size, {
                fit: 'cover',
                position: 'center'
            })

        // Appliquer le format de sortie avec options de qualité
        switch (outputFormat) {
            case 'png':
                sharpInstance = sharpInstance.png({ quality: 90 })
                break
            case 'webp':
                sharpInstance = sharpInstance.webp({ quality: 85 })
                break
            case 'jpeg':
                sharpInstance = sharpInstance.jpeg({ quality: 85 })
                break
            case 'gif':
                sharpInstance = sharpInstance.gif()
                break
            case 'tiff':
                sharpInstance = sharpInstance.tiff()
                break
            case 'avif':
                sharpInstance = sharpInstance.avif({ quality: 80 })
                break
        }

        const resizedBuffer = await sharpInstance.toBuffer()

        // ============================================
        // VERSION JIMP (commentée pour fallback)
        // ============================================
        // type JimpFormat = 'image/png' | 'image/jpeg' | 'image/bmp' | 'image/gif' | 'image/tiff' | 'image/x-ms-bmp' | 'image/webp'
        // 
        // const mimeToJimpFormat: Record<string, JimpFormat> = {
        //     'image/png': 'image/png',
        //     'image/jpeg': 'image/jpeg',
        //     'image/jpg': 'image/jpeg',
        //     'image/bmp': 'image/bmp',
        //     'image/gif': 'image/gif',
        //     'image/tiff': 'image/tiff',
        //     'image/webp': 'image/webp'
        // }
        // 
        // const outputFormat: JimpFormat = mimeToJimpFormat[mimeType] || 'image/jpeg'
        // const image = await Jimp.read(buffer)
        // image.cover({ w: size, h: size })
        // const resizedBuffer = await image.getBuffer(outputFormat)

        // Upload file to Supabase Storage
        const { data, error } = await supabaseServer.storage
            .from(bucket)
            .upload(fileName, resizedBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: mimeType
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