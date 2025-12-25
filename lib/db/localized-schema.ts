import { z } from 'zod'
import { routing } from '@/i18n/routing'

/**
 * Schema Zod per LocalizedField
 * Accetta oggetto con chiavi locali e valori stringa
 */
export const localizedFieldSchema = z
  .record(
    z.enum(routing.locales as unknown as [string, ...string[]]),
    z.string().optional()
  )
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Almeno una traduzione richiesta',
  })

/**
 * Schema Zod per LocalizedArray
 */
export const localizedArraySchema = z.array(localizedFieldSchema)

/**
 * Schema opzionale per LocalizedField
 */
export const optionalLocalizedFieldSchema = localizedFieldSchema.optional()

/**
 * Schema opzionale per LocalizedArray
 */
export const optionalLocalizedArraySchema = localizedArraySchema.optional()
