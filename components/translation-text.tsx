"use client"
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TranslationText, ISO639_1 } from '@/lib/i18n'
import { Progress } from '@/components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

type Props = {
    label?: string
    value: TranslationText
    onChange: (val: TranslationText) => void
    disabled?: boolean
}

export function TranslationTextField({ label, value, onChange, disabled }: Props) {
    const [loading, setLoading] = useState(false)

    const totalTranslatable = useMemo(() => ISO639_1.filter((l) => l !== 'fr').length, [])
    const translatedCount = useMemo(() => {
        let count = 0
        for (const lang of ISO639_1) {
            if (lang === 'fr') continue
            if ((value as any)[lang] && (value as any)[lang].length > 0) count += 1
        }
        return count
    }, [value])
    const progress = totalTranslatable > 0 ? Math.round((translatedCount / totalTranslatable) * 100) : 0

    async function translateAll() {
        if (!value.fr) return;

        try {
            setLoading(true)

            // Always include 'fr' for auto-correction, plus missing languages
            const allLanguages = ['fr', 'en', 'es'];
            const languagesToTranslate = allLanguages.filter(lang =>
                lang === 'fr' || !value[lang as keyof TranslationText]
            );

            if (languagesToTranslate.length === 0) {
                return;
            }

            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: value.fr,
                    source: 'fr',
                    languages: languagesToTranslate
                }),
            });

            const translations = await res.json();

            // Merge translations with existing values
            const newValues = { ...value, ...translations };
            onChange(newValues);
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-2">
            {label ? <div className="text-sm font-medium">{label}</div> : null}

            <div className="grid gap-2">
                <div className="flex items-center gap-2">
                    <Input
                        value={value.fr ?? ''}
                        onChange={(e) => onChange({ ...value, fr: e.target.value })}
                        placeholder="Texte en français"
                        disabled={disabled}
                    />
                    <Button size="sm" variant="outline" onClick={translateAll} disabled={disabled || loading || !value.fr}>
                        Traduire
                    </Button>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progression des traductions</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                </div>
            </div>

            <Accordion type="single" collapsible className="w-full mt-1">
                <AccordionItem value="translations">
                    <AccordionTrigger className="text-xs">Autres langues</AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Anglais (en)</div>
                                <Input
                                    value={value.en ?? ''}
                                    onChange={(e) => onChange({ ...value, en: e.target.value })}
                                    placeholder="English text"
                                    disabled={disabled}
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Espagnol (es)</div>
                                <Input
                                    value={(value as any).es ?? ''}
                                    onChange={(e) => onChange({ ...(value as any), es: e.target.value } as TranslationText)}
                                    placeholder="Texto en español"
                                    disabled={disabled}
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}


