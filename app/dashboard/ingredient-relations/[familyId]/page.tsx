'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ExcludeChildrenFromNamespaces } from '@/features/cooking/components/exclude-children-from-namespaces';
import { FamilyChildrenList } from '@/features/cooking/components/family-children-list';
import { FamilySuggestions } from '@/features/cooking/components/family-suggestions';

type Ingredient = {
  id: number;
  name: { fr: string };
};

type FamilyDetailPageProps = {
  params: Promise<{ familyId: string }>;
};

export default function FamilyDetailPage({ params }: FamilyDetailPageProps) {
  const router = useRouter();
  const [familyId, setFamilyId] = useState<string>('');
  const [family, setFamily] = useState<Ingredient | null>(null);
  const [children, setChildren] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Mise à jour optimiste - ajouter un enfant
  const handleChildAdded = (childId: number, childName: string) => {
    setChildren((prev) => [...prev, { id: childId, name: { fr: childName } }]);
  };

  // Mise à jour optimiste - retirer un enfant
  const handleChildRemoved = (childId: number) => {
    setChildren((prev) => prev.filter((c) => c.id !== childId));
  };

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setFamilyId(resolvedParams.familyId);
    };
    loadParams();
  }, [params]);

  const fetchFamilyData = useCallback(async () => {
    if (!familyId) return;

    setLoading(true);
    try {
      // Récupérer les infos de la famille
      const familyRes = await fetch(`/api/ingredients/${familyId}`);
      if (!familyRes.ok) {
        throw new Error('Famille introuvable');
      }
      const familyData = await familyRes.json();
      setFamily(familyData.data.ingredient);

      // Récupérer les enfants
      const relationsRes = await fetch(
        `/api/ingredient-relations?ingredientId=${familyId}`
      );
      if (!relationsRes.ok) {
        throw new Error('Erreur lors du chargement des enfants');
      }
      const relationsData = await relationsRes.json();

      // Extraire les IDs des enfants (related_ingredient_id)
      const childrenIds = relationsData.data
        .filter(
          (rel: { ingredient_id: number; related_ingredient_id: number }) =>
            rel.ingredient_id === parseInt(familyId, 10)
        )
        .map(
          (rel: { ingredient_id: number; related_ingredient_id: number }) =>
            rel.related_ingredient_id
        );

      // Récupérer les détails des enfants
      if (childrenIds.length > 0) {
        const childrenPromises = childrenIds.map((id: number) =>
          fetch(`/api/ingredients/${id}`).then((res) => res.json())
        );
        const childrenResults = await Promise.all(childrenPromises);
        setChildren(childrenResults.map((r) => r.data.ingredient));
      } else {
        setChildren([]);
      }
    } catch (error) {
      console.error('Error fetching family data:', error);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchFamilyData();
  }, [familyId, fetchFamilyData]);

  if (loading) {
    return (
      <div className='container mx-auto flex items-center justify-center py-6'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!family) {
    return (
      <div className='container mx-auto py-6'>
        <p className='text-muted-foreground text-center'>Famille introuvable</p>
      </div>
    );
  }

  return (
    <div className='container mx-auto space-y-6 py-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          onClick={() => router.push('/dashboard/ingredient-relations')}
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Retour
        </Button>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Famille : {family.name.fr}
          </h1>
          <p className='text-muted-foreground mt-2'>
            {children.length} enfant{children.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Liste des enfants */}
      <FamilyChildrenList
        familyId={parseInt(familyId, 10)}
        familyName={family.name.fr}
        childrenList={children}
        onChildAdded={handleChildAdded}
        onChildRemoved={handleChildRemoved}
      />

      {/* Suggestions sémantiques */}
      <FamilySuggestions
        familyId={parseInt(familyId, 10)}
        familyName={family.name.fr}
        existingChildrenIds={children.map((c) => c.id)}
        onChildAdded={handleChildAdded}
      />

      {/* Gestion des namespaces */}
      <ExcludeChildrenFromNamespaces
        preselectedFamilyId={parseInt(familyId, 10)}
      />
    </div>
  );
}
