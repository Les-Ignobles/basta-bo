import { NextResponse } from 'next/server';

/**
 * GET /api/firebase/recipes/normalize-actions/prompt
 * Proxy vers le backend Firebase : le system prompt du convertisseur IA,
 * affiché dans le BO comme guide de saisie pour l'équipe produit.
 */
export async function GET() {
    try {
        const firebaseBackendUrl = process.env.FIREBASE_BACKEND_URL;

        if (!firebaseBackendUrl) {
            return NextResponse.json(
                { error: 'Firebase backend URL not configured.' },
                { status: 500 }
            );
        }

        const res = await fetch(
            `${firebaseBackendUrl}/v1/cooking/recipes/normalize-actions/prompt`,
            { cache: 'no-store' }
        );

        if (!res.ok) {
            const errorText = await res.text();
            console.error('[Firebase API Error]', res.status, errorText);
            return NextResponse.json(
                { error: `Firebase API error: ${res.status}` },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[normalize-actions/prompt]', error);
        return NextResponse.json(
            { error: 'Failed to fetch normalization prompt' },
            { status: 500 }
        );
    }
}
