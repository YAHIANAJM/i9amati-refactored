import { useState, useRef, type KeyboardEvent } from 'react'
import { ArrowUp } from 'lucide-react'

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
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
      const el = textareaRef.current
      if (el) {
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 120) + 'px'
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex items-end gap-2 rounded-[1.25rem] bg-slate-50 border border-slate-200 px-3 py-2.5 transition-all focus-within:bg-white focus-within:border-slate-300 focus-within:ring-4 focus-within:ring-slate-100">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask IQAMATI Copilot..."
          rows={1}
          className="flex-1 resize-none bg-transparent text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-50 leading-relaxed py-1.5 px-2"
          style={{ maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-slate-800 text-white shadow-sm transition-all hover:bg-slate-700 hover:shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-30 disabled:hover:bg-slate-800 disabled:hover:shadow-sm disabled:hover:translate-y-0"
        >
          <ArrowUp size={20} strokeWidth={2.5} />
        </button>
      </div>
      <div className="flex justify-between items-center px-3">
        <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">
          Press <kbd className="font-sans px-1.5 py-0.5 mx-0.5 bg-slate-200 text-slate-500 rounded-md">Enter</kbd> to send
        </span>
        <span className={`text-[10px] font-bold tracking-wide tabular-nums ${
          value.length > MAX_CHARS * 0.9 ? 'text-red-400' : 'text-slate-400'
        }`}>
          {value.length} / {MAX_CHARS}
        </span>
      </div>
    </div>
  )
}
