import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { SubscriptionAuditRepository } from '@/features/subscriptions/repositories/subscription-audit-repository'

/**
 * GET /api/subscriptions/audit?userId=uuid
 * Get audit logs for a specific user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing parameter', message: 'Le paramètre userId est requis' },
        { status: 400 }
      )
    }

    const auditRepo = new SubscriptionAuditRepository(supabaseServer)
    const auditLogs = await auditRepo.findByUserId(userId)

    return NextResponse.json({ data: auditLogs })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    )
  }
}
