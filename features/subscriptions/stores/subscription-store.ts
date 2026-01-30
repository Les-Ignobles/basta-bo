import { create } from 'zustand'
import type {
  UserProfile,
  AuthUser,
  SubscriptionAuditLog,
  ActionType,
  SearchUserResponse,
  UpdateSubscriptionResponse
} from '../types'

interface SubscriptionState {
  // Search state
  searchQuery: string
  searching: boolean

  // User data
  authUser: AuthUser | null
  userProfile: UserProfile | null
  canCreateProfile: boolean

  // Subscription update state
  updating: boolean
  updateError: string | null

  // Audit logs
  auditLogs: SubscriptionAuditLog[]
  loadingAuditLogs: boolean

  // Actions
  setSearchQuery: (query: string) => void
  searchUser: () => Promise<void>
  updateSubscription: (action: ActionType, customDate?: string) => Promise<boolean>
  createProfile: () => Promise<boolean>
  fetchAuditLogs: () => Promise<void>
  reset: () => void
}

const initialState = {
  searchQuery: '',
  searching: false,
  authUser: null,
  userProfile: null,
  canCreateProfile: false,
  updating: false,
  updateError: null,
  auditLogs: [],
  loadingAuditLogs: false
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  ...initialState,

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  searchUser: async () => {
    const { searchQuery } = get()
    if (!searchQuery.trim()) return

    set({ searching: true, updateError: null })

    try {
      const res = await fetch(`/api/subscriptions?query=${encodeURIComponent(searchQuery.trim())}`)
      const json = await res.json()

      if (!res.ok) {
        set({
          searching: false,
          authUser: null,
          userProfile: null,
          canCreateProfile: false,
          auditLogs: [],
          updateError: json.message || 'Utilisateur non trouvé'
        })
        return
      }

      const data: SearchUserResponse = json.data
      set({
        searching: false,
        authUser: data.authUser,
        userProfile: data.userProfile,
        canCreateProfile: data.canCreateProfile ?? false,
        auditLogs: []
      })

      // Fetch audit logs if user has a profile
      if (data.userProfile) {
        get().fetchAuditLogs()
      }
    } catch (error) {
      console.error('Error searching user:', error)
      set({
        searching: false,
        updateError: 'Erreur lors de la recherche'
      })
    }
  },

  updateSubscription: async (action: ActionType, customDate?: string) => {
    const { authUser } = get()
    if (!authUser) return false

    set({ updating: true, updateError: null })

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser.id,
          action,
          customDate
        })
      })

      const json = await res.json()

      if (!res.ok) {
        set({
          updating: false,
          updateError: json.message || 'Erreur lors de la mise à jour'
        })
        return false
      }

      const data: UpdateSubscriptionResponse = json.data
      set({
        updating: false,
        userProfile: data.userProfile
      })

      // Refresh audit logs
      get().fetchAuditLogs()
      return true
    } catch (error) {
      console.error('Error updating subscription:', error)
      set({
        updating: false,
        updateError: 'Erreur lors de la mise à jour'
      })
      return false
    }
  },

  createProfile: async () => {
    const { authUser } = get()
    if (!authUser) return false

    set({ updating: true, updateError: null })

    try {
      const res = await fetch('/api/subscriptions/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authUser.id })
      })

      const json = await res.json()

      if (!res.ok) {
        set({
          updating: false,
          updateError: json.message || 'Erreur lors de la création du profil'
        })
        return false
      }

      set({
        updating: false,
        userProfile: json.data.userProfile,
        canCreateProfile: false
      })
      return true
    } catch (error) {
      console.error('Error creating profile:', error)
      set({
        updating: false,
        updateError: 'Erreur lors de la création du profil'
      })
      return false
    }
  },

  fetchAuditLogs: async () => {
    const { authUser } = get()
    if (!authUser) return

    set({ loadingAuditLogs: true })

    try {
      const res = await fetch(`/api/subscriptions/audit?userId=${authUser.id}`)
      const json = await res.json()

      if (res.ok) {
        set({
          loadingAuditLogs: false,
          auditLogs: json.data
        })
      } else {
        set({ loadingAuditLogs: false })
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      set({ loadingAuditLogs: false })
    }
  },

  reset: () => {
    set(initialState)
  }
}))
