# Utilisation du composant ImageUpload

## Fonctionnalités

Le composant `ImageUpload` permet maintenant à l'utilisateur de choisir la taille de l'image à uploader, tout en conservant les valeurs par défaut actuelles.

## Props

```typescript
type Props = {
    value?: string
    onChange: (url: string | null) => void
    bucket?: 'ingredients' | 'recipes'
    disabled?: boolean
    ingredientName?: string
    targetSize?: number
    allowSizeSelection?: boolean  // Nouvelle prop
}
```

## Utilisation

### 1. Mode par défaut (sans sélection de taille)

```tsx
// Ingrédients (100px par défaut)
<ImageUpload
    value={ingredient.img_path}
    onChange={(url) => setIngredient({...ingredient, img_path: url})}
    bucket="ingredients"
    ingredientName={ingredient.name.fr}
/>

// Recettes (200px par défaut)
<ImageUpload
    value={recipe.img_path}
    onChange={(url) => setRecipe({...recipe, img_path: url})}
    bucket="recipes"
    targetSize={200}
/>
```

### 2. Mode avec sélection de taille

```tsx
// Permet à l'utilisateur de choisir la taille
<ImageUpload
    value={imageUrl}
    onChange={setImageUrl}
    bucket="recipes"
    allowSizeSelection={true}
    ingredientName="nom-de-l-ingredient"
/>
```

## Tailles disponibles

Quand `allowSizeSelection={true}`, l'utilisateur peut choisir parmi :
- 50px
- 100px (défaut pour ingrédients)
- 150px
- 200px (défaut pour recettes)
- 300px
- 400px
- 500px

## Valeurs par défaut

- **Ingrédients** : 100px
- **Recettes** : 200px

Ces valeurs sont automatiquement appliquées selon le `bucket` ou peuvent être surchargées avec `targetSize`.

## Exemple complet

```tsx
function MyForm() {
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [allowCustomSize, setAllowCustomSize] = useState(false)

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="customSize"
                    checked={allowCustomSize}
                    onChange={(e) => setAllowCustomSize(e.target.checked)}
                />
                <label htmlFor="customSize">Permettre la sélection de taille</label>
            </div>
            
            <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                bucket="recipes"
                allowSizeSelection={allowCustomSize}
                ingredientName="Mon ingredient"
            />
        </div>
    )
}
```
