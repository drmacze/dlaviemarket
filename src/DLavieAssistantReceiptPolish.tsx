import { useEffect } from 'react'

function lang() { return localStorage.getItem('dlavie-language') === 'en' ? 'en' : 'id' }

export default function DLavieAssistantReceiptPolish() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.dlv-assistant')
    if (!root) return
    let raf = 0
    const patch = () => {
      raf = 0
      const receipt = root.querySelector<HTMLElement>('.dlv-assistant-receipt')
      if (!receipt || receipt.querySelector('.dlv-ui-close-detail')) return
      const idle = !!root.querySelector('.dlv-assistant-message[data-kind="idle_closed"], .dlv-assistant-message[data-kind="idle_warning"]')
      const admin = root.classList.contains('mode-admin') || root.classList.contains('mode-admin_pending')
      const row = document.createElement('p')
      row.className = 'dlv-ui-close-detail'
      row.innerHTML = `<small>${lang() === 'en' ? 'CLOSE REASON' : 'ALASAN DITUTUP'}</small><strong>${idle ? (lang() === 'en' ? 'No activity for 5 minutes' : 'Tidak ada aktivitas selama 5 menit') : (lang() === 'en' ? 'Session completed' : 'Sesi diselesaikan')}</strong>`
      const handler = document.createElement('p')
      handler.className = 'dlv-ui-close-detail'
      handler.innerHTML = `<small>${lang() === 'en' ? 'HANDLED BY' : 'DITANGANI OLEH'}</small><strong>${admin ? 'DLavie Admin' : 'DLavie Engine'}</strong>`
      const list = receipt.querySelector(':scope > div:not(.dlv-ui-resolution)')
      list?.append(row, handler)
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(patch) }
    const observer = new MutationObserver((mutations) => { if (mutations.some((m) => m.type === 'childList')) schedule() })
    observer.observe(root, { childList: true, subtree: true })
    schedule()
    return () => { if (raf) cancelAnimationFrame(raf); observer.disconnect() }
  }, [])
  return null
}
