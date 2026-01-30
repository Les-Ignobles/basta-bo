import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { UserProfileRepository } from '@/features/subscriptions/repositories/user-profile-repository'
import { SubscriptionAuditRepository } from '@/features/subscriptions/repositories/subscription-audit-repository'
import type {
  SearchUserResponse,
  UpdateSubscriptionRequest,
  UpdateSubscriptionResponse,
  ActionType
} from '@/features/subscriptions/types'
import { isUUID, calculateNewEndDate } from '@/features/subscriptions/types'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/subscriptions?query=email_or_uuid
 * Search for a user by email or UUID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.trim()

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter', message: 'Le paramètre query est requis' },
        { status: 400 }
      )
    }

    const userProfileRepo = new UserProfileRepository(supabaseServer)

    let authUser
    let userProfile

    if (isUUID(query)) {
      // Search by UUID
      authUser = await userProfileRepo.findAuthUserByUuid(query)
      if (authUser) {
        userProfile = await userProfileRepo.findByUuid(query)
      }
    } else {
      // Search by email
      authUser = await userProfileRepo.findAuthUserByEmail(query)
      if (authUser) {
        userProfile = await userProfileRepo.findByUuid(authUser.id)
      }
    }

    if (!authUser) {
      return NextResponse.json(
        { error: 'User not found', message: 'Aucun utilisateur trouvé avec cet email ou UUID' },
        { status: 404 }
      )
    }

    const response: SearchUserResponse = {
      authUser,
      userProfile: userProfile ?? null,
      canCreateProfile: !userProfile
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('Error searching user:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Erreur lors de la recherche' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/subscriptions
 * Update a user's subscription end date
 */
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateSubscriptionRequest = await request.json()
    const { userId, action, customDate } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'userId et action sont requis' },
        { status: 400 }
      )
    }

    if (action === 'custom_date' && !customDate) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'customDate est requis quand action est custom_date' },
        { status: 400 }
      )
    }

    // Get current admin from session
    const supabase = await createClient()
    const { data: { user: adminUser } } = await supabase.auth.getUser()

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin non authentifié' },
        { status: 401 }
      )
    }

    const userProfileRepo = new UserProfileRepository(supabaseServer)
    const auditRepo = new SubscriptionAuditRepository(supabaseServer)

    // Get current user profile
    const currentProfile = await userProfileRepo.findByUuid(userId)
    if (!currentProfile) {
      return NextResponse.json(
        { error: 'User not found', message: 'Profil utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Calculate new end date
    let newEndDate: Date
    if (action === 'custom_date' && customDate) {
      newEndDate = new Date(customDate)
    } else {
      const duration = action === 'add_1_month' ? '1_month' : '1_year'
      newEndDate = calculateNewEndDate(currentProfile.premium_sub_end_at, duration)
    }

    const previousEndDate = currentProfile.premium_sub_end_at

    // Update subscription
    const updatedProfile = await userProfileRepo.updateSubscription(userId, {
      premium_sub_end_at: newEndDate.toISOString()
    })

    // Get auth user for email
    const authUser = await userProfileRepo.findAuthUserByUuid(userId)

    // Create audit log
    const auditLog = await auditRepo.createAuditLog({
      admin_id: adminUser.id,
      admin_email: adminUser.email ?? 'unknown',
      user_id: userId,
      user_email: authUser?.email ?? currentProfile.email ?? 'unknown',
      previous_end_date: previousEndDate,
      new_end_date: newEndDate.toISOString(),
      action_type: action as ActionType
    })

    const response: UpdateSubscriptionResponse = {
      userProfile: updatedProfile,
      previousEndDate,
      newEndDate: newEndDate.toISOString(),
      auditLogId: auditLog.id
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}
