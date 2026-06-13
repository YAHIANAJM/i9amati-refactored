import 'dotenv/config'
import * as readline from 'readline'
import { handleChatMessage } from '../index'
import { Message } from '../graph/state'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const history: Message[] = []

console.log('🤖 IQAMATI Chatbot CLI Test')
console.log('Type your message below. Type "exit" or "quit" to stop.')
console.log('----------------------------------------------------')

function promptUser() {
  rl.question('\nYou: ', async (input) => {
    const trimmed = input.trim()

    if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
      console.log('Goodbye!')
      rl.close()
      return
    }

    if (!trimmed) {
      promptUser()
      return
    }

    try {
      // Show loading indicator
      process.stdout.write('Bot is thinking...')

      const result = await handleChatMessage(trimmed, history)

      // Clear loading indicator
      process.stdout.write('\r\x1b[K')

      if (result.blocked) {
        console.log(`\n⚠️  [BLOCKED] Reason: ${result.reason}`)
        console.log(`🤖 Bot: ${result.response}`)
      } else {
        console.log(`\n🤖 Bot: ${result.response}`)
        
        // Only add to history if not blocked
        history.push({ role: 'user', content: trimmed })
        history.push({ role: 'assistant', content: result.response })
      }
    } catch (error) {
      process.stdout.write('\r\x1b[K')
      console.error('\n❌ Error interacting with chatbot:', error)
    }

    promptUser()
  })
}

// Ensure GROQ_API_KEY is set
if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your-groq-api-key-here') {
  console.error('❌ ERROR: Missing or invalid GROQ_API_KEY in .env file.')
  console.log('Please add your Groq API key to apps/api/.env before running this test.')
  rl.close()
} else {
  // Start the prompt loop
  promptUser()
}
