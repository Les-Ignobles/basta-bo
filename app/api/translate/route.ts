import { NextRequest } from 'next/server'
import { z } from 'zod'
import { OpenaiIaService } from '@/lib/ia/openai-service'

export async function POST(req: NextRequest) {
    try {
        const { text, source = 'fr', languages = ['en', 'es'] } = await req.json()
        if (typeof text !== 'string' || !text) {
            return new Response(JSON.stringify({ error: 'Invalid text' }), { status: 400 })
        }

        if (!Array.isArray(languages) || languages.length === 0) {
            return new Response(JSON.stringify({ error: 'Languages must be a non-empty array' }), { status: 400 })
        }

        // Initialize OpenAI service
        const aiService = new OpenaiIaService('gpt-4o-mini')

        // Build dynamic Zod schema based on requested languages
        const schemaFields: Record<string, z.ZodString> = {}
        languages.forEach(lang => {
            schemaFields[lang] = z.string().describe(`Translation in ${lang}`)
        })

        const translationSchema = z.object(schemaFields)

        // Set up translation prompt
        const languagesList = languages.join(', ')
        const systemPrompt = `Tu es un traducteur professionnel. Traduis le texte donné de ${source} vers les langues suivantes: ${languagesList}. 
        Réponds avec un objet JSON contenant une clé pour chaque langue avec sa traduction.
        Pour la langue source (${source}), améliore et corrige le texte si nécessaire.
        Garde le même style et registre que le texte original pour chaque traduction.`

        const result = await aiService
            .setSystem(systemPrompt)
            .addUser(`Traduis ce texte de ${source} vers ${languagesList}: "${text}"`)
            .getCompletionResult<z.infer<typeof translationSchema>>({
                temperature: 0.3,
                maxTokens: 500,
                schemaType: translationSchema,
                schemaName: 'translations',
            })

        return Response.json(result)
    } catch (e: any) {
        console.error('Translation error:', e)
        return new Response(JSON.stringify({ error: 'Translation failed' }), { status: 500 })
    }
}


