"use client"
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { RoleScope } from '@/lib/types/auth'

type UserProfile = {
    id: number
    email: string
    firstname: string
    avatar: string
    is_admin?: boolean
    role_scopes?: RoleScope[]
}

type AuthContextType = {
    user: User | null
    userProfile: UserProfile | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    console.log('🏗️ AuthProvider component rendering')

    const [user, setUser] = useState<User | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        let isMounted = true

        const checkAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()

                if (!isMounted) return

                if (error) {
                    console.error('Error getting session:', error)
                    setLoading(false)
                    return
                }

                if (session?.user) {
                    setUser(session.user)

                    // Fetch user profile
                    const { data: profile, error: profileError } = await supabase
                        .from('user_profiles')
                        .select('id, email, firstname, avatar, is_admin, role_scopes')
                        .eq('uuid', session.user.id)
                        .single()

                    if (!isMounted) return

                    if (profileError) {
                        console.error('Error fetching user profile:', profileError)
                        setUserProfile(null)
                    } else {
                        setUserProfile(profile)
                    }
                } else {
                    setUser(null)
                    setUserProfile(null)
                }

                setLoading(false)
            } catch (error) {
                console.error('Error in checkAuth:', error)
                if (isMounted) {
                    setUser(null)
                    setUserProfile(null)
                    setLoading(false)
                }
            }
        }

        checkAuth()

        // S'abonner aux changements d'état d'authentification
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔄 Auth state changed:', event)

            if (!isMounted) return

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user) {
                    setUser(session.user)

                    // Fetch user profile
                    const { data: profile, error: profileError } = await supabase
                        .from('user_profiles')
                        .select('id, email, firstname, avatar, is_admin, role_scopes')
                        .eq('uuid', session.user.id)
                        .single()

                    if (!isMounted) return

                    if (profileError) {
                        console.error('Error fetching user profile:', profileError)
                        setUserProfile(null)
                    } else {
                        setUserProfile(profile)
                    }
                }
                setLoading(false)
            } else if (event === 'SIGNED_OUT') {
                setUser(null)
                setUserProfile(null)
                setLoading(false)
            }
        })

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, [supabase])

    const signOut = async () => {
        try {
            await supabase.auth.signOut()
            router.push('/login')
            router.refresh()
        } catch (error) {
            console.error('Error signing out:', error)
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