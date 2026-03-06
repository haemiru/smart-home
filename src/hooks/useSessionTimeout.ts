import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'

const SESSION_TIMEOUT = 60 * 60 * 1000 // 1 hour
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const
const STORAGE_KEY = 'sh-last-activity'

export function useSessionTimeout() {
  const session = useAuthStore((s) => s.session)
  const navigate = useNavigate()
  const [remainingMs, setRemainingMs] = useState(SESSION_TIMEOUT)
  const lastActivityRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const resetTimer = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now
    sessionStorage.setItem(STORAGE_KEY, String(now))
  }, [])

  useEffect(() => {
    if (!session) {
      setRemainingMs(SESSION_TIMEOUT)
      return
    }

    // Initialize
    resetTimer()

    // Activity listeners
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true })
    }

    // Tick every second
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current
      const remaining = Math.max(0, SESSION_TIMEOUT - elapsed)
      setRemainingMs(remaining)

      if (remaining <= 0) {
        clearInterval(timerRef.current)
        signOut().then(() => navigate('/auth/login'))
      }
    }, 1000)

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer)
      }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [session, navigate, resetTimer])

  const minutes = Math.floor(remainingMs / 60000)
  const seconds = Math.floor((remainingMs % 60000) / 1000)
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return { remainingMs, formatted }
}
