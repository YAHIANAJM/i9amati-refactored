import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, MessageSquare, Scale, HelpCircle } from 'lucide-react'
import { ChatMessage, type Message } from '@/components/chatbot/ChatMessage'
import { ChatInput } from '@/components/chatbot/ChatInput'
import { TypingIndicator } from '@/components/chatbot/TypingIndicator'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Welcome to I9amati Chat ✨\n\nI am your intelligent assistant for residence management. Ask me about syndic law, payments, complaints, or anything else.',
  timestamp: new Date(),
}

const SUGGESTED_CHOICES = [
  { icon: <MessageSquare size={14} />, text: "What are the syndic's legal duties?" },
  { icon: <Scale size={14} />, text: 'Explain the Loi 18-00 rules' },
  { icon: <HelpCircle size={14} />, text: 'How do I add a new complaint?' },
]

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasNewMessage = useRef(false)

  useEffect(() => {
    if (scrollRef.current && hasNewMessage.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      hasNewMessage.current = false
    }
  }, [messages, isLoading])

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    hasNewMessage.current = true
    setIsLoading(true)

    try {
      const history = messages.filter(m => m.id !== 'welcome').slice(-10).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch(`${API_URL}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history }),
      })
      const data = await res.json()
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'Sorry, an error occurred.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMessage])
    } catch {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Connection error. Please try again.',
        timestamp: new Date(),
      }])
    } finally {
      hasNewMessage.current = true
      setIsLoading(false)
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] rounded-xl overflow-hidden border border-border/50 shadow-sm">

      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-border/50 shrink-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900">
          <Bot size={20} className="text-white" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">I9amati Chat</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
            <span className="text-xs text-slate-500">AI assistant • Syndic law, management, and more</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-2 mt-4 max-w-lg"
          >
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1">Suggested for you</span>
            {SUGGESTED_CHOICES.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(choice.text)}
                className="flex items-center gap-3 w-full p-3.5 text-left bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 hover:bg-slate-50 transition-all group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                  {choice.icon}
                </div>
                <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-800">{choice.text}</span>
              </button>
            ))}
          </motion.div>
        )}

        <AnimatePresence>{isLoading && <TypingIndicator />}</AnimatePresence>
      </div>

      {/* Input */}
      <div className="px-6 py-4 bg-white/80 border-t border-border/50 shrink-0">
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  )
}
