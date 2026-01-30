'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2 } from 'lucide-react'
import { useSubscriptionStore } from '../stores/subscription-store'

export function UserSearchForm() {
  const { searchQuery, setSearchQuery, searchUser, searching } = useSubscriptionStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchUser()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher par email ou UUID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          disabled={searching}
        />
      </div>
      <Button type="submit" disabled={searching || !searchQuery.trim()}>
        {searching ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Recherche...
          </>
        ) : (
          'Rechercher'
        )}
      </Button>
    </form>
  )
}
