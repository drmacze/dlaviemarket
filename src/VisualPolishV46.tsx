import { useEffect } from 'react'

const BRAND_LOGOS: Record<string, string> = {
  whatsapp: 'whatsapp.svg',
  telegram: 'telegram.svg',
  google: 'google.svg',
  discord: 'discord.svg',
  instagram: 'instagram.svg',
  microsoft: 'microsoft.svg',
}

function applyOfficialShortcutLogos() {
  document.querySelectorAll<HTMLElement>('.dlv37-service-card').forEach((card) => {
    const label = card.querySelector<HTMLElement>('.dlv37-service-copy b')?.textContent?.trim().toLowerCase() || ''
    const file = BRAND_LOGOS[label]
    const logo = card.querySelector<HTMLElement>('.dlv37-service-logo')
    if (!file || !logo) return
    if (logo.querySelector('img[data-dlv46-official-brand]')) return

    const image = document.createElement('img')
    image.src = `${import.meta.env.BASE_URL}brands/${file}`
    image.alt = `${label} logo`
    image.decoding = 'async'
    image.loading = 'lazy'
    image.dataset.dlv46OfficialBrand = '1'
    logo.replaceChildren(image)
  })
}

export default function VisualPolishV46() {
  useEffect(() => {
    let frame = 0
    const scan = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(applyOfficialShortcutLogos)
    }

    const observer = new MutationObserver(scan)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('hashchange', scan)
    window.addEventListener('dlavie:state-changed', scan)
    scan()

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener('hashchange', scan)
      window.removeEventListener('dlavie:state-changed', scan)
    }
  }, [])

  return null
}
