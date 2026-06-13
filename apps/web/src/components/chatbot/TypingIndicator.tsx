import { motion } from 'framer-motion'

export function TypingIndicator() {
  return (
    <div className="flex flex-col w-full items-start">
      <div className="flex items-end gap-3 max-w-[88%] flex-row">
        <div className="flex shrink-0 items-end z-10 mb-1">
          <img src="/chatbot.png" alt="Bot" className="h-11 w-11 object-contain opacity-80 animate-pulse drop-shadow-md" />
        </div>
        <div className="relative px-5 py-4 bg-white border border-slate-100 rounded-3xl rounded-bl-md shadow-sm flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-slate-300"
              animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
