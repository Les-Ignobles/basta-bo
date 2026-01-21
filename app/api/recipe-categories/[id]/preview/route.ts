import { NextRequest, NextResponse } from 'next/server'

const FIREBASE_API_URL = process.env.FIREBASE_API_URL || 'http://127.0.0.1:5001/basta-app-staging/us-central1/api'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { searchParams } = new URL(request.url)
        const limit = searchParams.get('limit') || '10'

        const response = await fetch(`${FIREBASE_API_URL}/v1/cooking/categories/resolve-dynamic`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                category_id: Number(id),
                limit: Number(limit),
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || 'Failed to resolve dynamic category' },
                { status: response.status }
            )
        }

        return NextResponse.json({ data: data.data })
    } catch (error) {
        console.error('Error previewing dynamic category:', error)
        return NextResponse.json(
            { error: 'Failed to preview dynamic category' },
            { status: 500 }
        )
    }
}
