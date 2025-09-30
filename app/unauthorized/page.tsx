"use client"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, LogOut } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

export default function UnauthorizedPage() {
    const router = useRouter()
    const { signOut } = useAuth()

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-red-600 font-christmas">Accès non autorisé</CardTitle>
                    <CardDescription>
                        Vous n&apos;avez pas les droits d&apos;administration nécessaires pour accéder à cette page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-sm text-gray-600 text-center">
                        <p>Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez votre administrateur.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="w-full"
                        >
                            Retour
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleSignOut}
                            className="w-full"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Se déconnecter
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
