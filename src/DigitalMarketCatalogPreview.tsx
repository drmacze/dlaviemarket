import { useEffect } from 'react'

const fallback = [
  ['PU', 'Pulsa', 'Isi ulang semua operator'],
  ['DT', 'Paket Data', 'Kuota & paket internet'],
  ['PL', 'PLN', 'Token listrik & tagihan'],
  ['EW', 'E-Wallet', 'Top up saldo digital'],
  ['GM', 'Voucher & Game', 'Game, voucher & hiburan'],
  ['TG', 'Bayar Tagihan', 'Layanan pascabayar Digiflazz'],
]

function installPreview() {
  const grid = document.querySelector<HTMLElement>('.dlv-category-grid')
  if (!grid || !grid.querySelector('.dlv-catalog-empty') || grid.querySelector('.is-digital-placeholder')) return
  const empty = grid.querySelector('.dlv-catalog-empty')
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

function clearPreview() {
  document.querySelectorAll('.is-digital-placeholder').forEach((node) => node.remove())
}

export default function DigitalMarketCatalogPreview() {
  useEffect(() => {
    let timer = 0
    const run = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        clearPreview()
        installPreview()
      }, 30)
    }
    run()
    const observer = new MutationObserver(run)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('hashchange', run)
    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
      window.removeEventListener('hashchange', run)
      clearPreview()
    }
  }, [])
  return null
}
