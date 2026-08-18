import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'

type Target = {
  root: HTMLElement
  form: HTMLFormElement
  nativeInput: HTMLTextAreaElement
  nativeButton: HTMLButtonElement
}
type Rects = { input: DOMRect; button: DOMRect } | null

function setNativeValue(input: HTMLTextAreaElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
  descriptor?.set?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}
function touchAssistant(root: HTMLElement) {
  try { root.dispatchEvent(new Event('pointerdown', { bubbles: true })) } catch { /* optional */ }
}
function sendHaptic() {
  try {
    const nav = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean }
    nav.vibrate?.([7, 18, 7])
  } catch { /* browser may not expose vibration */ }
  const html = document.documentElement
  html.classList.remove('dlv-haptic-pulse')
  requestAnimationFrame(() => {
    html.classList.add('dlv-haptic-pulse')
    window.setTimeout(() => html.classList.remove('dlv-haptic-pulse'), 150)
  })
}

export default function DLavieAssistantFastComposer() {
  const [target, setTarget] = useState<Target | null>(null)
  const [rects, setRects] = useState<Rects>(null)
  const [draft, setDraft] = useState('')
  const [placeholder, setPlaceholder] = useState('')
  const [disabled, setDisabled] = useState(false)
  const sendingRef = useRef(false)
  const currentFormRef = useRef<HTMLFormElement | null>(null)
  const lastTouchRef = useRef(0)

  const syncTarget = useCallback((next: Target) => {
    if (!next.form.isConnected || !next.nativeInput.isConnected || !next.nativeButton.isConnected) return false
    setRects({ input: next.nativeInput.getBoundingClientRect(), button: next.nativeButton.getBoundingClientRect() })
    setPlaceholder(next.nativeInput.placeholder || '')
    setDisabled(next.nativeInput.disabled || next.form.classList.contains('is-cooldown'))
    return true
  }, [])

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.dlv-assistant')
    if (!root) return
    let frame = 0

    const discover = () => {
      frame = 0
      const form = root.querySelector<HTMLFormElement>('.dlv-assistant-composer')
      const nativeInput = form?.querySelector<HTMLTextAreaElement>('textarea') || null
      const nativeButton = form?.querySelector<HTMLButtonElement>('button[type="submit"]') || null
      if (!form || !nativeInput || !nativeButton) {
        currentFormRef.current = null
        root.classList.remove('is-fast-compose')
        setTarget(null)
        setRects(null)
        setDraft('')
        return
      }
      root.classList.add('is-fast-compose')
      const next = { root, form, nativeInput, nativeButton }
      if (currentFormRef.current !== form) {
        currentFormRef.current = form
        setDraft(nativeInput.value || '')
        setTarget(next)
      }
      syncTarget(next)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(discover) }

    const observer = new MutationObserver(() => schedule())
    observer.observe(root, { childList: true, subtree: true })
    window.addEventListener('resize', schedule, { passive: true })
    window.addEventListener('scroll', schedule, { passive: true, capture: true })
    window.visualViewport?.addEventListener('resize', schedule, { passive: true })
    window.visualViewport?.addEventListener('scroll', schedule, { passive: true })
    schedule()

    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
      root.classList.remove('is-fast-compose')
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
      window.visualViewport?.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('scroll', schedule)
    }
  }, [syncTarget])

  useEffect(() => {
    if (!target) return
    const sync = () => syncTarget(target)
    const attributeObserver = new MutationObserver(sync)
    attributeObserver.observe(target.form, { attributes: true, attributeFilter: ['class'] })
    attributeObserver.observe(target.nativeInput, { attributes: true, attributeFilter: ['disabled', 'placeholder'] })
    return () => attributeObserver.disconnect()
  }, [syncTarget, target])

  useEffect(() => {
    if (!target) return
    const counter = target.root.querySelector<HTMLElement>('.dlv-assistant-composer-meta span:first-child')
    if (counter) counter.textContent = `${draft.length}/1600`
  }, [draft, target])

  useEffect(() => {
    if (!target) return
    const click = (event: MouseEvent) => {
      const node = event.target as HTMLElement | null
      if (!node) return
      const prompt = node.closest<HTMLButtonElement>('[data-prompt]')
      if (prompt && target.root.contains(prompt)) {
        setDraft(prompt.textContent?.trim() || '')
        touchAssistant(target.root)
        requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>('.dlv-fast-composer-input')?.focus({ preventScroll: true }))
        return
      }
      const action = node.closest<HTMLButtonElement>('[data-message-action]')
      if (!action || !target.root.contains(action) || action.dataset.messageAction === 'copy') return
      const en = localStorage.getItem('dlavie-language') === 'en'
      const value = action.dataset.messageAction === 'admin'
        ? (en ? 'Please hand this session to a human admin.' : 'Tolong lanjutkan sesi ini ke admin manusia.')
        : action.dataset.messageAction === 'reply-admin'
          ? (en ? 'I am still here. I want to add more information.' : 'Saya masih di sini. Saya ingin menambahkan informasi.')
          : (en ? 'Explain your previous answer more simply, with a direct answer first and clear steps.' : 'Jelaskan jawaban sebelumnya lebih sederhana. Beri jawaban langsung terlebih dahulu lalu langkah yang jelas.')
      setDraft(value)
      touchAssistant(target.root)
      requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>('.dlv-fast-composer-input')?.focus({ preventScroll: true }))
    }
    document.addEventListener('click', click)
    return () => document.removeEventListener('click', click)
  }, [target])

  const markTypingActivity = useCallback(() => {
    if (!target) return
    const now = Date.now()
    if (now - lastTouchRef.current < 850) return
    lastTouchRef.current = now
    touchAssistant(target.root)
  }, [target])

  const send = useCallback(() => {
    if (!target || disabled || sendingRef.current) return
    const text = draft.trim()
    if (!text) return
    sendingRef.current = true
    touchAssistant(target.root)
    sendHaptic()
    setNativeValue(target.nativeInput, text)
    setDraft('')
    requestAnimationFrame(() => {
      try { target.form.requestSubmit() }
      finally { window.setTimeout(() => { sendingRef.current = false }, 100) }
    })
  }, [disabled, draft, target])

  if (!target || !rects) return null

  const inputStyle: CSSProperties = {
    left: `${rects.input.left}px`, top: `${rects.input.top}px`, width: `${rects.input.width}px`, height: `${rects.input.height}px`,
  }
  const buttonStyle: CSSProperties = {
    left: `${rects.button.left}px`, top: `${rects.button.top}px`, width: `${rects.button.width}px`, height: `${rects.button.height}px`,
  }

  return createPortal(
    <>
      <textarea
        className="dlv-fast-composer-input"
        style={inputStyle}
        value={draft}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={1600}
        rows={1}
        onChange={(event) => { setDraft(event.target.value); markTypingActivity() }}
        onKeyDown={(event) => {
          markTypingActivity()
          if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send() }
        }}
        aria-label="Tulis pesan ke DLavie Support"
      />
      <button type="button" className="dlv-fast-composer-send" style={buttonStyle} disabled={disabled || !draft.trim()} onClick={send} aria-label="Kirim pesan">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 4 17 8-17 8 3-8-3-8Z"/><path d="M7 12h14"/></svg>
      </button>
    </>,
    document.body,
  )
}
