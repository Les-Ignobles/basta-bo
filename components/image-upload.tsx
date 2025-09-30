"use client"
import { useState, useRef } from 'react'
import { X, Image as ImageIcon } from 'lucide-react'
import { slugify } from '@/lib/utils'

type Props = {
    value?: string
    onChange: (url: string | null) => void
    bucket?: 'ingredients' | 'recipes'
    disabled?: boolean
    ingredientName?: string
}

export function ImageUpload({ value, onChange, bucket = 'ingredients', disabled, ingredientName }: Props) {
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleFileUpload(file: File) {
        if (!file.type.startsWith('image/')) {
            alert('Veuillez sélectionner une image')
            return
        }

        setUploading(true)
        try {
            // Generate filename with naming convention
            const fileExt = file.name.split('.').pop()
            let fileName: string

            if (ingredientName) {
                // Use naming convention: ${slugify(ingredient.name.fr)}-${timestamp}
                const slug = slugify(ingredientName)
                const timestamp = Date.now()
                fileName = `${slug}-${timestamp}.${fileExt}`
            } else {
                // Fallback if no name provided
                const timestamp = Date.now()
                const randomId = Math.random().toString(36).substring(2, 15)
                fileName = `${timestamp}-${randomId}.${fileExt}`
            }

            const formData = new FormData()
            formData.append('file', file)
            formData.append('bucket', bucket)
            formData.append('fileName', fileName)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const json = await res.json()
            if (json.url) {
                onChange(json.url)
            } else {
                alert('Erreur lors de l\'upload: ' + (json.error || 'Erreur inconnue'))
            }
        } catch {
            alert('Erreur lors de l\'upload')
        } finally {
            setUploading(false)
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFileUpload(file)
    }

    function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) handleFileUpload(file)
    }

    return (
        <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Image</div>

            {value ? (
                <div className="relative inline-block">
                    <img
                        src={value}
                        alt="Preview"
                        className="h-20 w-20 rounded object-cover border"
                    />
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        disabled={disabled}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ) : (
                <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => !disabled && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                        className="hidden"
                        disabled={disabled}
                    />
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        {uploading ? 'Upload en cours...' : 'Glissez une image ou cliquez pour sélectionner'}
                    </p>
                </div>
            )}
        </div>
    )
}
