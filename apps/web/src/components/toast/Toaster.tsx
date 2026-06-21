import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2, XCircle, AlertTriangle, Info, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useToast, dismissToast, type ToastVariant, type ToastItem } from './useToast'

const STYLES: Record<ToastVariant, {
  border: string
  icon: React.ReactNode
  bar: string
}> = {
  success: {
    border: 'border-l-[4px] border-emerald-500',
    icon: <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />,
    bar: 'bg-emerald-500',
  },
  error: {
    border: 'border-l-[4px] border-red-500',
    icon: <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />,
    bar: 'bg-red-500',
  },
  warning: {
    border: 'border-l-[4px] border-amber-400',
    icon: <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />,
    bar: 'bg-amber-400',
  },
  info: {
    border: 'border-l-[4px] border-blue-500',
    icon: <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />,
    bar: 'bg-blue-500',
  },
  confirmation: {
    border: 'border-l-[4px] border-indigo-500',
    icon: <Bell size={18} className="text-indigo-500 shrink-0 mt-0.5" />,
    bar: 'bg-indigo-500',
  },
}

const DURATION = 10000 // 10s

function ToastCard({ id, title, description, variant, duration = DURATION }: ToastItem) {
  const s = STYLES[variant]

  useEffect(() => {
    const t = setTimeout(() => dismissToast(id), duration)
    return () => clearTimeout(t)
  }, [id, duration])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`relative flex items-start gap-3 w-80 rounded-lg shadow-lg bg-white px-4 py-3 pb-[18px] overflow-hidden ${s.border}`}
    >
      {s.icon}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-snug">{title}</p>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>

      <button
        onClick={() => dismissToast(id)}
        className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors mt-0.5"
      >
        <X size={14} />
      </button>

      {/* progress bar — slides from right to left over `duration` ms */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-100">
        <motion.div
          className={`h-full origin-left ${s.bar}`}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      </div>
    </motion.div>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  const bottom = toasts.filter(t => t.variant !== 'confirmation')
  const top    = toasts.filter(t => t.variant === 'confirmation')

  return (
    <>
      {/* error / success / warning / info — bottom right */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
        <AnimatePresence mode="sync">
          {bottom.map(t => <ToastCard key={t.id} {...t} />)}
        </AnimatePresence>
      </div>

      {/* confirmation — top right */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 items-end">
        <AnimatePresence mode="sync">
          {top.map(t => <ToastCard key={t.id} {...t} />)}
        </AnimatePresence>
      </div>
    </>
  )
}
