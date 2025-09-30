"use client"
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type UserProfile = {
    id: number
    email: string
    firstname: string
    avatar: string
    is_admin?: boolean
}

type AuthContextType = {
    user: User | null
    userProfile: UserProfile | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        let isMounted = true

        console.log('AuthProvider useEffect started')
        console.log('Supabase client:', supabase)
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing')

        // Timeout de sécurité pour éviter le loading infini
        const timeoutId = setTimeout(() => {
            if (isMounted) {
                console.warn('Auth loading timeout - forcing loading to false')
                setLoading(false)
            }
        }, 10000) // 10 secondes max

        // Test de connexion directe
        const testConnection = async () => {
            try {
                console.log('Testing Supabase connection...')
                const startTime = Date.now()
                const { data, error } = await supabase.auth.getSession()
                const endTime = Date.now()
                console.log(`Direct getSession took ${endTime - startTime}ms:`, { data: data?.session?.user?.id, error })
            } catch (err) {
                console.error('Direct getSession error:', err)
            }
        }
        testConnection()

        console.log('Setting up auth state change listener...')
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event, session?.user?.id)

                if (!isMounted) return

                try {
                    setUser(session?.user ?? null)

                    if (session?.user) {
                        // Fetch user profile
                        console.log('Fetching user profile for user:', session.user.id)
                        const startTime = Date.now()
                        
                        try {
                            const { data: profile, error } = await supabase
                                .from('user_profiles')
                                .select('id, email, firstname, avatar, is_admin')
                                .eq('uuid', session.user.id)
                                .single()

                            const endTime = Date.now()
                            console.log(`User profile query took ${endTime - startTime}ms`)

                            if (!isMounted) return

                            if (error) {
                                console.error('Error fetching user profile:', error)
                                setUserProfile(null)
                            } else {
                                console.log('User profile loaded:', profile?.firstname || 'No firstname')
                                setUserProfile(profile)
                            }
                        } catch (err) {
                            const endTime = Date.now()
                            console.error(`User profile query failed after ${endTime - startTime}ms:`, err)
                            if (isMounted) {
                                setUserProfile(null)
                            }
                        }
                    } else {
                        setUserProfile(null)
                    }
                } catch (error) {
                    console.error('Error in auth state change:', error)
                    if (isMounted) {
                        setUser(null)
                        setUserProfile(null)
                    }
                }

                // Set loading to false on any auth state change
                if (isMounted) {
                    setLoading(false)
                }
            }
        )

        return () => {
            isMounted = false
            clearTimeout(timeoutId)
            subscription.unsubscribe()
        }
    }, [supabase, router])

    const signOut = async () => {
        console.log('signOut function called')
        try {
            await supabase.auth.signOut()
            // Use Next.js router for navigation
            router.push('/login')
            router.refresh() // Force refresh to clear cached state
        } catch (error) {
            console.error('Error signing out:', error)
            // Even if signOut fails, redirect to login
            router.push('/login')
        }
    }

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
