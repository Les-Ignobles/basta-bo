import { NextRequest, NextResponse } from 'next/server'

const FIREBASE_API_URL =
    process.env.FIREBASE_BACKEND_URL ||
    process.env.FIREBASE_API_URL ||
    'http://127.0.0.1:5001/basta-app-eabb1/europe-west9/api'

/**
 * GET /api/recipe-categories/[id]/preview
 * Aperçu des recettes qu'une catégorie (statique ou dynamique) affichera dans l'app,
 * avec simulation de profil optionnelle :
 * - user_profile_id : utilisateur réel
 * - diet_ids / allergy_ids (CSV) : profil type composé au BO
 * - aucun paramètre : contenu vu par « tout le monde »
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { searchParams } = new URL(request.url)
        const limit = searchParams.get('limit') || '30'
        const userProfileId = searchParams.get('user_profile_id')
        const dietIds = searchParams.get('diet_ids')
        const allergyIds = searchParams.get('allergy_ids')

        const parseCsv = (value: string | null): number[] =>
            value ? value.split(',').map(Number).filter(n => !isNaN(n)) : []

        const response = await fetch(`${FIREBASE_API_URL}/v1/cooking/categories/preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                category_id: Number(id),
                limit: Number(limit),
                user_profile_id: userProfileId ? Number(userProfileId) : undefined,
                diet_ids: parseCsv(dietIds),
                allergy_ids: parseCsv(allergyIds),
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || 'Failed to preview category' },
                { status: response.status }
            )
        }

        return NextResponse.json({ data: data.data })
    } catch (error) {
        console.error('Error previewing category:', error)
        return NextResponse.json(
            { error: 'Failed to preview category' },
            { status: 500 }
        )
    }
}
