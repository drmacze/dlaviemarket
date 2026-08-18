import { useEffect, useRef, useState } from 'react'

type ActiveSession = { sessionId?: string; sessionRef?: string; walletRef?: string; startedAt?: number; supportMode?: string }
type Profile = { id?: string; username?: string }
type CloseNotice = { sessionRef?: string; endedAt?: string | null }

type SyncResponse = {
  ok?: boolean
  session?: { status?: 'open' | 'closed'; ended_at?: string | null; session_ref?: string }
}

const API = 'https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-assistant'
const ACTIVE_KEY = 'dlavie-assistant-active-v2'
const PROFILE_KEY = 'dlavie-account-profile-v1'
const WALLET_KEY = 'dlavie-wallet-token-v1'
const SESSION_KEY = 'dlavie-account-session-v1'
const NOTICE_KEY = 'dlavie-assistant-idle-close-notice-v1'

function readJson<T>(key: string): T | null {
  try { return JSON.parse(localStorage.getItem(key) || 'null') as T | null } catch { return null }
}
function readSessionJson<T>(key: string): T | null {
  try { return JSON.parse(sessionStorage.getItem(key) || 'null') as T | null } catch { return null }
}

export default function DLavieAssistantSessionReconciler() {
  const busy = useRef(false)
  const lastCheck = useRef(0)
  const [notice, setNotice] = useState<CloseNotice | null>(() => readSessionJson<CloseNotice>(NOTICE_KEY))

  const dismissNotice = () => {
    sessionStorage.removeItem(NOTICE_KEY)
    setNotice(null)
  }

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(dismissNotice, 8000)
    return () => window.clearTimeout(timer)
  }, [notice])

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
        if (!response.ok || !data.ok || data.session?.status !== 'closed') return

        localStorage.removeItem(ACTIVE_KEY)
        const closeNotice: CloseNotice = {
          sessionRef: data.session.session_ref || active.sessionRef,
          endedAt: data.session.ended_at || null,
        }
        sessionStorage.setItem(NOTICE_KEY, JSON.stringify(closeNotice))

        // The backend is authoritative for ended_at. Reload once instead of invoking the
        // client "End" action, otherwise an already-closed session could get a new end time.
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

  if (!notice) return null
  const en = localStorage.getItem('dlavie-language') === 'en'
  return (
    <button type="button" className="dlv-assistant-toast is-system dlv-session-reconcile-toast" onClick={dismissNotice}>
      <span><i />{en ? 'Support session closed' : 'Sesi support ditutup'}</span>
      <strong>{en ? 'No activity was detected for 5 minutes.' : 'Tidak ada aktivitas selama 5 menit.'}</strong>
      <b>{notice.sessionRef || 'DLavie Support'} · ×</b>
    </button>
  )
}
