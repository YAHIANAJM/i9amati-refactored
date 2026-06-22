import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare, Scale, HelpCircle, Bot, Maximize2, ChevronLeft } from 'lucide-react'
import { ChatMessage, type Message } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'

const API_URL = import.meta.env.VITE_API_URL || ''

// How long the circle is visible before sliding away (ms)
const HIDE_DELAY = 8000
// How often the circle peeks back to remind the user (ms)
const REMIND_INTERVAL = 25000
// How long the peek reminder lasts before hiding again (ms)
const REMIND_DURATION = 3000

type BubbleState = 'visible' | 'hidden' | 'peeking'

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Welcome to IQAMATI Copilot ✨\n\nI am your intelligent assistant. How can I help you manage your residence today?',
  timestamp: new Date(),
}

const SUGGESTED_CHOICES = [
  { icon: <MessageSquare size={14} />, text: "What are the syndic's legal duties?" },
  { icon: <Scale size={14} />, text: 'Explain the Loi 18-00 rules' },
  { icon: <HelpCircle size={14} />, text: 'How do I add a new complaint?' },
]

export function ChatBot() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [bubble, setBubble] = useState<BubbleState>('visible')
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasNewMessage = useRef(false)

  // ── Bubble lifecycle ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) return // freeze all animations while chat panel is open

    let hideTimer: ReturnType<typeof setTimeout>
    let remindInterval: ReturnType<typeof setInterval>
    let peekBackTimer: ReturnType<typeof setTimeout>

    if (bubble === 'visible') {
      // After HIDE_DELAY, slide the circle away
      hideTimer = setTimeout(() => setBubble('hidden'), HIDE_DELAY)
    }

    if (bubble === 'hidden') {
      // Every REMIND_INTERVAL, briefly peek back, then hide again
      remindInterval = setInterval(() => {
        setBubble('peeking')
        peekBackTimer = setTimeout(() => setBubble('hidden'), REMIND_DURATION)
      }, REMIND_INTERVAL)
    }

    return () => {
      clearTimeout(hideTimer)
      clearTimeout(peekBackTimer)
      clearInterval(remindInterval)
    }
  }, [bubble, isOpen])

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current && hasNewMessage.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      hasNewMessage.current = false
    }
  }, [messages, isLoading])

  // ── Send message ─────────────────────────────────────────────────────────────
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
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'Sorry, an error occurred.',
        timestamp: new Date(),
      }])
      hasNewMessage.current = true
    } catch {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Connection error. Please try again.',
        timestamp: new Date(),
      }])
      hasNewMessage.current = true
    } finally {
      setIsLoading(false)
    }
  }, [messages])

  const shown = bubble === 'visible' || bubble === 'peeking'

  return (
    <>
      {/* ── Floating bubble ──────────────────────────────────────────────────── */}
      {!isOpen && (
        <>
          {/* motion.div IS the fixed element — it slides right/left directly */}
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            animate={{ x: shown ? 0 : 132 }}
            transition={{ type: 'spring', damping: 24, stiffness: 180 }}
          >
            <motion.button
              whileHover={shown ? { scale: 1.07 } : {}}
              whileTap={shown ? { scale: 0.93 } : {}}
              onClick={() => { setBubble('visible'); setIsOpen(true) }}
              className="cursor-pointer block"
              style={{ pointerEvents: shown ? 'auto' : 'none' }}
            >
              {/* Float animation is separate so it doesn't fight the x slide */}
              <motion.span
                animate={{ y: [0, -9, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="flex items-center justify-center w-20 h-20"
              >
                <img src="/chatbot.png" alt="IQAMATI Chat" className="w-20 h-20 object-contain drop-shadow-2xl" />
              </motion.span>
            </motion.button>
          </motion.div>

          {/* Arrow tab — fixed at right edge, visible only when circle is hidden */}
          <AnimatePresence>
            {!shown && (
              <motion.button
                key="arrow-tab"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                onClick={() => setBubble('visible')}
                title="Open chat"
                className="fixed bottom-14 right-0 z-50 flex items-center justify-center h-11 w-6 rounded-l-xl bg-primary shadow-lg hover:bg-primary/80 transition-colors"
              >
                <ChevronLeft size={15} className="text-white" strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── Chat panel ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ x: '100%', opacity: 0, scale: 0.98 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: '100%', opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 250 }}
              className="fixed bottom-4 right-4 z-50 flex flex-col w-[340px] h-[520px] rounded-[2rem] bg-[#f8fafc]/95 backdrop-blur-3xl border border-white shadow-2xl shadow-slate-400/30 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 bg-white/60 border-b border-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-900">
                    <Bot size={17} className="text-white" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight leading-tight">IQAMATI Copilot</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                      <span className="text-[11px] font-medium text-slate-500">Always here to help</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setIsOpen(false); navigate('/syndic/chat') }}
                    title="Open full chat"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Maximize2 size={14} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.map(msg => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}

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

              {/* Input */}
              <div className="p-3 bg-white/80 border-t border-white shrink-0">
                <ChatInput onSend={sendMessage} disabled={isLoading} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
