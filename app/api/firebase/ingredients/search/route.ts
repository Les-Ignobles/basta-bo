import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/firebase/ingredients/search
 * Proxy vers le backend Firebase pour la recherche intelligente par embedding
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category_id, is_test_mode, namespace_name } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // URL du backend Firebase (à configurer dans .env.local)
    const firebaseBackendUrl = process.env.FIREBASE_BACKEND_URL;

    if (!firebaseBackendUrl) {
      console.error(
        '[Firebase Backend URL Missing]',
        'FIREBASE_BACKEND_URL not set in environment variables'
      );
      return NextResponse.json(
        {
          error:
            'Firebase backend URL not configured. Please restart the dev server.',
        },
        { status: 500 }
      );
    }

    // Appel à l'API Firebase
    const url = `${firebaseBackendUrl}/v1/cooking/ingredients/search`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        category_id,
        is_test_mode: is_test_mode ?? false,
        namespace_name,
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
    console.error('[POST /api/firebase/ingredients/search]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
