import { State } from './state'
import { sanitizeInput } from '../safety/inputSanitizer'
import { detectJailbreak } from '../safety/jailbreakDetector'
import { getRetriever } from '../knowledge/retriever'
import { generateGroqResponse } from '../groq'
import { guardOutput } from '../safety/outputGuard'

export async function sanitizeNode(state: State): Promise<Partial<State>> {
  const result = sanitizeInput(state.userMessage)
  return {
    sanitizedMessage: result.clean,
    isBlocked: result.blocked,
    blockReason: result.reason || '',
  }
}

export async function safetyCheckNode(state: State): Promise<Partial<State>> {
  if (state.isBlocked) return {} // Already blocked by sanitizer

  const result = detectJailbreak(state.sanitizedMessage)
  return {
    isBlocked: !result.safe,
    safetyScore: result.score,
    blockReason: !result.safe ? `Jailbreak attempt detected (Score: ${result.score}, Patterns: ${result.matchedPatterns.join(', ')})` : '',
  }
}

export async function retrieveNode(state: State): Promise<Partial<State>> {
  const retriever = getRetriever()
  const contexts = retriever.retrieve(state.sanitizedMessage)
  const formattedContext = retriever.formatContext(contexts)
  
  return {
    retrievedContext: formattedContext,
  }
}

export async function generateNode(state: State): Promise<Partial<State>> {
  try {
    const response = await generateGroqResponse(
      state.sanitizedMessage,
      state.retrievedContext,
      state.conversationHistory
    )
    return { response }
  } catch (error) {
    console.error('[IQAMATI Chatbot] Generation error:', error)
    return {
      isBlocked: true,
      blockReason: 'Failed to generate response from Groq API',
      response: 'I apologize, but I am currently experiencing technical difficulties. Please try again later.',
    }
  }
}

export async function outputGuardNode(state: State): Promise<Partial<State>> {
  if (state.isBlocked && !state.response) return {} // Return if already blocked and no response generated yet

  const guardResult = guardOutput(state.response)
  
  return {
    response: guardResult.filtered,
    isBlocked: state.isBlocked || !guardResult.safe, // Keep previous block state, or block if output is unsafe
    blockReason: guardResult.reason ? `Output blocked: ${guardResult.reason}` : state.blockReason,
  }
}
