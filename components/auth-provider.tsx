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
                // Timeout de 3 secondes pour éviter que getSession reste bloqué
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('getSession timeout')), 3000)
                )

                const sessionPromise = supabase.auth.getSession()

                const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any

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
                console.error('Error in checkAuth:', error)
                if (isMounted) {
                    setUser(null)
                    setUserProfile(null)
                    setLoading(false)
                }
            }
        }

        checkAuth()

        return () => {
            isMounted = false
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