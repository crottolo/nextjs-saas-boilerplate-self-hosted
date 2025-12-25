'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { routing } from '@/i18n/routing'
import type { LocalizedField } from '@/lib/db/localized'

// Mappa locale -> info display
const LOCALE_INFO: Record<string, { flag: string; name: string }> = {
  en: { flag: '🇬🇧', name: 'English' },
  it: { flag: '🇮🇹', name: 'Italiano' },
  cz: { flag: '🇨🇿', name: 'Cestina' },
}

interface TranslationInputProps {
  /** Label del campo */
  label: string
  /** Valore corrente (LocalizedField o stringa) */
  value: LocalizedField | string | null | undefined
  /** Callback quando il valore cambia */
  onChange: (value: LocalizedField) => void
  /** Usa textarea invece di input */
  multiline?: boolean
  /** Placeholder per i campi */
  placeholder?: string
  /** Campo richiesto */
  required?: boolean
  /** Disabilitato */
  disabled?: boolean
}

export function TranslationInput({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  required = false,
  disabled = false,
}: TranslationInputProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<LocalizedField>({})

  // Normalizza il valore in LocalizedField
  const normalizedValue: LocalizedField =
    typeof value === 'string' ? { en: value } : (value ?? {})

  // Valore da mostrare nell'input principale (prima lingua disponibile)
  const displayValue =
    normalizedValue.en || normalizedValue.it || normalizedValue.cz || ''

  // Conta traduzioni presenti
  const translationCount = Object.values(normalizedValue).filter(Boolean).length
  const totalLocales = routing.locales.length

  // Apre il dialog e inizializza il draft
  const handleOpen = () => {
    setDraft({ ...normalizedValue })
    setOpen(true)
  }

  // Salva le modifiche
  const handleSave = () => {
    // Rimuove valori vuoti
    const cleaned: LocalizedField = {}
    for (const [key, val] of Object.entries(draft)) {
      if (val?.trim()) {
        cleaned[key as keyof LocalizedField] = val.trim()
      }
    }
    onChange(cleaned)
    setOpen(false)
  }

  // Aggiorna un singolo locale nel draft
  const updateDraft = (locale: string, text: string) => {
    setDraft((prev) => ({ ...prev, [locale]: text }))
  }

  const InputComponent = multiline ? Textarea : Input

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <div className="flex gap-2">
        {/* Input principale (mostra valore EN o primo disponibile) */}
        <div className="flex-1">
          <InputComponent
            value={displayValue}
            onChange={(e) =>
              onChange({ ...normalizedValue, en: e.target.value })
            }
            placeholder={placeholder}
            className="w-full"
            disabled={disabled}
          />
        </div>

        {/* Bottone traduzioni */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleOpen}
              className="shrink-0 relative"
              title="Gestisci traduzioni"
              disabled={disabled}
            >
              <Globe className="h-4 w-4" />
              {translationCount < totalLocales && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-[10px] text-white flex items-center justify-center">
                  {translationCount}
                </span>
              )}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Traduzioni - {label}</DialogTitle>
              <DialogDescription>
                Inserisci il testo per ogni lingua supportata
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {routing.locales.map((locale) => {
                const info = LOCALE_INFO[locale] ?? { flag: '🏳️', name: locale }
                return (
                  <div key={locale} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span>{info.flag}</span>
                      <span>{info.name}</span>
                      {locale === 'en' && (
                        <span className="text-xs text-muted-foreground">
                          (default)
                        </span>
                      )}
                    </Label>
                    <InputComponent
                      value={draft[locale as keyof LocalizedField] ?? ''}
                      onChange={(e) => updateDraft(locale, e.target.value)}
                      placeholder={`${placeholder ?? label} in ${info.name}`}
                    />
                  </div>
                )
              })}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleSave}>Salva traduzioni</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Indicatore traduzioni mancanti */}
      {translationCount < totalLocales && translationCount > 0 && (
        <p className="text-xs text-amber-600">
          {totalLocales - translationCount} traduzion
          {totalLocales - translationCount === 1 ? 'e' : 'i'} mancant
          {totalLocales - translationCount === 1 ? 'e' : 'i'}
        </p>
      )}
    </div>
  )
}
