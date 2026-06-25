import type { ZodError } from 'zod'

export function formatZodError(error: ZodError): string {
  return error.issues.map(i => i.message).join('|')
}
