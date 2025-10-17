import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { RecipeRepository } from '@/features/cooking/repositories/recipe-repository'

export async function POST(req: NextRequest) {
    try {
        const { batchSize = 10 } = await req.json()

        const recipeRepo = new RecipeRepository(supabaseServer)

        // Récupérer le nombre total de recettes
        const allRecipes = await recipeRepo.findAll()
        const totalRecipes = allRecipes.length

        console.log(`Démarrage de l'analyse complète de ${totalRecipes} recettes avec des batches de ${batchSize}`)

        const results = []
        let totalProcessed = 0
        let totalFailed = 0

        // Traiter tous les batches
        for (let startFrom = 0; startFrom < totalRecipes; startFrom += batchSize) {
            try {
                console.log(`Traitement du batch ${Math.floor(startFrom / batchSize) + 1}/${Math.ceil(totalRecipes / batchSize)}`)

                // Appeler l'API d'analyse
                const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/recipes/analyze-allergies`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        batchSize,
                        startFrom
                    })
                })

                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`)
                }

                const batchResult = await response.json()

                totalProcessed += batchResult.processed || 0
                totalFailed += batchResult.failed || 0
                results.push(batchResult)

                console.log(`Batch terminé: ${batchResult.processed} réussies, ${batchResult.failed} échouées`)

                // Pause entre les batches pour éviter de surcharger l'API
                if (batchResult.hasMore) {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }

            } catch (error) {
                console.error(`Erreur dans le batch ${startFrom}-${startFrom + batchSize}:`, error)
                totalFailed += batchSize
            }
        }

        return Response.json({
            message: 'Analyse complète terminée',
            totalRecipes,
            processed: totalProcessed,
            failed: totalFailed,
            successRate: totalRecipes > 0 ? `${((totalProcessed / totalRecipes) * 100).toFixed(2)}%` : '0.00%',
            results
        })

    } catch (error) {
        console.error('Erreur dans l\'analyse complète:', error)
        return Response.json({
            error: 'Erreur interne du serveur',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 })
    }
}
