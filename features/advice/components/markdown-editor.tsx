"use client"

import { useState, useEffect } from 'react'
import MDEditor from '@uiw/react-md-editor'
import type { TranslationText } from '@/lib/i18n'

interface MarkdownEditorProps {
    value: TranslationText
    onChange: (value: TranslationText) => void
    height?: number
}

export function MarkdownEditor({ value, onChange, height = 400 }: MarkdownEditorProps) {
    const [currentValue, setCurrentValue] = useState(value)

    useEffect(() => {
        setCurrentValue(value)
    }, [value])

    const handleChange = (newValue: string | undefined) => {
        const finalValue = newValue || ''
        setCurrentValue({ ...currentValue, fr: finalValue })
        onChange({ ...currentValue, fr: finalValue })
    }

    return (
        <div className="border rounded-md">
            <MDEditor
                value={currentValue?.fr || ''}
                onChange={handleChange}
                height={height}
                data-color-mode="light"
            />
        </div>
    )
}
