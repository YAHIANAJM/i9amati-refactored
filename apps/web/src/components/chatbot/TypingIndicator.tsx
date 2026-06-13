import { motion } from 'framer-motion'

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 px-4 py-1">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
        <span className="text-[10px] font-bold text-white">i9</span>
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-gray-100 border border-gray-200/60 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-blue-400"
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 0.8,
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
