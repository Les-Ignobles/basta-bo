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
        const getUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                setUser(user)

                if (user) {
                    // Fetch user profile
                    const { data: profile, error } = await supabase
                        .from('user_profiles')
                        .select('id, email, firstname, avatar, is_admin')
                        .eq('uuid', user.id)
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
                console.error('Error getting user:', error)
                setUser(null)
                setUserProfile(null)
            } finally {
                setLoading(false)
            }
        }

        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
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
                } finally {
                    setLoading(false)
                }
            }
        )

        return () => subscription.unsubscribe()
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
