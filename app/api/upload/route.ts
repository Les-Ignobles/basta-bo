import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

        const supabase = await createClient()

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('Upload error:', error)
            return NextResponse.json(
                { error: 'Failed to upload file' },
                { status: 500 }
            )
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
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