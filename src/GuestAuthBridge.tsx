import { useEffect } from 'react'

const GUEST_AUTH_SELECTOR = [
  '.guest-login',
  '.guest-primary',
  '.dlv36-doc-actions .primary',
  '.dlv36-feature-copy button',
  '.dlv36-faq-actions button',
].join(',')

function triggerAccount() {
  const existing = document.querySelector<HTMLButtonElement>('.avatar-button')
  if (existing) {
    existing.click()
    return
  }

  // AccountSystem listens for click events on `.avatar-button` at document level.
  // Guest/documentation mode can hide the normal navbar completely, so create a
  // short-lived semantic trigger instead of depending on a visible navbar node.
  const bridge = document.createElement('button')
  bridge.type = 'button'
  bridge.className = 'avatar-button dlv-guest-auth-bridge'
  bridge.tabIndex = -1
  bridge.setAttribute('aria-hidden', 'true')
  bridge.style.position = 'fixed'
  bridge.style.width = '1px'
  bridge.style.height = '1px'
  bridge.style.opacity = '0'
  bridge.style.pointerEvents = 'none'
  bridge.style.left = '-10000px'
  bridge.style.top = '0'
  document.body.appendChild(bridge)
  bridge.click()
  queueMicrotask(() => bridge.remove())
}

export default function GuestAuthBridge() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const button = target?.closest(GUEST_AUTH_SELECTOR)
      if (!button) return

      // Existing guest handlers attempt to click the navbar avatar. Keep them
      // intact, then guarantee a working fallback when that navbar is absent.
      window.setTimeout(() => {
        if (!document.documentElement.classList.contains('account-open')) triggerAccount()
      }, 0)
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}
