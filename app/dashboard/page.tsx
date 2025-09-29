import Link from 'next/link'
import { Salad, UtensilsCrossed } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomeDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-christmas">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenue sur le tableau de bord administrateur Basta
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/dashboard/ingredients">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Salad className="h-5 w-5" />
                Ingrédients
              </CardTitle>
              <CardDescription>
                Gérer les ingrédients et leurs catégories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ajouter, modifier et organiser les ingrédients de vos recettes
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/recipes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                Recettes
              </CardTitle>
              <CardDescription>
                Gérer les recettes et leurs équipements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Créer et organiser vos recettes avec leurs ingrédients
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
