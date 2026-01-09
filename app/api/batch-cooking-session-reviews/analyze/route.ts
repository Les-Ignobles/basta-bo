import { NextRequest } from 'next/server'
import { z } from 'zod'
import { OpenaiIaService } from '@/lib/ia/openai-service'
import { BatchCookingSessionReview } from '@/features/cooking/types/batch-cooking-session-review'

const analysisResultSchema = z.object({
    is_valid: z.boolean().describe('True if the user feedback is justified based on the session data'),
    confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level of the analysis'),
    explanation: z.string().describe('Detailed explanation of why the feedback is valid or not'),
    relevant_steps: z.array(z.string()).describe('List of relevant steps that support or contradict the feedback'),
    suggestion: z.string().nullable().describe('Suggestion for improvement if the feedback is valid, or null if not applicable'),
})

export type AnalysisResult = z.infer<typeof analysisResultSchema>

export async function POST(req: NextRequest) {
    try {
        const { review } = await req.json() as { review: BatchCookingSessionReview }

        if (!review || !review.comment) {
            return new Response(JSON.stringify({ error: 'Review with comment is required' }), { status: 400 })
        }

        if (!review.session) {
            return new Response(JSON.stringify({ error: 'Session data is required' }), { status: 400 })
        }

        const aiService = new OpenaiIaService('gpt-4o-mini')

        // Build session context
        const recipesContext = review.session.recipes
            ?.map((r, i) => `${i + 1}. ${r.title}`)
            .join('\n') || 'Aucune recette'

        const cookingStepsContext = review.session.cooking_steps
            ?.sort((a, b) => a.order - b.order)
            .map((s) => `[Etape ${s.order}] ${s.text}${s.ingredients?.length ? ` (ingredients: ${s.ingredients.map(i => i.text).join(', ')})` : ''}`)
            .join('\n') || 'Aucune etape de cuisine'

        const assemblyStepsContext = review.session.assembly_steps
            ?.sort((a, b) => a.order - b.order)
            .map((s) => `[Assemblage ${s.order}] ${s.text}: ${s.desc}`)
            .join('\n') || 'Aucune etape d\'assemblage'

        const ingredientsContext = review.session.ingredients
            ?.map((i) => `- ${i.text}${i.quantity ? ` (${i.quantity} ${i.unit || ''})` : ''}`)
            .join('\n') || 'Aucun ingredient'

        const systemPrompt = `Tu es un assistant qualite pour une application de batch cooking.
Tu dois analyser les retours utilisateurs et verifier s'ils sont justifies en comparant avec les donnees reelles de la session de cuisine.

Ta mission:
1. Analyser le commentaire de l'utilisateur
2. Verifier dans les etapes de cuisine et d'assemblage si le probleme mentionne est avere
3. Determiner si le feedback est justifie ou non
4. Fournir une explication claire et factuelle

Sois precis et objectif. Si l'utilisateur mentionne un oubli, verifie vraiment si cet element est present ou absent des etapes.
Si tu n'es pas sur, indique-le avec un niveau de confiance "low" ou "medium".`

        const userPrompt = `Analyse ce retour utilisateur pour la session de batch cooking:

## Commentaire de l'utilisateur
"${review.comment}"

## Donnees de la session

### Recettes preparees
${recipesContext}

### Etapes de cuisine
${cookingStepsContext}

### Etapes d'assemblage
${assemblyStepsContext}

### Liste des ingredients
${ingredientsContext}

---

Analyse ce feedback et determine s'il est justifie ou non en te basant sur les donnees de la session.`

        const result = await aiService
            .setSystem(systemPrompt)
            .addUser(userPrompt)
            .getCompletionResult<AnalysisResult>({
                temperature: 0.3,
                maxTokens: 1000,
                schemaType: analysisResultSchema,
                schemaName: 'analysis_result',
            })

        return Response.json(result)
    } catch (e: unknown) {
        console.error('Analysis error:', e)
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        return new Response(JSON.stringify({ error: `Analysis failed: ${errorMessage}` }), { status: 500 })
    }
}
