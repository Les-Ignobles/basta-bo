"use client"
import { useAuth } from '@/components/auth-provider'

export function useAdmin() {
    const { user, userProfile, loading } = useAuth()

    // Le middleware s'occupe déjà des redirections
    // On ne fait que retourner l'état ici
    return {
        isAdmin: userProfile?.is_admin ?? false,
        loading,
        user,
        userProfile
    }
}
