'use client'

import { useLocale } from 'next-intl'
import {
  getLocalized,
  getLocalizedArray,
  type LocalizedField,
  type LocalizedArray,
} from '@/lib/db/localized'

/**
 * Hook per Client Components
 *
 * @example
 * const { t, tArray, locale } = useLocalizedContent();
 *
 * <h1>{t(product.description)}</h1>
 * <ul>{tArray(product.features).map(f => <li key={f}>{f}</li>)}</ul>
 */
export function useLocalizedContent() {
  const locale = useLocale()

  return {
    /** Traduce un campo singolo */
    t: (field: LocalizedField | null | undefined) =>
      getLocalized(field, locale),

    /** Traduce un array di campi */
    tArray: (items: LocalizedArray | null | undefined) =>
      getLocalizedArray(items, locale),

    /** Locale corrente */
    locale,
  }
}
