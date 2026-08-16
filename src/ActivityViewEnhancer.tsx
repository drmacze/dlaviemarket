import { useEffect } from 'react'

const VIEW_KEY = 'dlavie-activity-view'
type ViewMode = 'grid' | 'list'

const gridIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>'
const listIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>'

export default function ActivityViewEnhancer() {
  useEffect(() => {
    let mode: ViewMode = localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'
    let raf = 0
    const cardHandlers = new Map<HTMLElement, EventListener>()

    const setMode = (next: ViewMode) => {
      mode = next
      localStorage.setItem(VIEW_KEY, next)
      const grid = document.querySelector<HTMLElement>('.active-order-grid')
      if (grid) {
        grid.classList.toggle('activity-grid-mode', next === 'grid')
        grid.classList.toggle('activity-list-mode', next === 'list')
        if (next === 'list') grid.querySelectorAll('.activity-order-card.is-expanded').forEach((card) => card.classList.remove('is-expanded'))
      }
      document.querySelectorAll<HTMLButtonElement>('.activity-view-toggle button').forEach((button) => {
        const active = button.dataset.view === next
        button.classList.toggle('active', active)
        button.setAttribute('aria-pressed', String(active))
      })
    }

    const fixTimers = () => {
      document.querySelectorAll<HTMLElement>('.activity-order-card').forEach((card) => {
        const status = card.querySelector<HTMLElement>('.activity-status')
        const timer = card.querySelector<HTMLElement>('.activity-provider-row > b')
        if (!status || !timer) return

        if (status.classList.contains('received')) {
          timer.textContent = 'Selesai'
          timer.classList.add('activity-time-label', 'completed')
        } else if (status.classList.contains('expired')) {
          timer.textContent = 'Kedaluwarsa'
          timer.classList.add('activity-time-label', 'expired')
        } else if (status.classList.contains('cancelled')) {
          timer.textContent = 'Dibatalkan'
          timer.classList.add('activity-time-label', 'cancelled')
        } else if (timer.textContent?.trim() === '00:00') {
          timer.textContent = 'Kedaluwarsa'
          timer.classList.add('activity-time-label', 'expired')
        } else {
          timer.classList.remove('activity-time-label', 'completed', 'expired', 'cancelled')
        }
      })
    }

    const attachCardInteractions = () => {
      document.querySelectorAll<HTMLElement>('.activity-order-card').forEach((card) => {
        if (cardHandlers.has(card)) return
        card.setAttribute('tabindex', '0')
        card.setAttribute('aria-expanded', 'false')

        const toggle = (event: Event) => {
          if (mode !== 'grid') return
          const target = event.target as HTMLElement
          if (target.closest('button, a, input, label')) return
          const expanded = card.classList.toggle('is-expanded')
          card.setAttribute('aria-expanded', String(expanded))
        }
        const keyToggle = (event: KeyboardEvent) => {
          if (mode !== 'grid' || (event.key !== 'Enter' && event.key !== ' ')) return
          if ((event.target as HTMLElement).closest('button, a, input, label')) return
          event.preventDefault()
          const expanded = card.classList.toggle('is-expanded')
          card.setAttribute('aria-expanded', String(expanded))
        }
        const handler: EventListener = toggle
        const keyboardHandler: EventListener = keyToggle as EventListener
        card.addEventListener('click', handler)
        card.addEventListener('keydown', keyboardHandler)
        cardHandlers.set(card, handler)
        ;(card as HTMLElement & { __dlvKeyHandler?: EventListener }).__dlvKeyHandler = keyboardHandler
      })
    }

    const ensureControls = () => {
      const title = document.querySelector<HTMLElement>('.active-order-section .activity-section-title')
      if (!title || title.querySelector('.activity-view-toggle')) return

      const controls = document.createElement('div')
      controls.className = 'activity-view-toggle'
      controls.setAttribute('role', 'group')
      controls.setAttribute('aria-label', 'Tampilan pesanan')
      controls.innerHTML = `
        <button type="button" data-view="grid" aria-label="Tampilan grid">${gridIcon}<span>Grid</span></button>
        <button type="button" data-view="list" aria-label="Tampilan list">${listIcon}<span>List</span></button>
      `
      const buyButton = title.querySelector(':scope > button')
      title.insertBefore(controls, buyButton || null)
      controls.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
        button.addEventListener('click', () => setMode(button.dataset.view === 'list' ? 'list' : 'grid'))
      })
    }

    const apply = () => {
      ensureControls()
      attachCardInteractions()
      setMode(mode)
      fixTimers()
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(apply)
    }

    apply()
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    window.addEventListener('hashchange', schedule)
    window.addEventListener('dlavie:state-changed', schedule)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('hashchange', schedule)
      window.removeEventListener('dlavie:state-changed', schedule)
      document.querySelector('.activity-view-toggle')?.remove()
      cardHandlers.forEach((handler, card) => {
        card.removeEventListener('click', handler)
        const keyboardHandler = (card as HTMLElement & { __dlvKeyHandler?: EventListener }).__dlvKeyHandler
        if (keyboardHandler) card.removeEventListener('keydown', keyboardHandler)
        delete (card as HTMLElement & { __dlvKeyHandler?: EventListener }).__dlvKeyHandler
      })
      cardHandlers.clear()
    }
  }, [])

  return null
}
