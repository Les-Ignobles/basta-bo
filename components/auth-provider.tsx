"use client"
import { createContext, useContext, useEffect, useState } from 'react'
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
    const supabase = createClient()

    useEffect(() => {
        const getInitialSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()
                
                if (error) {
                    console.error('Error getting session:', error)
                    setUser(null)
                    setUserProfile(null)
                    setLoading(false)
                    return
                }

                setUser(session?.user ?? null)

                if (session?.user) {
                    // Fetch user profile
                    const { data: profile, error: profileError } = await supabase
                        .from('user_profiles')
                        .select('id, email, firstname, avatar, is_admin')
                        .eq('uuid', session.user.id)
                        .single()

                    if (profileError) {
                        console.error('Error fetching user profile:', profileError)
                        setUserProfile(null)
                    } else {
                        setUserProfile(profile)
                    }
                } else {
                    setUserProfile(null)
                }
            } catch (error) {
                console.error('Error getting initial session:', error)
                setUser(null)
                setUserProfile(null)
            } finally {
                setLoading(false)
            }
        }

        getInitialSession()

        // Timeout de sécurité pour éviter le loading infini
        const timeoutId = setTimeout(() => {
            console.warn('Auth loading timeout - forcing loading to false')
            setLoading(false)
        }, 5000) // 5 secondes max

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event, session?.user?.id)
                
                try {
                    setUser(session?.user ?? null)

                    if (session?.user) {
                        // Fetch user profile
                        const { data: profile, error } = await supabase
                            .from('user_profiles')
                            .select('id, email, firstname, avatar, is_admin')
                            .eq('uuid', session.user.id)
                            .single()

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
                    setUser(null)
                    setUserProfile(null)
                }
                
                // Only set loading to false on initial load or sign out
                if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
                    setLoading(false)
                }
            }
        )

        return () => {
            clearTimeout(timeoutId)
            subscription.unsubscribe()
        }
    }, [supabase])

    const signOut = async () => {
        try {
            await supabase.auth.signOut()
            // Force a hard redirect to clear all cached state
            window.location.replace('/login')
        } catch (error) {
            console.error('Error signing out:', error)
            // Even if signOut fails, redirect to login
            window.location.replace('/login')
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
