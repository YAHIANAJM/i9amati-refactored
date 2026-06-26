import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2, XCircle, AlertTriangle, Info, Bell } from 'lucide-react'
import { useEffect } from 'react'
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

const DURATION = 5000 // 5s

function ToastCard({ id, title, description, variant, duration = DURATION, action, cancelLabel }: ToastItem) {
  let s = STYLES[variant]

  if (variant === 'confirmation' && action?.variant === 'destructive') {
    s = {
      border: 'border-l-[4px] border-red-500',
      icon: <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />,
      bar: 'bg-red-500',
    }
  }

  useEffect(() => {
    const t = setTimeout(() => dismissToast(id), duration)
    return () => clearTimeout(t)
  }, [id, duration])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`relative flex items-start gap-3 w-80 rounded-lg shadow-lg bg-white px-4 py-3 pb-[18px] overflow-hidden pointer-events-auto ${s.border}`}
    >
      {s.icon}

      <div className="flex-1 min-w-0 pb-1">
        <p className="text-sm font-semibold text-slate-800 leading-snug">{title}</p>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        )}
        {action && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => { action.onClick(); dismissToast(id) }}
              className={`text-xs font-semibold text-white px-3 py-1.5 rounded-md transition-colors ${action.variant === 'destructive'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-indigo-500 hover:bg-indigo-600'
                }`}
            >
              {action.label}
            </button>
            <button
              onClick={() => dismissToast(id)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-md hover:bg-slate-200 transition-colors"
            >
              {cancelLabel || 'Cancel'}
            </button>
          </div>
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

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="sync">
        {toasts.map(t => <ToastCard key={t.id} {...t} />)}
      </AnimatePresence>
    </div>
  )
}
