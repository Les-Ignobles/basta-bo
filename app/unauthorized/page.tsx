"use client"

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
    const router = useRouter()

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Accès non autorisé</h1>
                <p className="text-gray-600 mb-4">
                    Vous n&apos;avez pas les droits nécessaires pour accéder à cette page.
                </p>
                <Button
                    onClick={handleLogout}
                    variant="outline"
                >
                    Se déconnecter et retourner à la connexion
                </Button>
            </div>
        </div>
    )
}