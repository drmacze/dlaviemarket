import { useEffect } from 'react'

const fallback = [
  ['PU', 'Pulsa', 'Isi ulang semua operator'],
  ['DT', 'Paket Data', 'Kuota & paket internet'],
  ['PL', 'PLN', 'Token listrik & tagihan'],
  ['EW', 'E-Wallet', 'Top up saldo digital'],
  ['GM', 'Voucher & Game', 'Game, voucher & hiburan'],
  ['TG', 'Bayar Tagihan', 'Layanan pascabayar Digiflazz'],
]

function syncPreview() {
  const grid = document.querySelector<HTMLElement>('.dlv-category-grid')
  if (!grid) return
  const empty = grid.querySelector('.dlv-catalog-empty')
  const placeholders = Array.from(grid.querySelectorAll('.is-digital-placeholder'))

  if (!empty) {
    placeholders.forEach((node) => node.remove())
    return
  }
  if (placeholders.length) return

  fallback.forEach(([mark, name, description]) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'is-digital-placeholder'
    button.setAttribute('aria-disabled', 'true')
    button.innerHTML = `<i>${mark}</i><span><strong>${name}</strong><small>${description} · menunggu sinkron katalog supplier</small></span><b>SYNC</b>`
    button.addEventListener('click', (event) => event.preventDefault())
    grid.insertBefore(button, empty)
  })
}

export default function DigitalMarketCatalogPreview() {
  useEffect(() => {
    let scheduled = false
    const run = () => {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(() => {
        scheduled = false
        syncPreview()
      })
    }
    run()
    const observer = new MutationObserver(run)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('hashchange', run)
    return () => {
      observer.disconnect()
      window.removeEventListener('hashchange', run)
      document.querySelectorAll('.is-digital-placeholder').forEach((node) => node.remove())
    }
  }, [])
  return null
}
