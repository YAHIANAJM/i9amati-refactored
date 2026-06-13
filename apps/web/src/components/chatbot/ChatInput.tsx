import { useState, useRef, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled: boolean
}

const MAX_CHARS = 500

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    if (text.length <= MAX_CHARS) {
      setValue(text)
      // Auto-resize
      const el = textareaRef.current
      if (el) {
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 100) + 'px'
      }
    }
  }

  return (
    <div className="border-t border-gray-200/80 bg-white/80 backdrop-blur-sm p-3">
      <div className="flex items-end gap-2 rounded-xl bg-gray-50 border border-gray-200/60 px-3 py-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask about IQAMATI or Moroccan law..."
          rows={1}
          className="flex-1 resize-none bg-transparent text-[13px] text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:opacity-50 leading-relaxed"
          style={{ maxHeight: '100px' }}
        />
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] tabular-nums ${
            value.length > MAX_CHARS * 0.9 ? 'text-red-400' : 'text-gray-300'
          }`}>
            {value.length}/{MAX_CHARS}
          </span>
          <button
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm transition-all hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:shadow-sm"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
