import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository } from '@/lib/repositories/base-repository'
import type {
  UserProfile,
  AuthUser,
  UpdateSubscriptionDto,
  CreateMinimalProfileDto
} from '../types'

export class UserProfileRepository extends BaseRepository<UserProfile> {
  constructor(client: SupabaseClient) {
    super(client, 'user_profiles')
  }

  /**
   * Find user profile by UUID
   */
  async findByUuid(uuid: string): Promise<UserProfile | null> {
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq('uuid', uuid)
      .single()

    if (error) {
      if ((error as unknown as Record<string, unknown>).code === 'PGRST116') return null
      throw error
    }
    return data as UserProfile
  }

  /**
   * Find auth user by email using Supabase Admin API
   */
  async findAuthUserByEmail(email: string): Promise<AuthUser | null> {
    const { data, error } = await this.client.auth.admin.listUsers()
    if (error) throw error

    const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!user) return null

    return {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at
    }
  }

  /**
   * Find auth user by UUID using Supabase Admin API
   */
  async findAuthUserByUuid(uuid: string): Promise<AuthUser | null> {
    const { data, error } = await this.client.auth.admin.getUserById(uuid)
    if (error) {
      // User not found
      if (error.message?.includes('not found')) return null
      throw error
    }

    return {
      id: data.user.id,
      email: data.user.email ?? null,
      created_at: data.user.created_at
    }
  }

  /**
   * Update subscription end date for a user
   */
  async updateSubscription(uuid: string, dto: UpdateSubscriptionDto): Promise<UserProfile> {
    const { data, error } = await this.client
      .from(this.table)
      .update({ premium_sub_end_at: dto.premium_sub_end_at })
      .eq('uuid', uuid)
      .select('*')
      .single()

    if (error) throw error
    return data as UserProfile
  }

  /**
   * Create a minimal profile for a user that exists in auth.users but not in user_profiles
   */
  async createMinimalProfile(dto: CreateMinimalProfileDto): Promise<UserProfile> {
    const { data, error } = await this.client
      .from(this.table)
      .insert({
        uuid: dto.uuid,
        email: dto.email,
        is_admin: false,
        role_scopes: []
      })
      .select('*')
      .single()

    if (error) throw error
    return data as UserProfile
  }
}
