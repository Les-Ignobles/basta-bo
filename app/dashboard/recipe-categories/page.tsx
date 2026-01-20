"use client"
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RecipeCategoryForm } from '@/features/cooking/components/recipe-category-form'
import type { RecipeCategory, RecipeCategoryFormValues } from '@/features/cooking/types/recipe-category'
import { Pencil, Trash2, Pin, Tags, ListOrdered } from 'lucide-react'
import Link from 'next/link'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function RecipeCategoriesPage() {
    const [categories, setCategories] = useState<RecipeCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<RecipeCategory | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<RecipeCategory | null>(null)

    const fetchCategories = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/recipe-categories')
            const { data } = await response.json()
            setCategories(data || [])
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const handleSubmit = async (values: RecipeCategoryFormValues) => {
        try {
            if (editingCategory) {
                await fetch('/api/recipe-categories', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingCategory.id, ...values }),
                })
            } else {
                await fetch('/api/recipe-categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(values),
                })
            }
            setOpen(false)
            setEditingCategory(null)
            fetchCategories()
        } catch (error) {
            console.error('Error saving category:', error)
        }
    }

    const handleDelete = async () => {
        if (!categoryToDelete) return

        try {
            await fetch(`/api/recipe-categories?id=${categoryToDelete.id}`, {
                method: 'DELETE',
            })
            setDeleteDialogOpen(false)
            setCategoryToDelete(null)
            fetchCategories()
        } catch (error) {
            console.error('Error deleting category:', error)
        }
    }

    const handleEdit = (category: RecipeCategory) => {
        setEditingCategory(category)
        setOpen(true)
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            setEditingCategory(null)
        }
    }

    const getFormDefaultValues = (): Partial<RecipeCategoryFormValues> | undefined => {
        if (!editingCategory) return undefined
        return {
            name_fr: editingCategory.name.fr,
            name_en: editingCategory.name.en || '',
            emoji: editingCategory.emoji,
            color: editingCategory.color,
            is_pinned: editingCategory.is_pinned,
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold font-christmas">Catégories de recettes</h1>
                    <Badge variant="secondary" className="flex items-center gap-2">
                        <Tags className="h-4 w-4" />
                        {categories.length} catégorie{categories.length > 1 ? 's' : ''}
                    </Badge>
                </div>
                <Dialog open={open} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button disabled={loading}>Nouvelle catégorie</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="font-christmas">
                                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                            </DialogTitle>
                        </DialogHeader>
                        <RecipeCategoryForm
                            key={editingCategory?.id || 'new'}
                            onSubmit={handleSubmit}
                            defaultValues={getFormDefaultValues()}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">ID</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Nom EN</TableHead>
                            <TableHead className="w-24">Couleur</TableHead>
                            <TableHead className="w-24 text-center">Épinglé</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Chargement...
                                </TableCell>
                            </TableRow>
                        ) : categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Aucune catégorie. Créez-en une !
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-mono text-muted-foreground">
                                        {category.id}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{category.emoji}</span>
                                            <span className="font-medium">{category.name.fr}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {category.name.en || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded border"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {category.color}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {category.is_pinned && (
                                            <Pin className="h-4 w-4 mx-auto text-primary" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                                title="Gérer l'ordre des recettes"
                                            >
                                                <Link href={`/dashboard/recipe-categories/${category.id}/order`}>
                                                    <ListOrdered className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(category)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setCategoryToDelete(category)
                                                    setDeleteDialogOpen(true)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action supprimera la catégorie &quot;{categoryToDelete?.emoji} {categoryToDelete?.name.fr}&quot;.
                            Les recettes associées ne seront pas supprimées, seul le lien sera retiré.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
