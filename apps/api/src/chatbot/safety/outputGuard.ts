// Output Guard — Last line of defense before sending response to user
// Validates that the LLM response is safe and on-topic

export interface GuardResult {
  safe: boolean
  filtered: string
  reason?: string
}

const MAX_OUTPUT_LENGTH = 2000

// Patterns that should never appear in bot responses
const DANGEROUS_PATTERNS = [
  /\bsystem\s*prompt\s*:/i,
  /\bmy\s*instructions?\s*(are|say|tell)/i,
  /\bI\s*(was|am)\s*(told|instructed|programmed)\s*to/i,
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
  /\brm\s+-rf/i,
  /\bsudo\s+/i,
  /\bdrop\s+table/i,
  /\bpassword\s*[:=]/i,
  /\bapi[_\s]*key\s*[:=]/i,
  /\bsecret[_\s]*key\s*[:=]/i,
  /\bprocess\.env/i,
]

// Domain keywords — at least one should be present in a valid response
const DOMAIN_KEYWORDS = [
  'iqamati', 'إقامتي', 'syndic', 'copropriété', 'copropriétaire',
  'immeuble', 'building', 'apartment', 'owner', 'propriétaire',
  'assemblée', 'meeting', 'payment', 'charge', 'maintenance',
  'law', 'loi', 'article', 'syndicat', 'règlement',
  'morocco', 'maroc', 'moroccan', 'marocain',
  'résidence', 'residence', 'fee', 'cotisation',
  'complaint', 'réclamation', 'document', 'security',
  'visitor', 'service', 'elevator', 'cleaning',
  'vote', 'quorum', 'majorité', 'majority',
  'sorry', 'cannot', 'help', 'assist', 'question',
  'bonjour', 'hello', 'merci', 'thank',
  'مرحبا', 'شكرا', 'مساعد', 'عمارة', 'سنديك',
]

export function guardOutput(response: string): GuardResult {
  if (!response || typeof response !== 'string') {
    return {
      safe: false,
      filtered: "I'm sorry, I encountered an issue generating a response. Please try again.",
      reason: 'Empty response',
    }
  }

  let text = response.trim()

  // 1. Check max length
  if (text.length > MAX_OUTPUT_LENGTH) {
    text = text.slice(0, MAX_OUTPUT_LENGTH) + '...'
  }

  // 2. Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        filtered: "I can help you with questions about IQAMATI and Moroccan building management law. Could you please rephrase your question?",
        reason: `Dangerous pattern detected: ${pattern.source}`,
      }
    }
  }

  // 3. Lightweight domain check — only flag if response is long and has zero domain keywords
  if (text.length > 100) {
    const lowerText = text.toLowerCase()
    const hasDomainKeyword = DOMAIN_KEYWORDS.some(kw => lowerText.includes(kw.toLowerCase()))
    if (!hasDomainKeyword) {
      return {
        safe: false,
        filtered: "I specialize in IQAMATI platform features and Moroccan co-ownership law. Could you please ask me something related to building management?",
        reason: 'Response appears off-topic — no domain keywords found',
      }
    }
  }

  return { safe: true, filtered: text }
}
