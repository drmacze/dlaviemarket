import { useEffect } from 'react'

const DOC_ROUTES = ['/docs/overview', '/docs/market', '/docs/how', '/docs/payments', '/docs/security', '/docs/activity', '/docs/help', '/docs/legal']

const RECOVERY_SELECTOR = [
  '.dlv-doc-brand',
  '.dlv-doc-topbar > div > button',
  '.dlv-doc-sidebar nav button',
  '.dlv-doc-scrim',
  '.dlv-ios-guest-scrim',
  '.dlv-doc-actions button',
  '.dlv36-doc-actions button',
  '.dlv36-feature-copy button',
  '.dlv36-doc-links button',
  '.dlv36-doc-footer button',
  '.dlv36-faq-actions button',
].join(',')

function navigate(path: string) {
  window.location.hash = path.replace(/^#/, '')
  window.scrollTo({ top: 0, behavior: 'auto' })
}

function triggerAccount() {
  const existing = document.querySelector<HTMLButtonElement>('.avatar-button:not(.dlv-guest-auth-bridge)')
  if (existing) {
    existing.click()
    return
  }

  const bridge = document.createElement('button')
  bridge.type = 'button'
  bridge.className = 'avatar-button dlv-guest-auth-bridge'
  bridge.tabIndex = -1
  bridge.setAttribute('aria-hidden', 'true')
  Object.assign(bridge.style, {
    position: 'fixed',
    width: '1px',
    height: '1px',
    opacity: '0',
    pointerEvents: 'none',
    left: '-10000px',
    top: '0',
  })
  document.body.appendChild(bridge)
  bridge.click()
  queueMicrotask(() => bridge.remove())
}

function toggleLanguage() {
  const next = localStorage.getItem('dlavie-language') === 'en' ? 'id' : 'en'
  localStorage.setItem('dlavie-language', next)
  window.dispatchEvent(new Event('storage'))
  window.dispatchEvent(new Event('dlavie:language-change'))
}

function closeMenu() {
  const sidebar = document.querySelector<HTMLElement>('.dlv-doc-sidebar')
  const menuButton = document.querySelector<HTMLButtonElement>('.dlv-doc-topbar .is-menu')
  sidebar?.classList.remove('open')
  menuButton?.setAttribute('aria-expanded', 'false')
  document.querySelector('.dlv-ios-guest-scrim')?.remove()
}

function toggleMenu() {
  const root = document.querySelector<HTMLElement>('.dlv-guest-doc-v2')
  const sidebar = document.querySelector<HTMLElement>('.dlv-doc-sidebar')
  const menuButton = document.querySelector<HTMLButtonElement>('.dlv-doc-topbar .is-menu')
  if (!root || !sidebar || !menuButton) return

  const open = !sidebar.classList.contains('open')
  sidebar.classList.toggle('open', open)
  menuButton.setAttribute('aria-expanded', String(open))
  document.querySelector('.dlv-ios-guest-scrim')?.remove()

  if (open) {
    const scrim = document.createElement('button')
    scrim.type = 'button'
    scrim.className = 'dlv-ios-guest-scrim'
    scrim.setAttribute('aria-label', 'Tutup menu')
    root.appendChild(scrim)
  }
}

function routeFromText(text: string) {
  const value = text.toLowerCase()
  if (value.includes('beranda') || value.includes('home')) return '/docs/overview'
  if (value.includes('digital market') || value.includes('marketplace')) return '/docs/market'
  if (value.includes('cara kerja') || value.includes('how it works') || value.includes('panduan') || value.includes('guide')) return '/docs/how'
  if (value.includes('wallet') || value.includes('payment')) return '/docs/payments'
  if (value.includes('keamanan') || value.includes('security')) return '/docs/security'
  if (value.includes('aktivitas') || value.includes('activity')) return '/docs/activity'
  if (value.includes('faq') || value.includes('bantuan') || value.includes('help')) return '/docs/help'
  if (value.includes('legal') || value.includes('kebijakan') || value.includes('policies')) return '/docs/legal'
  return null
}

function execute(button: HTMLElement) {
  if (button.matches('.dlv-doc-brand')) {
    navigate('/docs/overview')
    return
  }

  if (button.matches('.dlv-doc-topbar > div > button:first-child')) {
    toggleLanguage()
    return
  }

  if (button.matches('.dlv-doc-topbar .is-login')) {
    triggerAccount()
    return
  }

  if (button.matches('.dlv-doc-topbar .is-menu')) {
    toggleMenu()
    return
  }

  if (button.matches('.dlv-doc-scrim, .dlv-ios-guest-scrim')) {
    closeMenu()
    return
  }

  if (button.matches('.dlv-doc-sidebar nav button')) {
    const siblings = Array.from(button.parentElement?.querySelectorAll('button') || [])
    const index = siblings.indexOf(button as HTMLButtonElement)
    if (index >= 0 && DOC_ROUTES[index]) {
      closeMenu()
      navigate(DOC_ROUTES[index])
    }
    return
  }

  if (button.matches('.dlv-doc-actions button:first-child, .dlv36-doc-actions .primary, .dlv36-feature-copy button, .dlv36-faq-actions button')) {
    triggerAccount()
    return
  }

  if (button.matches('.dlv-doc-actions button:last-child')) {
    navigate('/docs/market')
    return
  }

  if (button.matches('.dlv36-doc-links button, .dlv36-doc-footer button')) {
    const target = routeFromText(button.textContent || '')
    if (target) navigate(target)
  }
}

export default function GuestInteractionRecovery() {
  useEffect(() => {
    let lastTarget: Element | null = null
    let lastHandledAt = 0

    const onInteraction = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(RECOVERY_SELECTOR) : null
      if (!target) return
      if (!target.closest('.dlv-guest-doc-v2, .dlv36-doc-host')) return

      const now = performance.now()
      const duplicate = target === lastTarget && now - lastHandledAt < 450
      event.preventDefault()
      event.stopPropagation()
      if ('stopImmediatePropagation' in event) event.stopImmediatePropagation()
      if (duplicate) return

      lastTarget = target
      lastHandledAt = now
      execute(target)
    }

    document.addEventListener('pointerup', onInteraction, true)
    document.addEventListener('touchend', onInteraction, { capture: true, passive: false })
    document.addEventListener('click', onInteraction, true)

    return () => {
      document.removeEventListener('pointerup', onInteraction, true)
      document.removeEventListener('touchend', onInteraction, true)
      document.removeEventListener('click', onInteraction, true)
      closeMenu()
    }
  }, [])

  return null
}
