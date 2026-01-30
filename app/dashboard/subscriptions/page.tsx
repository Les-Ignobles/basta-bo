'use client'

import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import { UserSearchForm } from '@/features/subscriptions/components/user-search-form'
import { UserProfileCard } from '@/features/subscriptions/components/user-profile-card'
import { SubscriptionActions } from '@/features/subscriptions/components/subscription-actions'
import { useSubscriptionStore } from '@/features/subscriptions/stores/subscription-store'

export default function SubscriptionsPage() {
  const { reset, authUser, userProfile } = useSubscriptionStore()

  // Reset store when leaving the page
  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Gestion des abonnements</h1>
        <Badge variant="secondary">
          <Users className="size-3 mr-1" />
          Support
        </Badge>
      </div>

      {/* Description */}
      <p className="text-muted-foreground">
        Recherchez un utilisateur par email ou UUID pour modifier sa date de fin d&apos;abonnement premium.
        Utilisez cette page pour offrir des dédommagements (1 mois ou 1 an d&apos;abonnement).
      </p>

      {/* Search Form */}
      <UserSearchForm />

      {/* Results */}
      {authUser && (
        <div className="grid gap-6 md:grid-cols-2">
          <UserProfileCard />
          {userProfile && <SubscriptionActions />}
        </div>
      )}
    </div>
  )
}
