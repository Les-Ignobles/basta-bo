"use client"
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAdmin() {
    const { user, userProfile, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && user && userProfile && !userProfile.is_admin) {
            router.push('/unauthorized')
        }
    }, [user, userProfile, loading, router])

    return {
        isAdmin: userProfile?.is_admin ?? false,
        loading,
        user,
        userProfile
    }
}
