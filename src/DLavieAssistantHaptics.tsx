import { useEffect } from 'react'

type HapticKind = 'tap' | 'send' | 'reply' | 'success' | 'warning' | 'error'

function pulse(kind: HapticKind) {
  const patterns: Record<HapticKind, number | number[]> = {
    tap: 8,
    send: [7, 18, 7],
    reply: [9, 24, 12],
    success: [10, 22, 16, 28, 10],
    warning: [22, 42, 22],
    error: [38, 28, 38],
  }

  try {
    const nav = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean }
    nav.vibrate?.(patterns[kind])
  } catch {
    // Some browsers intentionally do not expose vibration to web pages.
  }

  const root = document.documentElement
  root.classList.remove('dlv-haptic-pulse')
  void root.offsetWidth
  root.classList.add('dlv-haptic-pulse')
  window.setTimeout(() => root.classList.remove('dlv-haptic-pulse'), 150)
}

export default function DLavieAssistantHaptics() {
  useEffect(() => {
    const handledMessages = new WeakSet<Element>()
    const handledErrors = new WeakSet<Element>()
    const handledStates = new WeakSet<Element>()
    let lastPulseAt = 0

    const safePulse = (kind: HapticKind, minimumGap = 110) => {
      const now = Date.now()
      if (now - lastPulseAt < minimumGap) return
      lastPulseAt = now
      pulse(kind)
    }

    const scan = () => {
      document.querySelectorAll('.dlv-assistant-message.is-assistant:not(.is-typing)').forEach((node) => {
        if (handledMessages.has(node)) return
        handledMessages.add(node)
        const kind = node.getAttribute('data-kind')
        if (kind === 'idle_warning') safePulse('warning', 260)
        else if (kind === 'closing') safePulse('success', 260)
        else safePulse('reply', 220)
      })

      document.querySelectorAll('.dlv-assistant-error,.dlv-assistant-composer-error').forEach((node) => {
        if (handledErrors.has(node)) return
        handledErrors.add(node)
        safePulse('error', 240)
      })

      document.querySelectorAll('.dlv-assistant-quick,.dlv-assistant-receipt').forEach((node) => {
        if (handledStates.has(node)) return
        handledStates.add(node)
        safePulse('success', 260)
      })
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest('.dlv-assistant')) return
      if (target.closest('.dlv-assistant-composer button[type="submit"],.dlv-assistant-intake button[type="submit"]')) safePulse('send')
      else if (target.closest('.dlv-assistant-end')) safePulse('warning')
      else if (target.closest('button')) safePulse('tap')
    }

    const observer = new MutationObserver((mutations) => {
      if (!mutations.some((mutation) => mutation.type === 'childList' || (mutation.type === 'attributes' && mutation.attributeName === 'class'))) return
      scan()
    })

    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    document.addEventListener('pointerdown', onPointerDown, true)
    scan()

    return () => {
      observer.disconnect()
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [])

  return null
}
