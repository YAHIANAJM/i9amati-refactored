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
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div className={`flex items-end gap-3 max-w-[88%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        {!isUser && (
          <div className="flex shrink-0 items-end z-10 mb-1">
            <img src="/chatbot.png" alt="Bot" className="h-11 w-11 object-contain drop-shadow-md" />
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative px-5 py-3.5 text-[14px] leading-relaxed shadow-sm ${
            isUser
              ? 'bg-slate-800 text-white rounded-3xl rounded-br-md font-medium'
              : 'bg-white border border-slate-100 text-slate-700 rounded-3xl rounded-bl-md font-normal'
          }`}
        >
          {message.content.split('\n').map((line, i) => (
            <span key={i} className="block min-h-[1em]">
              {line}
            </span>
          ))}
        </div>
      </div>
      
      {/* Timestamp */}
      <span className={`text-[10px] font-semibold text-slate-400 mt-1.5 ${isUser ? 'mr-[3.25rem]' : 'ml-[3.25rem]'}`}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </motion.div>
  )
}
