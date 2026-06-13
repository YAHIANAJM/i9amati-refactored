import { motion } from 'framer-motion'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex items-start gap-2.5 px-4 py-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
          <span className="text-[10px] font-bold text-white">i9</span>
        </div>
      )}
      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-white">You</span>
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
          isUser
            ? 'rounded-tr-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
            : 'rounded-tl-sm bg-gray-100 border border-gray-200/60 text-gray-800'
        }`}
      >
        {message.content.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < message.content.split('\n').length - 1 && <br />}
          </span>
        ))}
        <div className={`mt-1 text-[10px] ${isUser ? 'text-white/50' : 'text-gray-400'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  )
}
