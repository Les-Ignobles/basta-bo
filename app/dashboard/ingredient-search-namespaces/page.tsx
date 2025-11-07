'use client';

import { useEffect } from 'react';
import { useIngredientSearchNamespaceStore } from '@/features/cooking/stores/ingredient-search-namespace-store';
import { NamespaceIngredientManager } from '@/features/cooking/components/namespace-ingredient-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function IngredientSearchNamespacesPage() {
  const {
    namespaces,
    ingredientsForNamespace,
    selectedNamespace,
    loading,
    error,
    fetchNamespaces,
    fetchIngredientsForNamespace,
    setSelectedNamespace,
    addIngredientToNamespace,
    removeIngredientFromNamespace,
  } = useIngredientSearchNamespaceStore();

  // Fetch initial data
  useEffect(() => {
    fetchNamespaces();
  }, [fetchNamespaces]);

  // Load first namespace by default
  useEffect(() => {
    if (namespaces.length > 0 && !selectedNamespace) {
      const firstNamespace = namespaces[0];
      setSelectedNamespace(firstNamespace);
      fetchIngredientsForNamespace(firstNamespace.bit_index);
    }
  }, [
    fetchIngredientsForNamespace,
    namespaces,
    selectedNamespace,
    setSelectedNamespace,
  ]);

  const handleTabChange = (value: string) => {
    const namespace = namespaces.find((ns) => ns.name === value);
    if (namespace) {
      setSelectedNamespace(namespace);
      fetchIngredientsForNamespace(namespace.bit_index);
    }
  };

  const handleToggleIngredient = async (
    ingredientId: number,
    isCurrentlyInNamespace: boolean
  ) => {
    if (!selectedNamespace) return;

    try {
      if (isCurrentlyInNamespace) {
        await removeIngredientFromNamespace(
          ingredientId,
          selectedNamespace.bit_index
        );
      } else {
        await addIngredientToNamespace(
          ingredientId,
          selectedNamespace.bit_index
        );
      }
    } catch (error) {
      console.error('Error toggling ingredient:', error);
    }
  };

  return (
    <div className='container mx-auto space-y-6 py-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Search Namespaces</h1>
        <p className='text-muted-foreground mt-2'>
          Gérez les namespaces de recherche et les ingrédients associés
        </p>
      </div>

      {error && (
        <div className='rounded-md border border-red-500 bg-red-50 p-4'>
          <p className='text-sm text-red-600'>{error}</p>
        </div>
      )}

      {namespaces.length === 0 && !loading ? (
        <div className='border-muted bg-muted/50 rounded-md border p-4'>
          <p className='text-muted-foreground text-sm'>
            Aucun namespace trouvé. Les namespaces sont créés automatiquement
            par la migration SQL.
          </p>
        </div>
      ) : (
        <Tabs value={selectedNamespace?.name} onValueChange={handleTabChange}>
          <TabsList className='grid w-full grid-cols-3'>
            {namespaces.map((namespace) => (
              <TabsTrigger
                key={namespace.id}
                value={namespace.name}
                className='capitalize'
              >
                {namespace.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {namespaces.map((namespace) => (
            <TabsContent
              key={namespace.id}
              value={namespace.name}
              className='mt-6'
            >
              <NamespaceIngredientManager
                namespaceName={namespace.name}
                bitIndex={namespace.bit_index}
                ingredients={ingredientsForNamespace}
                loading={loading}
                onToggle={handleToggleIngredient}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
