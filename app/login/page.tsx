"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { BastaLogo } from '@/components/basta-logo'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(error.message)
            } else {
                router.push('/dashboard')
                router.refresh()
            }
        } catch (err) {
            setError('Une erreur est survenue')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background avec gradient et formes géométriques */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3A14E2] via-[#4A24F2] to-[#2A04D2]">
                {/* Formes géométriques décoratives */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute top-40 right-32 w-24 h-24 bg-white/15 rounded-full blur-lg"></div>
                    <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-20 right-20 w-28 h-28 bg-white/10 rounded-full blur-xl"></div>
                    
                    {/* Formes triangulaires */}
                    <div className="absolute top-1/3 right-1/4 w-0 h-0 border-l-[30px] border-r-[30px] border-b-[50px] border-l-transparent border-r-transparent border-b-white/10 rotate-45"></div>
                    <div className="absolute bottom-1/3 left-1/3 w-0 h-0 border-l-[20px] border-r-[20px] border-b-[35px] border-l-transparent border-r-transparent border-b-white/15 rotate-12"></div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md">
                    {/* Logo et titre */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                            <BastaLogo className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Basta</h1>
                        <p className="text-white/80 text-sm">Tableau de bord administrateur</p>
                    </div>

                    {/* Formulaire de connexion */}
                    <Card className="backdrop-blur-sm bg-white/95 border-white/20 shadow-2xl">
                        <CardHeader className="space-y-1 pb-6">
                            <CardTitle className="text-2xl font-bold text-center text-gray-900">
                                Connexion
                            </CardTitle>
                            <CardDescription className="text-center text-gray-600">
                                Accédez à votre espace administrateur
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                        Adresse email
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="h-12 border-gray-200 focus:border-[#3A14E2] focus:ring-[#3A14E2]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                        Mot de passe
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="h-12 border-gray-200 focus:border-[#3A14E2] focus:ring-[#3A14E2]"
                                    />
                                </div>
                                {error && (
                                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                                        {error}
                                    </div>
                                )}
                                <Button 
                                    type="submit" 
                                    className="w-full h-12 bg-[#3A14E2] hover:bg-[#2A04D2] text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl" 
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Connexion en cours...
                                        </>
                                    ) : (
                                        'Se connecter'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <div className="text-center mt-8">
                        <p className="text-white/60 text-xs">
                            © 2024 Basta. Tous droits réservés.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
