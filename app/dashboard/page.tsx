"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomeDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Rediriger directement vers la page des ingrédients
    router.replace('/dashboard/ingredients')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Redirection vers les ingrédients...</p>
      </div>
    </div>
  )
}
