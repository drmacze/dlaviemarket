import { useEffect } from 'react'

const WATCHED_KEYS = ['dlavie-balance', 'dlavie-history', 'dlavie-orders-v1'] as const
const STATE_EVENT = 'dlavie:state-changed'

export default function StateBridge() {
  useEffect(() => {
    let snapshot = WATCHED_KEYS.map((key) => localStorage.getItem(key) || '').join('\u0000')
    const timer = window.setInterval(() => {
      const next = WATCHED_KEYS.map((key) => localStorage.getItem(key) || '').join('\u0000')
      if (next === snapshot) return
      snapshot = next
      window.dispatchEvent(new CustomEvent(STATE_EVENT))
    }, 500)
    return () => window.clearInterval(timer)
  }, [])

  return null
}
