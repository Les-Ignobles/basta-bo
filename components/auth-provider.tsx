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
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                // Fetch user profile
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('id, email, firstname, avatar, is_admin')
                    .eq('uuid', user.id)
                    .single()

                setUserProfile(profile)
            }

            setLoading(false)
        }

        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null)

                if (session?.user) {
                    // Fetch user profile
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('id, email, firstname, avatar, is_admin')
                        .eq('uuid', session.user.id)
                        .single()

                    setUserProfile(profile)
                } else {
                    setUserProfile(null)
                }

                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [supabase])

    const signOut = async () => {
        await supabase.auth.signOut()
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
