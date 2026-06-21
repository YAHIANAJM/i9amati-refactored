import { useState, useCallback, useEffect, useRef } from 'react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  duration?: number
}

type Listener = (toasts: ToastItem[]) => void

// Global store — survives component remounts
const listeners: Set<Listener> = new Set()
let toasts: ToastItem[] = []

function notify() {
  listeners.forEach(l => l([...toasts]))
}

let counter = 0

export function toast(opts: Omit<ToastItem, 'id'>) {
  const id = `toast-${++counter}`
  toasts = [...toasts, { ...opts, id }]
  notify()
  return id
}

export function dismissToast(id: string) {
  toasts = toasts.filter(t => t.id !== id)
  notify()
}

export function useToast() {
  const [items, setItems] = useState<ToastItem[]>(toasts)
  const setRef = useRef(setItems)
  setRef.current = setItems

  useEffect(() => {
    const listener: Listener = (t) => setRef.current(t)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  const dismiss = useCallback((id: string) => dismissToast(id), [])

  return { toasts: items, dismiss }
}
