import { useEffect, useMemo, useState } from 'react'

type ThemeMode = 'dark' | 'light'
type AccentMode = 'mono' | 'custom'

type CommerceIconName = 'cart' | 'bag' | 'card' | 'receipt' | 'tag' | 'store' | 'coins' | 'box' | 'truck' | 'barcode' | 'wallet' | 'percent'

const commerceIcons: CommerceIconName[] = [
  'cart', 'bag', 'card', 'receipt', 'tag', 'store', 'coins', 'box', 'truck', 'barcode', 'wallet', 'percent',
  'box', 'card', 'cart', 'tag', 'wallet', 'store', 'receipt', 'coins', 'truck', 'bag', 'percent', 'barcode',
  'tag', 'cart', 'box', 'wallet', 'card', 'store', 'coins', 'receipt', 'bag', 'truck', 'barcode', 'percent',
]

const presets = ['#6D5DFC', '#00A67E', '#FF4D6D', '#FF8A00', '#1D8CFF', '#B65CFF']

function CommerceIcon({ name }: { name: CommerceIconName }) {
  const paths = {
    cart: <><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6H18a2 2 0 0 0 1.9-1.4L22 8H7"/></>,
    bag: <><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h3"/></>,
    tag: <><path d="M20 13 13 20l-9-9V4h7l9 9Z"/><circle cx="8.5" cy="8.5" r="1.5"/></>,
    store: <><path d="M4 10v10h16V10M3 10l2-6h14l2 6"/><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-5h6v5"/></>,
    coins: <><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v5c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 11v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/></>,
    box: <><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="m4 7 8 4 8-4v10l-8 4-8-4V7ZM12 11v10"/></>,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    barcode: <><path d="M4 5v14M7 5v14M11 5v14M14 5v14M16 5v14M20 5v14"/></>,
    wallet: <><path d="M4 7a3 3 0 0 1 3-3h12v16H7a3 3 0 0 1-3-3V7Z"/><path d="M4 8h15M15 12h6v5h-6a2.5 2.5 0 0 1 0-5Z"/></>,
    percent: <><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/><path d="M6 18 18 6"/></>,
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function contrastColor(hex: string) {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return '#ffffff'
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const linear = (value: number) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
  return luminance > 0.46 ? '#090909' : '#ffffff'
}

export default function ThemeSystem() {
  const [mode, setMode] = useState<ThemeMode>(() => (localStorage.getItem('dlavie-theme') as ThemeMode) || 'dark')
  const [accentMode, setAccentMode] = useState<AccentMode>(() => (localStorage.getItem('dlavie-accent-mode') as AccentMode) || 'mono')
  const [accent, setAccent] = useState(() => localStorage.getItem('dlavie-accent') || '#6D5DFC')
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState(0)

  const activeSet = useMemo(() => {
    const first = phase % commerceIcons.length
    return new Set([first, (first + 7) % commerceIcons.length, (first + 15) % commerceIcons.length, (first + 26) % commerceIcons.length])
  }, [phase])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = mode
    root.dataset.accent = accentMode
    root.style.setProperty('--accent-user', accent)
    root.style.setProperty('--accent-contrast', contrastColor(accent))
    root.style.colorScheme = mode
    localStorage.setItem('dlavie-theme', mode)
    localStorage.setItem('dlavie-accent-mode', accentMode)
    localStorage.setItem('dlavie-accent', accent)
  }, [mode, accentMode, accent])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const timer = window.setInterval(() => setPhase((value) => value + 1), 1250)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <>
      <div className="commerce-field" aria-hidden="true">
        {commerceIcons.map((name, index) => (
          <span
            className={`commerce-symbol commerce-symbol-${index % 9}${activeSet.has(index) ? ' is-hot' : ''}`}
            style={{ '--i': index } as React.CSSProperties}
            key={`${name}-${index}`}
          >
            <CommerceIcon name={name} />
          </span>
        ))}
      </div>

      <div className={`theme-dock${open ? ' is-open' : ''}`}>
        <button className="theme-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Pengaturan tema">
          <span className="theme-trigger-swatch" />
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M8 4v6M16 14v6"/></svg>
        </button>

        {open && (
          <section className="theme-panel" aria-label="Pengaturan tema">
            <div className="theme-panel-head">
              <div><strong>Tampilan</strong><span>Atur mode & aksen</span></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup pengaturan">×</button>
            </div>

            <div className="theme-setting">
              <span className="theme-label">Mode</span>
              <div className="mode-segment">
                <button type="button" className={mode === 'dark' ? 'active' : ''} onClick={() => setMode('dark')}><span>●</span> Dark</button>
                <button type="button" className={mode === 'light' ? 'active' : ''} onClick={() => setMode('light')}><span>○</span> Light</button>
              </div>
            </div>

            <div className="theme-setting">
              <div className="theme-setting-row"><span className="theme-label">Accent</span><small>{accentMode === 'mono' ? 'Monochrome' : accent.toUpperCase()}</small></div>
              <button type="button" className={`mono-choice${accentMode === 'mono' ? ' active' : ''}`} onClick={() => setAccentMode('mono')}>
                <span className="mono-preview"><i /><i /></span>
                <span><strong>Black & White</strong><small>Tanpa warna tambahan</small></span>
                <b>✓</b>
              </button>
              <div className="preset-row">
                {presets.map((color) => <button type="button" key={color} className={`preset-dot${accentMode === 'custom' && accent.toLowerCase() === color.toLowerCase() ? ' active' : ''}`} style={{ '--preset': color } as React.CSSProperties} onClick={() => { setAccent(color); setAccentMode('custom') }} aria-label={`Pilih warna ${color}`} />)}
                <label className="custom-color" aria-label="Pilih warna custom">
                  <input type="color" value={accent} onChange={(event) => { setAccent(event.target.value); setAccentMode('custom') }} />
                  <span>+</span>
                </label>
              </div>
            </div>

            <div className="theme-preview-strip"><span /><span /><span /></div>
          </section>
        )}
      </div>
    </>
  )
}
