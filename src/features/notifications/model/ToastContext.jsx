import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { ToastViewport } from '@/features/notifications/ui/ToastViewport'
import { registerToastDispatch } from '@/shared/notifications/toastBridge'

const ToastContext = createContext(null)

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const removeToast = useCallback((id) => {
    const t = timersRef.current.get(id)
    if (t) window.clearTimeout(t)
    timersRef.current.delete(id)
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const addToast = useCallback(
    ({ type = 'error', message, duration }) => {
      const id = createId()
      const ms =
        duration != null
          ? duration
          : type === 'error'
            ? 8000
            : type === 'success'
              ? 4500
              : 5000

      setToasts((prev) => [...prev, { id, type, message }])

      if (ms > 0) {
        const tid = window.setTimeout(() => removeToast(id), ms)
        timersRef.current.set(id, tid)
      }
      return id
    },
    [removeToast],
  )

  useEffect(() => {
    registerToastDispatch((payload) => {
      addToast({
        type: payload.type ?? 'error',
        message: payload.message,
        duration: payload.duration,
      })
    })
    return () => registerToastDispatch(null)
  }, [addToast])

  const value = useMemo(
    () => ({
      toast: {
        error: (message, opts) => addToast({ type: 'error', message, duration: opts?.duration }),
        success: (message, opts) => addToast({ type: 'success', message, duration: opts?.duration }),
        info: (message, opts) => addToast({ type: 'info', message, duration: opts?.duration }),
      },
      dismiss: removeToast,
    }),
    [addToast, removeToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast doit être utilisé sous ToastProvider')
  }
  return ctx
}
