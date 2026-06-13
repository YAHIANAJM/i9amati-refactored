import { Annotation } from '@langchain/langgraph'

export interface Message {
  role: string
  content: string
}

// Define the state for our LangGraph chatbot pipeline
export const ChatbotState = Annotation.Root({
  // Input
  userMessage: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  conversationHistory: Annotation<Message[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),

  // Processing state
  sanitizedMessage: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  isBlocked: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  blockReason: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  safetyScore: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  retrievedContext: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),

  // Output
  response: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
})

export type State = typeof ChatbotState.State
