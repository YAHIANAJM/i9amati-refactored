// Input sanitization — first line of defense against injection attacks

export interface SanitizedResult {
  clean: string
  blocked: boolean
  reason?: string
}

const MAX_INPUT_LENGTH = 500

export function sanitizeInput(raw: string): SanitizedResult {
  // 1. Check for empty input
  if (!raw || typeof raw !== 'string') {
    return { clean: '', blocked: true, reason: 'Empty or invalid input' }
  }

  let text = raw

  // 2. Normalize Unicode (NFC form) to prevent homoglyph attacks
  text = text.normalize('NFC')

  // 3. Strip HTML and script tags
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<\/?(\w+)[^>]*>/g, '')
  text = text.replace(/&[a-z]+;/gi, ' ')

  // 4. Remove control characters (except newline and tab)
  // eslint-disable-next-line no-control-regex
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // 5. Collapse excessive whitespace
  text = text.replace(/[\t ]{3,}/g, '  ')
  text = text.replace(/\n{4,}/g, '\n\n\n')

  // 6. Trim
  text = text.trim()

  // 7. Check empty after sanitization
  if (text.length === 0) {
    return { clean: '', blocked: true, reason: 'Input is empty after sanitization' }
  }

  // 8. Enforce max length
  if (text.length > MAX_INPUT_LENGTH) {
    text = text.slice(0, MAX_INPUT_LENGTH)
  }

  // 9. Check for potential code injection patterns
  const codePatterns = [
    /\beval\s*\(/i,
    /\bexec\s*\(/i,
    /\bfunction\s*\(/i,
    /\bimport\s*\(/i,
    /\brequire\s*\(/i,
    /process\.env/i,
    /__proto__/i,
    /constructor\s*\[/i,
  ]

  for (const pattern of codePatterns) {
    if (pattern.test(text)) {
      return { clean: text, blocked: true, reason: 'Potential code injection detected' }
    }
  }

  return { clean: text, blocked: false }
}
