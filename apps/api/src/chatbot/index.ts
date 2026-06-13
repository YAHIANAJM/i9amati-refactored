import { chatbotGraph } from './graph/graph'
import { Message } from './graph/state'

export interface ChatbotResponse {
  response: string
  blocked: boolean
  reason?: string
}

export async function handleChatMessage(message: string, history: Message[] = []): Promise<ChatbotResponse> {
  const initialState = {
    userMessage: message,
    conversationHistory: history,
    sanitizedMessage: '',
    isBlocked: false,
    blockReason: '',
    safetyScore: 0,
    retrievedContext: '',
    response: '',
  }

  const finalState = await chatbotGraph.invoke(initialState)

  if (finalState.isBlocked) {
    return {
      response: finalState.response || "I apologize, but I cannot process that request.",
      blocked: true,
      reason: finalState.blockReason,
    }
  }

  return {
    response: finalState.response,
    blocked: false,
  }
}
