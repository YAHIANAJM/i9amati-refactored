import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bot, Sparkles } from 'lucide-react'
import { ChatMessage, type Message } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    '👋 Bonjour! I\'m the IQAMATI Assistant.\n\nI can help you with:\n• Building management questions\n• Moroccan co-ownership law (Loi 18-00 / 106-12)\n• Syndic duties and responsibilities\n• Payment and charge regulations\n• Assemblée générale procedures\n\nHow can I help you today?',
  timestamp: new Date(),
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasNewMessage = useRef(false)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && hasNewMessage.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
      hasNewMessage.current = false
    }
  }, [messages, isLoading])

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    hasNewMessage.current = true
    setIsLoading(true)

    try {
      // Build history from previous messages (exclude welcome)
      const history = messages
        .filter(m => m.id !== 'welcome')
        .slice(-10) // Last 10 messages
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch(`${API_URL}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history }),
      })

      const data = await res.json()

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'Sorry, I could not process your request. Please try again.',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, botMessage])
      hasNewMessage.current = true
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Unable to connect to the server. Please check your connection and try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      hasNewMessage.current = true
    } finally {
      setIsLoading(false)
    }
  }, [messages])

  return (
    <>
      {/* ── Floating Action Button ─────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            id="chatbot-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 transition-shadow hover:shadow-xl hover:shadow-blue-500/30"
          >
            <Bot size={24} />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full animate-ping bg-blue-400/20" />
            {/* Sparkle badge */}
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 shadow-sm">
              <Sparkles size={10} className="text-amber-900" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ─────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col w-[380px] h-[560px] rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-2xl shadow-black/10 overflow-hidden"
          >
            {/* ── Header ──────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-tight">IQAMATI Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-white/70">Online — AI Powered</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Messages ────────────────────────────── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto py-3 space-y-1 bg-gradient-to-b from-gray-50/50 to-white"
            >
              {messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
            </div>

            {/* ── Input ───────────────────────────────── */}
            <ChatInput onSend={sendMessage} disabled={isLoading} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
