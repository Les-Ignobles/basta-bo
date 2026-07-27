"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type FullScreenSheetProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: React.ReactNode
    description?: React.ReactNode
    /** Actions affichées à droite de l'en-tête (ex: bouton Enregistrer). */
    headerActions?: React.ReactNode
    /** Largeur max du contenu scrollable (centré). Par défaut max-w-3xl. */
    contentClassName?: string
    children: React.ReactNode
}

/**
 * Feuille plein écran qui apparaît du bas vers le haut, avec en-tête collant et
 * corps scrollable. Adaptée aux formulaires longs sur petits écrans (remplace
 * les Dialog qui débordent).
 */
export function FullScreenSheet({
    open,
    onOpenChange,
    title,
    description,
    headerActions,
    contentClassName,
    children,
}: FullScreenSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="h-[100dvh] w-full max-w-none gap-0 rounded-none p-0 flex flex-col"
            >
                <SheetHeader className="flex-row items-center justify-between gap-4 space-y-0 border-b px-6 py-4 pr-14">
                    <div className="space-y-1 min-w-0">
                        <SheetTitle className="font-christmas text-xl truncate">{title}</SheetTitle>
                        {description ? <SheetDescription>{description}</SheetDescription> : null}
                    </div>
                    {headerActions ? (
                        <div className="flex items-center gap-2 shrink-0">{headerActions}</div>
                    ) : null}
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                    <div className={cn("mx-auto w-full max-w-3xl px-6 py-6", contentClassName)}>
                        {children}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
