import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { UserProfileRepository } from '@/features/subscriptions/repositories/user-profile-repository'

interface CreateProfileRequest {
  userId: string
}

/**
 * POST /api/subscriptions/profile
 * Create a minimal profile for a user that exists in auth.users but not in user_profiles
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateProfileRequest = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'userId est requis' },
        { status: 400 }
      )
    }

    const userProfileRepo = new UserProfileRepository(supabaseServer)

    // Check if profile already exists
    const existingProfile = await userProfileRepo.findByUuid(userId)
    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profile exists', message: 'Un profil existe déjà pour cet utilisateur' },
        { status: 409 }
      )
    }

    // Get auth user to get email
    const authUser = await userProfileRepo.findAuthUserByUuid(userId)
    if (!authUser) {
      return NextResponse.json(
        { error: 'User not found', message: 'Utilisateur non trouvé dans auth.users' },
        { status: 404 }
      )
    }

    // Create minimal profile
    const newProfile = await userProfileRepo.createMinimalProfile({
      uuid: userId,
      email: authUser.email
    })

    return NextResponse.json({ data: { userProfile: newProfile } }, { status: 201 })
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Erreur lors de la création du profil' },
      { status: 500 }
    )
  }
}
