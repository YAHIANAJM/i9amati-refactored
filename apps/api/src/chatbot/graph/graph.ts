import { StateGraph, START, END } from '@langchain/langgraph'
import { ChatbotState, State } from './state'
import {
  sanitizeNode,
  safetyCheckNode,
  retrieveNode,
  generateNode,
  outputGuardNode,
} from './nodes'

// Condition function to route flow based on safety block status
function shouldContinue(state: State): string {
  if (state.isBlocked) {
    return END
  }
  return 'retrieve'
}

// Build the state graph
const builder = new StateGraph(ChatbotState)
  .addNode('sanitize', sanitizeNode)
  .addNode('safetyCheck', safetyCheckNode)
  .addNode('retrieve', retrieveNode)
  .addNode('generate', generateNode)
  .addNode('outputGuard', outputGuardNode)

  // Define edges
  .addEdge(START, 'sanitize')
  .addEdge('sanitize', 'safetyCheck')
  
  // Conditional routing after safety check
  .addConditionalEdges('safetyCheck', shouldContinue)
  
  // Safe path
  .addEdge('retrieve', 'generate')
  .addEdge('generate', 'outputGuard')
  .addEdge('outputGuard', END)

// Compile the graph
export const chatbotGraph = builder.compile()
