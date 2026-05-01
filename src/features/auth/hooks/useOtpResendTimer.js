import { useCallback, useEffect, useState } from 'react'

export function useOtpResendTimer(initialSeconds = 45) {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (secondsLeft <= 0) return undefined
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [secondsLeft])

  const start = useCallback(() => {
    setSecondsLeft(initialSeconds)
  }, [initialSeconds])

  return {
    secondsLeft,
    canResend: secondsLeft === 0,
    start,
  }
}
