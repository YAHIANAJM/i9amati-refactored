import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare, Scale, HelpCircle } from 'lucide-react'
import { ChatMessage, type Message } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Welcome to IQAMATI Copilot ✨\n\nI am your intelligent assistant. How can I help you manage your residence today?',
  timestamp: new Date(),
}

const SUGGESTED_CHOICES = [
  { icon: <MessageSquare size={14} />, text: 'What are the syndic\'s legal duties?' },
  { icon: <Scale size={14} />, text: 'Explain the Loi 18-00 rules' },
  { icon: <HelpCircle size={14} />, text: 'How do I add a new complaint?' },
]

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasNewMessage = useRef(false)

  // Auto-scroll
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
      const botMessage: Message = { id: `bot-${Date.now()}`, role: 'assistant', content: data.response || 'Sorry, an error occurred.', timestamp: new Date() }
      setMessages(prev => [...prev, botMessage])
      hasNewMessage.current = true
    } catch (error) {
      const errorMessage: Message = { id: `error-${Date.now()}`, role: 'assistant', content: '⚠️ Connection error. Please try again.', timestamp: new Date() }
      setMessages(prev => [...prev, errorMessage])
      hasNewMessage.current = true
    } finally {
      setIsLoading(false)
    }
  }, [messages])

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center transition-all group cursor-pointer"
          >
            <img src="/chatbot.png" alt="IQAMATI Chatbot" className="h-32 w-32 object-contain drop-shadow-2xl group-hover:scale-105 group-active:scale-95 transition-transform duration-300" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Side Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark Backdrop (Optional, but gives focus) */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ x: '100%', opacity: 0, scale: 0.98 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: '100%', opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 250 }}
              className="fixed top-4 bottom-4 right-4 z-50 flex flex-col w-[420px] rounded-[2rem] bg-[#f8fafc]/95 backdrop-blur-3xl border border-white shadow-2xl shadow-slate-400/30 overflow-hidden"
            >
              {/* Premium Header */}
              <div className="flex items-center justify-between px-6 py-5 bg-white/60 border-b border-white shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center">
                    <img src="/chatbot.png" alt="Bot" className="h-14 w-14 object-contain drop-shadow-md" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 tracking-tight">IQAMATI Copilot</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                      <span className="text-xs font-medium text-slate-500">Always here to help</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                {messages.map(msg => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                
                {/* Suggestions Choices (Show only when it's the welcome message) */}
                {messages.length === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="flex flex-col gap-2 mt-4"
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

                {isLoading && <TypingIndicator />}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white/80 border-t border-white shrink-0">
                <ChatInput onSend={sendMessage} disabled={isLoading} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
