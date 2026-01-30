'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Mail, Calendar, Crown, AlertTriangle, Loader2 } from 'lucide-react'
import { useSubscriptionStore } from '../stores/subscription-store'

export function UserProfileCard() {
  const {
    authUser,
    userProfile,
    canCreateProfile,
    createProfile,
    updating,
    updateError
  } = useSubscriptionStore()

  if (!authUser) return null

  const isPremium = userProfile?.premium_sub_end_at
    ? new Date(userProfile.premium_sub_end_at) > new Date()
    : false

  const formatDate = (date: string | null) => {
    if (!date) return 'Jamais'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Profil utilisateur</CardTitle>
          {userProfile && (
            <Badge variant={isPremium ? 'default' : 'secondary'}>
              <Crown className="size-3 mr-1" />
              {isPremium ? 'Premium actif' : 'Non premium'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {updateError && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>{updateError}</AlertDescription>
          </Alert>
        )}

        {/* Auth User Info */}
        <div className="grid gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{authUser.email || 'Non renseigné'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">UUID:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">{authUser.id}</code>
          </div>
        </div>

        {/* User Profile Info or Create Profile */}
        {userProfile ? (
          <div className="grid gap-3 pt-3 border-t">
            {userProfile.firstname && (
              <div className="flex items-center gap-2 text-sm">
                <User className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Prénom:</span>
                <span className="font-medium">{userProfile.firstname}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Fin d'abonnement:</span>
              <span className={`font-medium ${isPremium ? 'text-green-600' : 'text-muted-foreground'}`}>
                {formatDate(userProfile.premium_sub_end_at)}
              </span>
            </div>
          </div>
        ) : canCreateProfile ? (
          <div className="pt-3 border-t">
            <Alert>
              <AlertTriangle className="size-4" />
              <AlertDescription>
                Cet utilisateur existe dans Supabase Auth mais n'a pas encore de profil.
                Vous pouvez créer un profil minimal pour lui attribuer un abonnement.
              </AlertDescription>
            </Alert>
            <Button
              onClick={createProfile}
              disabled={updating}
              className="mt-3"
              variant="outline"
            >
              {updating ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer un profil minimal'
              )}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
