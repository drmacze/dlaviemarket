import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'

type PageId = 'home' | 'market' | 'guide' | 'security' | 'activity'

type PageItem = {
  id: PageId
  label: string
  eyebrow: string
  description: string
}

const pages: PageItem[] = [
  { id: 'home', label: 'Beranda', eyebrow: '01', description: 'Ringkasan akun, wallet & layanan' },
  { id: 'market', label: 'Market', eyebrow: '02', description: 'Layanan, provider, harga & sesi' },
  { id: 'guide', label: 'Cara kerja', eyebrow: '03', description: 'Pembayaran, order sampai OTP' },
  { id: 'security', label: 'Keamanan', eyebrow: '04', description: 'Proteksi data & status backend' },
  { id: 'activity', label: 'Aktivitas', eyebrow: '05', description: 'Order, OTP, deposit & refund' },
]

function normalizePage(hash = window.location.hash): PageId {
  const value = hash.replace(/^#\/?/, '').split(/[?&]/)[0].toLowerCase()
  if (value === 'market') return 'market'
  if (value === 'guide' || value === 'cara-kerja') return 'guide'
  if (value === 'security' || value === 'keamanan') return 'security'
  if (value === 'activity' || value === 'aktivitas') return 'activity'
  return 'home'
}

function pageSelector(page: PageId) {
  if (page === 'home') return '.hero'
  if (page === 'market') return '.catalog-section'
  if (page === 'guide') return '.experience'
  if (page === 'security') return '.security'
  return '.history-section'
}

export default function PageNavigation() {
  const [page, setPage] = useState<PageId>(() => normalizePage())
  const [open, setOpen] = useState(false)
  const dockRef = useRef<HTMLDivElement>(null)
  const active = useMemo(() => pages.find((item) => item.id === page) ?? pages[0], [page])

  const navigate = (next: PageId) => {
    setOpen(false)
    if (next === page && window.location.hash === `#/${next}`) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    window.location.hash = `/${next}`
  }

  useEffect(() => {
    const sync = () => {
      const next = normalizePage()
      setPage(next)
      document.documentElement.dataset.page = next
      window.scrollTo({ top: 0, behavior: 'auto' })

      requestAnimationFrame(() => {
        const target = document.querySelector<HTMLElement>(pageSelector(next))
        if (!target) return
        gsap.killTweensOf(target)
        gsap.fromTo(target,
          { opacity: 0, y: 18, scale: .994 },
          { opacity: 1, y: 0, scale: 1, duration: .52, ease: 'power3.out', clearProps: 'transform' },
        )
      })
    }

    document.documentElement.dataset.page = normalizePage()
    if (!window.location.hash || window.location.hash === '#top') {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/home`)
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    const captureRouteButtons = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      const marketButton = target.closest('.hero-actions .button-primary, .cta-card .button-light')
      if (marketButton) {
        event.preventDefault()
        event.stopPropagation()
        navigate('market')
        return
      }

      const brand = target.closest('.site-nav .brand, .footer .brand')
      if (brand) {
        event.preventDefault()
        navigate('home')
      }
    }

    document.addEventListener('click', captureRouteButtons, true)
    return () => document.removeEventListener('click', captureRouteButtons, true)
  }, [page])

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      if (!dockRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [open])

  return (
    <div className={`page-nav-dock${open ? ' is-open' : ''}`} ref={dockRef}>
      <button className="page-nav-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Pilih halaman">
        <span className="page-nav-current">{active.label}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m7 9 5 5 5-5" /></svg>
      </button>

      {open && (
        <section className="page-nav-menu" aria-label="Navigasi halaman">
          <div className="page-nav-head">
            <span>Navigasi</span>
            <small>{active.eyebrow} / 05</small>
          </div>
          <div className="page-nav-list">
            {pages.map((item) => (
              <button key={item.id} type="button" className={page === item.id ? 'active' : ''} onClick={() => navigate(item.id)}>
                <span className="page-nav-index">{item.eyebrow}</span>
                <span className="page-nav-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                <span className="page-nav-arrow">→</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
