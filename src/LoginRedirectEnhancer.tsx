import { useEffect, useRef } from 'react'

const PROFILE_KEY = 'dlavie-account-profile-v1'
const SESSION_KEY = 'dlavie-account-session-v1'
const CONSENT_KEY = 'dlavie-consent-v1'
const CONSENT_VERSION = '2026-08-18-v1'

function authorized() {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') as { id?: string } | null
    const consent = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null') as { version?: string; userId?: string } | null
    return sessionStorage.getItem(SESSION_KEY) === 'active' && !!profile?.id && consent?.version === CONSENT_VERSION && consent?.userId === profile.id
  } catch { return false }
}

export default function LoginRedirectEnhancer() {
  const previous = useRef(authorized())

  useEffect(() => {
    const sync = () => {
      const current = authorized()
      if (!previous.current && current) {
        document.querySelector<HTMLButtonElement>('.account-close')?.click()
        history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/home`)
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      }
      previous.current = current
    }
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    const delayed = () => window.setTimeout(sync, 90)
    document.addEventListener('click', delayed, true)
    window.addEventListener('focus', sync)
    window.addEventListener('storage', sync)
    window.addEventListener('dlavie:auth-state', sync)
    return () => {
      observer.disconnect()
      document.removeEventListener('click', delayed, true)
      window.removeEventListener('focus', sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('dlavie:auth-state', sync)
    }
  }, [])

  return null
}
