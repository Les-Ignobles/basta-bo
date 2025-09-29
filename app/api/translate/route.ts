import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { text, source = 'fr', target = 'en' } = await req.json()
        if (typeof text !== 'string' || !text) {
            return new Response(JSON.stringify({ error: 'Invalid text' }), { status: 400 })
        }
        // Placeholder translation: echo FR as EN for now.
        // Plug your translation provider here (DeepL, OpenAI, etc.).
        const translated = `${text}`
        return Response.json({ translated, source, target })
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 })
    }
}


