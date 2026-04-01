import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/firebase/recipes/normalize-actions
 * Proxy vers le backend Firebase pour la normalisation des recettes en actions atomiques
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipe_ids, limit, dry_run, force } = body;

    const firebaseBackendUrl = process.env.FIREBASE_BACKEND_URL;

    if (!firebaseBackendUrl) {
      return NextResponse.json(
        { error: 'Firebase backend URL not configured.' },
        { status: 500 }
      );
    }

    const url = `${firebaseBackendUrl}/v1/cooking/recipes/normalize-actions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipe_ids,
        limit,
        dry_run: dry_run ?? false,
        force: force ?? false,
      }),
    });

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
    console.error('[POST /api/firebase/recipes/normalize-actions]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
