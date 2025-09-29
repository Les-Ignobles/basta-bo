import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const bucket = formData.get('bucket') as string || 'ingredients'
        const fileName = formData.get('fileName') as string

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!fileName) {
            return Response.json({ error: 'No fileName provided' }, { status: 400 })
        }

        // Upload to Supabase Storage
        const { data, error } = await supabaseServer.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            return Response.json({ error: error.message }, { status: 500 })
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseServer.storage
            .from(bucket)
            .getPublicUrl(fileName)

        return Response.json({
            url: publicUrl,
            path: data.path
        })
    } catch (error) {
        return Response.json({ error: 'Upload failed' }, { status: 500 })
    }
}
