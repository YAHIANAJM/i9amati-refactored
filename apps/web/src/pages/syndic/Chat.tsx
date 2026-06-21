import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, MessageSquare, Scale, HelpCircle, Plus, Clock } from 'lucide-react'
import { ChatMessage, type Message } from '@/components/chatbot/ChatMessage'
import { ChatInput } from '@/components/chatbot/ChatInput'
import { TypingIndicator } from '@/components/chatbot/TypingIndicator'
import { useSidebar } from '@/components/layout/SyndicLayout'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Mock chat session history
const MOCK_SESSIONS = [
  { id: 's1', title: 'Loi 18-00 rules', preview: 'What are the key articles...', time: '2h ago', active: false },
  { id: 's2', title: 'Payment reminder', preview: 'How to send a bulk reminder...', time: '5h ago', active: false },
  { id: 's3', title: 'Complaint escalation', preview: 'What steps should I take...', time: 'Yesterday', active: false },
  { id: 's4', title: 'Meeting agenda setup', preview: 'Can you help me draft...', time: 'Yesterday', active: false },
  { id: 's5', title: 'Syndic legal duties', preview: 'As a syndic agent, am I...', time: '2 days ago', active: false },
  { id: 's6', title: 'Elevator maintenance', preview: 'Who is responsible for...', time: '3 days ago', active: false },
]

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Welcome to I9amati Chat ✨\n\nI am your intelligent assistant for residence management. Ask me about syndic law, payments, complaints, or anything else.',
  timestamp: new Date(),
}

const SUGGESTIONS = [
  { icon: <MessageSquare size={14} />, text: "What are the syndic's legal duties?" },
  { icon: <Scale size={14} />, text: 'Explain the Loi 18-00 rules' },
  { icon: <HelpCircle size={14} />, text: 'How do I add a new complaint?' },
]

export function Chat() {
  const { setOpen } = useSidebar()
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [isLoading, setIsLoading] = useState(false)
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasNewMessage = useRef(false)

  // Auto-close main sidebar when Chat page mounts
  useEffect(() => { setOpen(false) }, [setOpen])

  useEffect(() => {
    if (scrollRef.current && hasNewMessage.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      hasNewMessage.current = false
    }
  }, [messages, isLoading])

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', content, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
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
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Connection error. Please try again.',
        timestamp: new Date(),
      }])
    } finally {
      hasNewMessage.current = true
      setIsLoading(false)
    }
  }, [messages])

  const startNewChat = () => {
    setMessages([WELCOME])
    setActiveSession(null)
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── ONE container: history panel + chat — no visual break between them ── */}
      <div className="flex flex-1 m-5 rounded-2xl overflow-hidden shadow-sm border border-border/40 bg-white min-h-0">

        {/* Left: Chat History Panel */}
        <div className="w-[220px] shrink-0 flex flex-col bg-[#f8fafc] border-r border-border/40">

          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <img src="/chatbot.png" alt="bot" className="w-7 h-7 object-contain" />
              <span className="text-xs font-bold text-slate-700 tracking-tight">Conversations</span>
            </div>
            <button
              onClick={startNewChat}
              title="New chat"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-700 transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
            {/* Current session */}
            <button
              onClick={() => setActiveSession(null)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                activeSession === null
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <p className={`text-[11px] font-semibold truncate ${activeSession === null ? 'text-white' : 'text-slate-700'}`}>
                Current chat
              </p>
              <p className={`text-[10px] mt-0.5 truncate ${activeSession === null ? 'text-slate-300' : 'text-slate-400'}`}>
                Active session
              </p>
            </button>

            {MOCK_SESSIONS.length > 0 && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-3 pb-1">
                History
              </p>
            )}

            {MOCK_SESSIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSession(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                  activeSession === s.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <p className={`text-[11px] font-semibold truncate ${activeSession === s.id ? 'text-white' : 'text-slate-700'}`}>
                  {s.title}
                </p>
                <div className={`flex items-center gap-1 mt-0.5 ${activeSession === s.id ? 'text-slate-300' : 'text-slate-400'}`}>
                  <Clock size={9} />
                  <span className="text-[10px]">{s.time}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Chat Interface */}
        <div className="flex flex-col flex-1 min-w-0 bg-white">

          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40 shrink-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 shrink-0">
              <Bot size={17} className="text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight leading-tight">I9amati Chat</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                <span className="text-[11px] text-slate-500">AI assistant • Syndic law, management, and more</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {messages.length === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-2 mt-4 max-w-md"
              >
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1">Suggested for you</span>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="flex items-center gap-3 w-full p-3.5 text-left bg-slate-50 border border-slate-100 rounded-2xl hover:shadow-md hover:border-slate-300 hover:bg-white transition-all group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-colors shrink-0">
                      {s.icon}
                    </div>
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-800">{s.text}</span>
                  </button>
                ))}
              </motion.div>
            )}

            <AnimatePresence>{isLoading && <TypingIndicator />}</AnimatePresence>
          </div>

          {/* Input */}
          <div className="px-5 py-4 bg-white border-t border-border/40 shrink-0">
            <ChatInput onSend={sendMessage} disabled={isLoading} />
          </div>
        </div>

      </div>
    </div>
  )
}
