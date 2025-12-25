import { routing } from '@/i18n/routing'

/**
 * Tipo per campi multilingua JSONB
 * Tutte le lingue sono opzionali per permettere traduzioni parziali
 */
export type LocalizedField = Partial<
  Record<(typeof routing.locales)[number], string>
>

/**
 * Array di contenuti localizzati (es: features di un prodotto)
 */
export type LocalizedArray = LocalizedField[]

/**
 * Estrae il valore tradotto per la lingua corrente
 *
 * @param field - Campo JSONB multilingua
 * @param locale - Lingua corrente (es: 'it')
 * @param fallback - Lingua di fallback (default: 'en')
 * @returns Stringa tradotta o stringa vuota
 *
 * @example
 * const name = getLocalized({ en: "Hello", it: "Ciao" }, "it"); // "Ciao"
 * const name = getLocalized({ en: "Hello" }, "it"); // "Hello" (fallback)
 */
export function getLocalized(
  field: LocalizedField | null | undefined,
  locale: string,
  fallback: string = 'en'
): string {
  if (!field) return ''

  const value = field[locale as keyof LocalizedField]
  if (value) return value

  const fallbackValue = field[fallback as keyof LocalizedField]
  if (fallbackValue) return fallbackValue

  // Ritorna il primo valore disponibile
  const firstValue = Object.values(field).find((v) => v)
  return firstValue ?? ''
}

/**
 * Estrae array tradotto
 */
export function getLocalizedArray(
  items: LocalizedArray | null | undefined,
  locale: string,
  fallback: string = 'en'
): string[] {
  if (!items || !Array.isArray(items)) return []
  return items.map((item) => getLocalized(item, locale, fallback))
}
