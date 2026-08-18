import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Target = {
  root: HTMLElement
  form: HTMLFormElement
  nativeInput: HTMLTextAreaElement
  nativeButton: HTMLButtonElement
}
type Rects = {
  input: DOMRect
  button: DOMRect
} | null

function setNativeValue(input: HTMLTextAreaElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
  descriptor?.set?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

export default function DLavieAssistantFastComposer() {
  const [target, setTarget] = useState<Target | null>(null)
  const [rects, setRects] = useState<Rects>(null)
  const [draft, setDraft] = useState('')
  const [placeholder, setPlaceholder] = useState('')
  const [disabled, setDisabled] = useState(false)
  const sendingRef = useRef(false)
  const currentFormRef = useRef<HTMLFormElement | null>(null)

  const syncRects = useCallback((nextTarget = target) => {
    if (!nextTarget || !nextTarget.form.isConnected || !nextTarget.nativeInput.isConnected || !nextTarget.nativeButton.isConnected) {
      setRects(null)
      return
    }
    setRects({ input: nextTarget.nativeInput.getBoundingClientRect(), button: nextTarget.nativeButton.getBoundingClientRect() })
    setPlaceholder(nextTarget.nativeInput.placeholder || '')
    setDisabled(nextTarget.nativeInput.disabled || nextTarget.form.classList.contains('is-cooldown'))
  }, [target])

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
      if (currentFormRef.current !== form) {
        currentFormRef.current = form
        setDraft(nativeInput.value || '')
        setTarget({ root, form, nativeInput, nativeButton })
        requestAnimationFrame(() => syncRects({ root, form, nativeInput, nativeButton }))
      } else {
        syncRects({ root, form, nativeInput, nativeButton })
      }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(discover) }

    const observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.type === 'childList' || (m.type === 'attributes' && ['class', 'disabled', 'placeholder'].includes(m.attributeName || '')))) schedule()
    })
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled', 'placeholder'] })

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
  }, [syncRects])

  useEffect(() => {
    if (!target) return
    const counter = target.root.querySelector<HTMLElement>('.dlv-assistant-composer-meta span:first-child')
    if (counter) counter.textContent = `${draft.length}/1600`
  }, [draft, target])

  const send = useCallback(() => {
    if (!target || disabled || sendingRef.current) return
    const text = draft.trim()
    if (!text) return
    sendingRef.current = true
    setNativeValue(target.nativeInput, text)
    setDraft('')
    requestAnimationFrame(() => {
      try { target.form.requestSubmit() } finally {
        window.setTimeout(() => { sendingRef.current = false }, 90)
      }
    })
  }, [disabled, draft, target])

  if (!target || !rects) return null

  const inputStyle: React.CSSProperties = {
    left: `${rects.input.left}px`,
    top: `${rects.input.top}px`,
    width: `${rects.input.width}px`,
    height: `${rects.input.height}px`,
  }
  const buttonStyle: React.CSSProperties = {
    left: `${rects.button.left}px`,
    top: `${rects.button.top}px`,
    width: `${rects.button.width}px`,
    height: `${rects.button.height}px`,
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
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            send()
          }
        }}
        aria-label="Tulis pesan ke DLavie Support"
      />
      <button
        type="button"
        className="dlv-fast-composer-send"
        style={buttonStyle}
        disabled={disabled || !draft.trim()}
        onClick={send}
        aria-label="Kirim pesan"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 4 17 8-17 8 3-8-3-8Z"/><path d="M7 12h14"/></svg>
      </button>
    </>,
    document.body,
  )
}
