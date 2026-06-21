import * as RadixToast from '@radix-ui/react-toast'
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import { useToast, dismissToast, type ToastVariant } from './useToast'
import { useEffect, useRef } from 'react'

const VARIANTS: Record<ToastVariant, {
  bg: string
  border: string
  icon: React.ReactNode
  titleColor: string
}> = {
  success: {
    bg: 'bg-white',
    border: 'border-l-4 border-l-emerald-500',
    icon: <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />,
    titleColor: 'text-slate-800',
  },
  error: {
    bg: 'bg-white',
    border: 'border-l-4 border-l-red-500',
    icon: <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />,
    titleColor: 'text-slate-800',
  },
  warning: {
    bg: 'bg-white',
    border: 'border-l-4 border-l-amber-400',
    icon: <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />,
    titleColor: 'text-slate-800',
  },
  info: {
    bg: 'bg-white',
    border: 'border-l-4 border-l-blue-500',
    icon: <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />,
    titleColor: 'text-slate-800',
  },
}

function ToastItem({ id, title, description, variant, duration = 4000 }: {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  duration?: number
}) {
  const v = VARIANTS[variant]
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    timerRef.current = setTimeout(() => dismissToast(id), duration)
    return () => clearTimeout(timerRef.current)
  }, [id, duration])

  return (
    <RadixToast.Root
      open
      onOpenChange={(open) => { if (!open) dismissToast(id) }}
      className={`
        flex items-start gap-3 w-80 rounded-lg shadow-lg px-4 py-3
        ${v.bg} ${v.border}
        data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full
        data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full
        data-[state=closed]:fade-out-80
        transition-all duration-200
      `}
    >
      {v.icon}
      <div className="flex-1 min-w-0">
        <RadixToast.Title className={`text-sm font-semibold leading-snug ${v.titleColor}`}>
          {title}
        </RadixToast.Title>
        {description && (
          <RadixToast.Description className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {description}
          </RadixToast.Description>
        )}
      </div>
      <RadixToast.Close
        onClick={() => dismissToast(id)}
        className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors mt-0.5"
      >
        <X size={14} />
      </RadixToast.Close>
    </RadixToast.Root>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <RadixToast.Provider swipeDirection="right">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} />
      ))}
      <RadixToast.Viewport className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-80" />
    </RadixToast.Provider>
  )
}
