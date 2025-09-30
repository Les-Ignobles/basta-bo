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

        // Récupérer la session existante immédiatement au démarrage
        const getInitialSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()
                if (!isMounted) return

                if (error) {
                    console.error('Error getting initial session:', error)
                    setLoading(false)
                    return
                }

                if (session?.user) {
                    setUser(session.user)
                    
                    // Fetch user profile
                    const { data: profile, error: profileError } = await supabase
                        .from('user_profiles')
                        .select('id, email, firstname, avatar, is_admin')
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
                console.error('Error in getInitialSession:', error)
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        getInitialSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return

                try {
                    setUser(session?.user ?? null)

                    if (session?.user) {
                        // Fetch user profile
                        const { data: profile, error } = await supabase
                            .from('user_profiles')
                            .select('id, email, firstname, avatar, is_admin')
                            .eq('uuid', session.user.id)
                            .single()

                        if (!isMounted) return

                        if (error) {
                            console.error('Error fetching user profile:', error)
                            setUserProfile(null)
                        } else {
                            setUserProfile(profile)
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
            subscription.unsubscribe()
        }
    }, [supabase, router])

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