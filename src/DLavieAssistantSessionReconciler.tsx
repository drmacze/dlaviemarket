import { useEffect, useRef } from 'react'

type ActiveSession = { sessionId?: string; sessionRef?: string; walletRef?: string; startedAt?: number; supportMode?: string }
type Profile = { id?: string; username?: string }

type SyncResponse = {
  ok?: boolean
  session?: { status?: 'open' | 'closed'; ended_at?: string | null }
}

const API = 'https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-assistant'
const ACTIVE_KEY = 'dlavie-assistant-active-v2'
const PROFILE_KEY = 'dlavie-account-profile-v1'
const WALLET_KEY = 'dlavie-wallet-token-v1'
const SESSION_KEY = 'dlavie-account-session-v1'

function readJson<T>(key: string): T | null {
  try { return JSON.parse(localStorage.getItem(key) || 'null') as T | null } catch { return null }
}

export default function DLavieAssistantSessionReconciler() {
  const busy = useRef(false)
  const lastCheck = useRef(0)

  useEffect(() => {
    const reconcile = async (force = false) => {
      if (busy.current) return
      if (document.visibilityState === 'hidden') return
      const now = Date.now()
      if (!force && now - lastCheck.current < 2800) return
      lastCheck.current = now

      const active = readJson<ActiveSession>(ACTIVE_KEY)
      const profile = readJson<Profile>(PROFILE_KEY)
      const walletToken = localStorage.getItem(WALLET_KEY) || ''
      if (!active?.sessionId || !profile?.id || !walletToken || sessionStorage.getItem(SESSION_KEY) !== 'active') return

      busy.current = true
      try {
        const body = new URLSearchParams({
          action: 'sync',
          session_id: active.sessionId,
          wallet_token: walletToken,
          user_id: profile.id,
          username: profile.username || 'Pengguna',
          lang: localStorage.getItem('dlavie-language') === 'en' ? 'en' : 'id',
        })
        const response = await fetch(API, { method: 'POST', body })
        const data = await response.json().catch(() => ({})) as SyncResponse
        if (!response.ok || !data.ok) return
        if (data.session?.status !== 'closed') return

        localStorage.removeItem(ACTIVE_KEY)
        const endButton = document.querySelector<HTMLButtonElement>('.dlv-assistant-panel .dlv-assistant-end')
        if (endButton && !endButton.disabled) {
          endButton.click()
          return
        }

        // When the panel is closed, React may still hold the old in-memory session.
        // A one-time reload on foreground gives the Assistant a clean ready state.
        const marker = `dlavie-assistant-reconciled-${active.sessionId}`
        if (sessionStorage.getItem(marker) !== '1') {
          sessionStorage.setItem(marker, '1')
          window.location.reload()
        }
      } catch {
        // Keep the current UI if the network is temporarily unavailable.
      } finally {
        busy.current = false
      }
    }

    const visibility = () => { if (document.visibilityState === 'visible') void reconcile(true) }
    const focus = () => void reconcile(true)
    const pageshow = () => void reconcile(true)

    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('focus', focus)
    window.addEventListener('pageshow', pageshow)
    const timer = window.setInterval(() => void reconcile(false), 3500)
    void reconcile(true)

    return () => {
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('focus', focus)
      window.removeEventListener('pageshow', pageshow)
      window.clearInterval(timer)
    }
  }, [])

  return null
}
