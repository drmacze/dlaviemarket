import { useEffect } from 'react'

const BRAND_LOGOS: Record<string, string> = {
  whatsapp: 'whatsapp.svg',
  telegram: 'telegram.svg',
  google: 'google.svg',
  discord: 'discord.svg',
  instagram: 'instagram.svg',
  microsoft: 'microsoft.svg',
}

type Glyph = 'search' | 'spark' | 'inbox' | 'sim' | 'network' | 'wallet' | 'phone' | 'bolt' | 'game' | 'play' | 'activity' | 'shield' | 'help'

const glyphMarkup: Record<Glyph, string> = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  spark: '<path d="m12 3 1.4 4.2L18 9l-4.6 1.8L12 15l-1.4-4.2L6 9l4.6-1.8Z"/><path d="m19 15 .7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9Z"/>',
  inbox: '<path d="M5 4h14l2 9v6H3v-6Z"/><path d="M3 13h5l1.5 2h5L16 13h5"/>',
  sim: '<path d="M8 3h6l4 4v14H6V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h4"/><rect x="9" y="11" width="6" height="6" rx="1"/><path d="M12 11v6M9 14h6"/>',
  network: '<path d="M4.5 9.5a10.7 10.7 0 0 1 15 0"/><path d="M7.5 12.5a6.5 6.5 0 0 1 9 0"/><path d="M10.3 15.5a2.6 2.6 0 0 1 3.4 0"/><circle cx="12" cy="18.5" r=".8" fill="currentColor" stroke="none"/>',
  wallet: '<path d="M4 7a3 3 0 0 1 3-3h12v16H7a3 3 0 0 1-3-3Z"/><path d="M4 8h15"/><path d="M15 12h6v4h-6a2 2 0 0 1 0-4Z"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10 6h4"/><path d="M11 18h2"/>',
  bolt: '<path d="m13.3 2.8-7 10h5l-.8 8.4 7.2-11.2h-5.1z"/>',
  game: '<path d="M7.2 8h9.6a4 4 0 0 1 3.8 5.3l-1.5 4.1a2 2 0 0 1-3.3.8l-1.7-1.7H9.9l-1.7 1.7a2 2 0 0 1-3.3-.8l-1.5-4.1A4 4 0 0 1 7.2 8Z"/><path d="M8 11v4M6 13h4"/><circle cx="16" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="18" cy="14" r=".7" fill="currentColor" stroke="none"/>',
  play: '<rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>',
  activity: '<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v6h6"/><path d="M12 8v5l3 2"/>',
  shield: '<path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6Z"/><path d="m9 12 2 2 4-4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 0 1 4.5 1.2c0 1.8-2.3 2.1-2.3 3.8"/><path d="M12 17h.01"/>',
}

function makeGlyph(kind: Glyph) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '1.8')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.dataset.dlv46FunctionalIcon = kind
  svg.innerHTML = glyphMarkup[kind]
  return svg
}

function replaceGlyph(host: Element | null, kind: Glyph) {
  if (!host) return
  const current = host.querySelector<SVGElement>(`:scope > svg[data-dlv46-functional-icon="${kind}"]`)
  if (current) return
  host.replaceChildren(makeGlyph(kind))
}

function categoryGlyph(label = ''): Glyph | null {
  const value = label.toLowerCase()
  if (value.includes('nomor virtual') || value.includes('otp')) return 'sim'
  if (value.includes('paket data') || value.includes('internet') || value.includes('5g')) return 'network'
  if (value.includes('e-wallet') || value.includes('wallet')) return 'wallet'
  if (value.includes('pulsa')) return 'phone'
  if (value.includes('pln') || value.includes('listrik')) return 'bolt'
  if (value.includes('game') || value.includes('voucher')) return 'game'
  if (value.includes('streaming') || value.includes('hiburan')) return 'play'
  if (value.includes('aktivitas')) return 'activity'
  if (value.includes('keamanan')) return 'shield'
  if (value.includes('bantuan')) return 'help'
  return null
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

function applyFunctionalIcons() {
  document.querySelectorAll<HTMLButtonElement>('.dlv39-utility-row > button').forEach((button) => {
    const label = button.textContent?.toLowerCase() || ''
    const host = button.querySelector('.dlv39-icon')
    if (label.includes('cari')) replaceGlyph(host, 'search')
    else if (label.includes('promo')) replaceGlyph(host, 'spark')
    else if (label.includes('inbox')) replaceGlyph(host, 'inbox')
  })

  document.querySelectorAll<HTMLButtonElement>('.dlv39-route-utilities > button').forEach((button) => {
    const label = button.getAttribute('aria-label')?.toLowerCase() || ''
    if (label.includes('cari')) replaceGlyph(button, 'search')
    else if (label.includes('promo')) replaceGlyph(button, 'spark')
    else if (label.includes('notifikasi')) replaceGlyph(button, 'inbox')
  })

  replaceGlyph(document.querySelector('.dlv39-global-search > span'), 'search')

  document.querySelectorAll<HTMLButtonElement>('.dlv39-favorite-row > button, .dlv39-search-favorites > button').forEach((button) => {
    const kind = categoryGlyph(button.textContent || '')
    if (kind) replaceGlyph(button.querySelector(':scope > span'), kind)
  })

  document.querySelectorAll<HTMLButtonElement>('.dlv39-result-main').forEach((button) => {
    const label = button.querySelector('b')?.textContent || button.textContent || ''
    const kind = categoryGlyph(label)
    if (kind) replaceGlyph(button.querySelector(':scope > span'), kind)
  })

  document.querySelectorAll<HTMLButtonElement>('.dlv39-profile-menu > button').forEach((button) => {
    const kind = categoryGlyph(button.textContent || '')
    if (kind) replaceGlyph(button.querySelector(':scope > span'), kind)
  })
}

function applyVisualPolish() {
  applyOfficialShortcutLogos()
  applyFunctionalIcons()
}

export default function VisualPolishV46() {
  useEffect(() => {
    let frame = 0
    const scan = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(applyVisualPolish)
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
