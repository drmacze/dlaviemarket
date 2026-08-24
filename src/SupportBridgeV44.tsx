import { useEffect } from 'react'

const PROFILE_KEY = 'dlavie-account-profile-v1'
const SESSION_KEY = 'dlavie-account-session-v1'
const CONSENT_KEY = 'dlavie-consent-v1'
const CONSENT_VERSION = '2026-08-18-v1'
const SUPPORT_ROUTES = new Set(['help', 'faq', 'bantuan'])

function routeKey(hash = window.location.hash) {
  return hash.replace(/^#\/?/, '').split(/[?&]/)[0].toLowerCase() || 'home'
}

function isAuthorizedMember() {
  if (sessionStorage.getItem(SESSION_KEY) !== 'active') return false
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') as { id?: string } | null
    const consent = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null') as { version?: string; userId?: string } | null
    return !!profile?.id && consent?.version === CONSENT_VERSION && consent.userId === profile.id
  } catch {
    return false
  }
}

function openSupport() {
  const root = document.querySelector<HTMLElement>('.dlv-assistant')
  if (root?.classList.contains('is-open') || document.querySelector('.dlv-assistant-panel')) return

  let attempt = 0
  const tryOpen = () => {
    if (document.querySelector('.dlv-assistant-panel')) return
    const launcher = document.querySelector<HTMLButtonElement>('.dlv-assistant-launcher')
    if (launcher) {
      launcher.click()
      return
    }
    attempt += 1
    if (attempt < 6) window.setTimeout(tryOpen, 70)
  }
  tryOpen()
}

function isSupportNavigationTarget(target: HTMLElement | null) {
  if (!target) return false
  const control = target.closest<HTMLElement>(
    '.dlv37-bottom-nav button, .dlv37-round-action, .dlv39-result-main, .page-nav-list button, a[href*="#/help"], a[href*="#/faq"]',
  )
  if (!control) return false
  const label = `${control.textContent || ''} ${control.getAttribute('aria-label') || ''} ${control.getAttribute('href') || ''}`.toLowerCase()
  return label.includes('bantuan') || label.includes('help') || label.includes('#/faq')
}

export default function SupportBridgeV44() {
  useEffect(() => {
    document.documentElement.dataset.dlvPolish = 'v44'
    let lastMemberHash = SUPPORT_ROUTES.has(routeKey()) ? '#/home' : (window.location.hash || '#/home')
    let openAfterRestore = false

    const reconcileRoute = () => {
      if (!isAuthorizedMember()) {
        openAfterRestore = false
        return
      }
      const route = routeKey()
      if (!SUPPORT_ROUTES.has(route)) {
        lastMemberHash = window.location.hash || '#/home'
        if (openAfterRestore) {
          openAfterRestore = false
          window.setTimeout(openSupport, 36)
        }
        return
      }

      openAfterRestore = true
      const fallback = SUPPORT_ROUTES.has(routeKey(lastMemberHash)) ? '#/home' : lastMemberHash
      if (window.location.hash !== fallback) window.location.hash = fallback
      else {
        openAfterRestore = false
        window.setTimeout(openSupport, 36)
      }
    }

    const captureSupportNavigation = (event: MouseEvent) => {
      if (!isAuthorizedMember() || !isSupportNavigationTarget(event.target as HTMLElement | null)) return
      event.preventDefault()
      event.stopPropagation()
      openAfterRestore = false
      openSupport()
    }

    const customOpen = () => {
      if (isAuthorizedMember()) openSupport()
    }

    document.addEventListener('click', captureSupportNavigation, true)
    window.addEventListener('hashchange', reconcileRoute)
    window.addEventListener('dlavie:open-support', customOpen)
    reconcileRoute()

    return () => {
      document.removeEventListener('click', captureSupportNavigation, true)
      window.removeEventListener('hashchange', reconcileRoute)
      window.removeEventListener('dlavie:open-support', customOpen)
      delete document.documentElement.dataset.dlvPolish
    }
  }, [])

  return null
}
