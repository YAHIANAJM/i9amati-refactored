// Jailbreak Detection - Pattern matching for known prompt injection attacks
// Uses a weighted scoring system: each pattern has a severity weight.
// If the cumulative score exceeds the threshold, the input is blocked.

export interface JailbreakResult {
  safe: boolean
  score: number
  matchedPatterns: string[]
}

interface JailbreakPattern {
  name: string
  pattern: RegExp
  weight: number
}

const THRESHOLD = 3.0

const JAILBREAK_PATTERNS: JailbreakPattern[] = [
  // ─── DAN-style attacks ─────────────────────────────────
  { name: 'DAN', pattern: /do\s*anything\s*now/i, weight: 5 },
  { name: 'DAN_acronym', pattern: /\bDAN\b.*mode/i, weight: 5 },
  { name: 'DAN_enable', pattern: /enable.*DAN/i, weight: 5 },
  { name: 'jailbreak_mode', pattern: /\bjailbreak\s*(mode)?/i, weight: 5 },
  { name: 'developer_mode', pattern: /developer\s*mode\s*(enabled|on|activate)/i, weight: 5 },

  // ─── Instruction override ──────────────────────────────
  { name: 'ignore_previous', pattern: /ignore\s*(all\s*)?(previous|prior|above|earlier|preceding)\s*(instructions?|rules?|prompts?|guidelines?|directives?)/i, weight: 5 },
  { name: 'forget_everything', pattern: /forget\s*(everything|all|your)\s*(instructions?|rules?|training|programming)?/i, weight: 5 },
  { name: 'disregard', pattern: /disregard\s*(all\s*)?(previous|prior|your)\s*(instructions?|rules?|guidelines?)/i, weight: 5 },
  { name: 'override', pattern: /override\s*(your|the|all)?\s*(instructions?|rules?|programming|restrictions?|safety)/i, weight: 4 },
  { name: 'new_instructions', pattern: /new\s*instructions?\s*:?\s*(you|from|now)/i, weight: 4 },
  { name: 'stop_being', pattern: /stop\s*being\s*(an?|the)?\s*(assistant|AI|chatbot|helpful)/i, weight: 4 },

  // ─── Role-play attacks ─────────────────────────────────
  { name: 'pretend_you_are', pattern: /pretend\s*(you\s*are|to\s*be|you'?re)/i, weight: 4 },
  { name: 'you_are_now', pattern: /you\s*are\s*now\s*(a|an|the|no\s*longer)/i, weight: 4 },
  { name: 'act_as', pattern: /act\s*(as|like)\s*(a|an|if|you)/i, weight: 3 },
  { name: 'roleplay', pattern: /role\s*play\s*(as|scenario)/i, weight: 3 },
  { name: 'imagine_you_are', pattern: /imagine\s*(you\s*are|you'?re|being)/i, weight: 3 },
  { name: 'no_longer_assistant', pattern: /no\s*longer\s*(an?|the)?\s*(assistant|AI|chatbot|IQAMATI)/i, weight: 5 },

  // ─── System prompt extraction ──────────────────────────
  { name: 'system_prompt_reveal', pattern: /what\s*(is|are)\s*(your|the)\s*(system|initial|original)\s*prompt/i, weight: 5 },
  { name: 'show_instructions', pattern: /(show|reveal|display|print|output|repeat|tell\s*me)\s*(your|the)?\s*(system|initial|hidden|secret)?\s*(instructions?|prompt|rules?|guidelines?)/i, weight: 5 },
  { name: 'repeat_above', pattern: /repeat\s*(the|everything|all)?\s*(text|words|content)?\s*(above|before|preceding)/i, weight: 4 },
  { name: 'beginning_text', pattern: /what\s*(was|is)\s*(the|your)\s*(first|beginning|initial|starting)\s*(message|text|prompt|instruction)/i, weight: 4 },
  { name: 'training_data', pattern: /what.*trained\s*on|training\s*data|your\s*prompt|your\s*instructions/i, weight: 3 },

  // ─── Encoding bypass ───────────────────────────────────
  { name: 'base64_reference', pattern: /base64\s*(decode|encode|convert)/i, weight: 4 },
  { name: 'rot13', pattern: /rot13|caesar\s*cipher/i, weight: 3 },
  { name: 'hex_encode', pattern: /hex\s*(encode|decode|convert)/i, weight: 3 },
  { name: 'binary_encode', pattern: /binary\s*(encode|decode|convert)/i, weight: 2 },

  // ─── Harmful content requests ──────────────────────────
  { name: 'bypass_safety', pattern: /bypass\s*(safety|security|filter|content|moderation|restriction)/i, weight: 5 },
  { name: 'unfiltered', pattern: /\b(unfiltered|uncensored|unrestricted|without\s*restrictions?)\s*(mode|response|output)?/i, weight: 4 },
  { name: 'hypothetical', pattern: /hypothetical(ly)?\s*.{0,20}(if\s*you\s*(could|were|had)|what\s*if)/i, weight: 2 },
  { name: 'creative_writing', pattern: /write\s*(a|an)?\s*(story|fiction|tale|scenario)\s*(about|where|in\s*which).*\b(hack|exploit|attack|steal|bomb|weapon)/i, weight: 4 },

  // ─── Token manipulation ────────────────────────────────
  { name: 'token_smuggling', pattern: /\[\s*(SYSTEM|SYS|INST|ADMIN)\s*\]/i, weight: 5 },
  { name: 'xml_injection', pattern: /<\s*(system|instruction|admin|prompt)\s*>/i, weight: 5 },
  { name: 'markdown_injection', pattern: /```\s*(system|instruction|admin)/i, weight: 4 },
  { name: 'separator_injection', pattern: /(-{5,}|={5,}|#{5,})\s*(system|new\s*instruction|admin)/i, weight: 4 },

  // ─── Multi-language injection (French/Arabic) ──────────
  { name: 'ignore_fr', pattern: /ignore[rz]?\s*(les|toutes|vos)\s*(instructions?|règles?|consignes?)/i, weight: 5 },
  { name: 'oublie_fr', pattern: /oublie[rz]?\s*(tout|tes|vos)\s*(instructions?|règles?)/i, weight: 5 },
  { name: 'fais_comme_si_fr', pattern: /fais\s*comme\s*si\s*(tu|vous)/i, weight: 3 },
  { name: 'ignore_ar', pattern: /تجاهل\s*(التعليمات|القواعد|الأوامر)/i, weight: 5 },
  { name: 'forget_ar', pattern: /انس[ى]?\s*(كل|جميع)\s*(التعليمات|القواعد)/i, weight: 5 },
  { name: 'pretend_ar', pattern: /تظاهر\s*(أنك|بأنك)/i, weight: 3 },

  // ─── Emotional manipulation ────────────────────────────
  { name: 'grandmother', pattern: /my\s*(dead\s*)?grandmother\s*(used\s*to|told\s*me|would)/i, weight: 3 },
  { name: 'life_depends', pattern: /(my\s*life|someone.*die|emergency)\s*(depends|rely)/i, weight: 2 },

  // ─── Output format manipulation ────────────────────────
  { name: 'respond_as_json', pattern: /respond\s*(only\s*)?\s*(in|as|with)\s*(json|xml|code|python|javascript)/i, weight: 2 },
  { name: 'respond_without', pattern: /respond\s*without\s*(any\s*)?(filter|restriction|safety|limit)/i, weight: 4 },
]

export function detectJailbreak(input: string): JailbreakResult {
  const matchedPatterns: string[] = []
  let score = 0

  for (const jp of JAILBREAK_PATTERNS) {
    if (jp.pattern.test(input)) {
      matchedPatterns.push(jp.name)
      score += jp.weight
    }
  }

  return {
    safe: score < THRESHOLD,
    score,
    matchedPatterns,
  }
}
