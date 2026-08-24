import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type CountryCode = 'ID' | 'MY' | 'SG' | 'US' | 'GB'
type ModalState = 'deposit' | 'order' | 'auth' | null

type Service = {
  id: string
  name: string
  short: string
  category: string
  price: number
  stock: number
  country: CountryCode
  flag: string
  tint: string
}

type HistoryItem = {
  id: string
  type: 'deposit' | 'order'
  label: string
  amount: number
  time: string
}

const services: Service[] = [
  { id: 'wa-id', name: 'WhatsApp', short: 'WA', category: 'Messaging', price: 1250, stock: 94, country: 'ID', flag: '🇮🇩', tint: '#25D366' },
  { id: 'tg-id', name: 'Telegram', short: 'TG', category: 'Messaging', price: 950, stock: 182, country: 'ID', flag: '🇮🇩', tint: '#2AABEE' },
  { id: 'gg-id', name: 'Google', short: 'G', category: 'Account', price: 1350, stock: 77, country: 'ID', flag: '🇮🇩', tint: '#4285F4' },
  { id: 'dc-id', name: 'Discord', short: 'DC', category: 'Community', price: 1100, stock: 66, country: 'ID', flag: '🇮🇩', tint: '#5865F2' },
  { id: 'ig-my', name: 'Instagram', short: 'IG', category: 'Social', price: 1700, stock: 53, country: 'MY', flag: '🇲🇾', tint: '#E1306C' },
  { id: 'wa-my', name: 'WhatsApp', short: 'WA', category: 'Messaging', price: 1550, stock: 61, country: 'MY', flag: '🇲🇾', tint: '#25D366' },
  { id: 'tg-sg', name: 'Telegram', short: 'TG', category: 'Messaging', price: 1850, stock: 39, country: 'SG', flag: '🇸🇬', tint: '#2AABEE' },
  { id: 'ms-us', name: 'Microsoft', short: 'MS', category: 'Account', price: 2400, stock: 48, country: 'US', flag: '🇺🇸', tint: '#00A4EF' },
  { id: 'gg-us', name: 'Google', short: 'G', category: 'Account', price: 2650, stock: 28, country: 'US', flag: '🇺🇸', tint: '#4285F4' },
  { id: 'dc-gb', name: 'Discord', short: 'DC', category: 'Community', price: 2150, stock: 44, country: 'GB', flag: '🇬🇧', tint: '#5865F2' },
]

const countries: Array<{ code: 'ALL' | CountryCode; label: string }> = [
  { code: 'ALL', label: 'Semua' },
  { code: 'ID', label: '🇮🇩 Indonesia' },
  { code: 'MY', label: '🇲🇾 Malaysia' },
  { code: 'SG', label: '🇸🇬 Singapore' },
  { code: 'US', label: '🇺🇸 USA' },
  { code: 'GB', label: '🇬🇧 UK' },
]

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

function Icon({ name }: { name: 'arrow' | 'search' | 'wallet' | 'spark' | 'shield' | 'bolt' | 'chevron' | 'close' | 'user' }) {
  const paths = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    wallet: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 8h15"/><path d="M15 12h6v5h-6a2.5 2.5 0 0 1 0-5Z"/></>,
    spark: <><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6z"/><path d="m9 12 2 2 4-4"/></>,
    bolt: <path d="m13 2-8 12h6l-1 8 9-13h-6z"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function MagneticButton({ children, className = '', onClick, type = 'button' }: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit'
}) {
  const ref = useRef<HTMLButtonElement>(null)

  const move = (event: MouseEvent<HTMLButtonElement>) => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = event.clientX - rect.left - rect.width / 2
    const y = event.clientY - rect.top - rect.height / 2
    gsap.to(ref.current, { x: x * 0.12, y: y * 0.16, duration: 0.35, ease: 'power3.out' })
  }

  const leave = () => {
    if (ref.current) gsap.to(ref.current, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, .4)' })
  }

  return <button ref={ref} type={type} className={`magnetic ${className}`} onMouseMove={move} onMouseLeave={leave} onClick={onClick}>{children}</button>
}

function ServiceCard({ service, onBuy }: { service: Service; onBuy: (service: Service) => void }) {
  const cardRef = useRef<HTMLElement>(null)

  const tilt = (event: MouseEvent<HTMLElement>) => {
    if (!cardRef.current || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const rect = cardRef.current.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    gsap.to(cardRef.current, { rotateY: px * 5, rotateX: py * -5, y: -4, transformPerspective: 900, duration: 0.35, ease: 'power2.out' })
  }

  const reset = () => {
    if (cardRef.current) gsap.to(cardRef.current, { rotateY: 0, rotateX: 0, y: 0, duration: 0.6, ease: 'power3.out' })
  }

  return (
    <article ref={cardRef} className="service-card" data-reveal onMouseMove={tilt} onMouseLeave={reset}>
      <div className="service-top">
        <div className="service-logo" style={{ '--service-tint': service.tint } as React.CSSProperties}>{service.short}</div>
        <div className="stock"><span />{service.stock} stok</div>
      </div>
      <div className="service-copy">
        <span>{service.category}</span>
        <h3>{service.name}</h3>
      </div>
      <div className="service-country"><span>{service.flag}</span><span>{countries.find((item) => item.code === service.country)?.label.replace(/^..\s/, '')}</span></div>
      <div className="service-bottom">
        <div><small>Mulai dari</small><strong>{rupiah.format(service.price)}</strong></div>
        <button className="buy-icon" onClick={() => onBuy(service)} aria-label={`Beli ${service.name}`}><Icon name="arrow" /></button>
      </div>
    </article>
  )
}

function App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const heroVisualRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState<'ALL' | CountryCode>('ALL')
  const [modal, setModal] = useState<ModalState>(null)
  const [selected, setSelected] = useState<Service | null>(null)
  const [deposit, setDeposit] = useState('1000')
  const [balance, setBalance] = useState(() => Number(localStorage.getItem('dlavie-balance') || 0))
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('dlavie-history') || '[]') as HistoryItem[] } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('dlavie-balance', String(balance))
    localStorage.setItem('dlavie-history', JSON.stringify(history))
  }, [balance, history])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const touchDevice = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
    let lenis: Lenis | null = null
    let ticker: ((time: number) => void) | null = null

    if (!reduceMotion && !touchDevice) {
      lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.92, touchMultiplier: 1.1 })
      lenis.on('scroll', ScrollTrigger.update)
      ticker = (time: number) => lenis?.raf(time * 1000)
      gsap.ticker.add(ticker)
      gsap.ticker.lagSmoothing(0)
    }

    const ctx = gsap.context(() => {
      if (!reduceMotion) {
        const intro = gsap.timeline({ defaults: { ease: 'power4.out' } })
        intro
          .from('.site-nav', { y: -24, opacity: 0, duration: 0.8 })
          .from('.hero-kicker', { y: 18, opacity: 0, duration: 0.6 }, '-=.45')
          .from('.hero-word', { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.08 }, '-=.4')
          .from('.hero-copy > p', { y: 24, opacity: 0, duration: 0.7 }, '-=.55')
          .from('.hero-actions > *', { y: 18, opacity: 0, duration: 0.6, stagger: 0.08 }, '-=.45')
          .from('.hero-proof > *', { y: 14, opacity: 0, duration: 0.55, stagger: 0.07 }, '-=.4')
          .from('.hero-visual', { x: 48, opacity: 0, scale: 0.96, duration: 1 }, '-=.85')

        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((item) => {
          gsap.from(item, {
            y: 42,
            opacity: 0,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: { trigger: item, start: 'top 88%', once: true },
          })
        })

        gsap.to('.orb-one', { xPercent: 18, yPercent: -12, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut' })
        gsap.to('.orb-two', { xPercent: -16, yPercent: 14, duration: 10, repeat: -1, yoyo: true, ease: 'sine.inOut' })
        gsap.to('.float-card-a', { y: -9, rotation: -1.2, duration: 2.7, repeat: -1, yoyo: true, ease: 'sine.inOut' })
        gsap.to('.float-card-b', { y: 8, rotation: 1.4, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut' })
        gsap.to('.marquee-track', { xPercent: -50, duration: 22, repeat: -1, ease: 'none' })
      }
    }, rootRef)

    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      if (ticker) gsap.ticker.remove(ticker)
      lenis?.destroy()
    }
  }, [])

  useEffect(() => {
    if (!heroVisualRef.current || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const visual = heroVisualRef.current
    const xTo = gsap.quickTo(visual, 'rotateY', { duration: 0.7, ease: 'power3.out' })
    const yTo = gsap.quickTo(visual, 'rotateX', { duration: 0.7, ease: 'power3.out' })
    const move = (event: globalThis.MouseEvent) => {
      const rect = visual.getBoundingClientRect()
      xTo(((event.clientX - rect.left) / rect.width - 0.5) * 5)
      yTo(((event.clientY - rect.top) / rect.height - 0.5) * -5)
    }
    const leave = () => { xTo(0); yTo(0) }
    visual.addEventListener('mousemove', move)
    visual.addEventListener('mouseleave', leave)
    return () => { visual.removeEventListener('mousemove', move); visual.removeEventListener('mouseleave', leave) }
  }, [])

  useEffect(() => {
    if (!modal) return
    document.documentElement.classList.add('modal-open')
    gsap.fromTo('.modal-shell', { y: 26, opacity: 0, scale: 0.985 }, { y: 0, opacity: 1, scale: 1, duration: 0.42, ease: 'power3.out' })
    return () => document.documentElement.classList.remove('modal-open')
  }, [modal])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return services.filter((service) => {
      const matchesCountry = country === 'ALL' || service.country === country
      const matchesQuery = !normalized || `${service.name} ${service.category}`.toLowerCase().includes(normalized)
      return matchesCountry && matchesQuery
    })
  }, [country, query])

  const buy = (service: Service) => {
    setSelected(service)
    setModal('order')
  }

  const confirmOrder = () => {
    if (!selected) return
    if (balance < selected.price) {
      setModal('deposit')
      return
    }
    setBalance((current) => current - selected.price)
    setHistory((items) => [{ id: crypto.randomUUID(), type: 'order' as const, label: `${selected.name} · ${selected.flag}`, amount: -selected.price, time: 'Baru saja' }, ...items].slice(0, 8))
    setModal(null)
  }

  const submitDeposit = (event: FormEvent) => {
    event.preventDefault()
    const amount = Number(deposit.replace(/\D/g, ''))
    if (!Number.isFinite(amount) || amount < 1000) return
    setBalance((current) => current + amount)
    setHistory((items) => [{ id: crypto.randomUUID(), type: 'deposit' as const, label: 'Deposit saldo', amount, time: 'Baru saja' }, ...items].slice(0, 8))
    setModal(null)
  }

  const scrollToCatalog = () => document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="app" ref={rootRef}>
      <div className="noise" />
      <div className="ambient orb-one" />
      <div className="ambient orb-two" />

      <header className="site-nav-wrap">
        <nav className="site-nav shell">
          <a className="brand" href="#top" aria-label="DLavie Market home">
            <span className="brand-mark"><i /><i /></span>
            <span>DLavie<span>Market</span></span>
          </a>
          <div className="nav-links">
            <a href="#catalog">Layanan</a>
            <a href="#how">Cara kerja</a>
            <a href="#security">Keamanan</a>
          </div>
          <div className="nav-actions">
            <button className="balance-pill" onClick={() => setModal('deposit')}><Icon name="wallet" /><span>{rupiah.format(balance)}</span></button>
            <button className="avatar-button" onClick={() => setModal('auth')} aria-label="Masuk"><Icon name="user" /></button>
          </div>
        </nav>
      </header>

      <main id="top">
        <section className="hero shell">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="live-dot" /> Virtual number marketplace <b>2.0</b></div>
            <h1 aria-label="Nomor virtual, dibuat terasa effortless.">
              <span className="line-mask"><span className="hero-word">Nomor virtual,</span></span>
              <span className="line-mask gradient-line"><span className="hero-word">dibuat terasa effortless.</span></span>
            </h1>
            <p>Marketplace nomor virtual yang cepat, bersih, dan transparan. Cari layanan, pilih negara, lalu selesaikan order tanpa alur yang bikin bingung.</p>
            <div className="hero-actions">
              <MagneticButton className="button button-primary" onClick={scrollToCatalog}>Mulai cari nomor <Icon name="arrow" /></MagneticButton>
              <MagneticButton className="button button-secondary" onClick={() => setModal('deposit')}><Icon name="wallet" /> Deposit mulai Rp1.000</MagneticButton>
            </div>
            <div className="hero-proof">
              <div><Icon name="bolt" /><span><strong>Realtime-ready</strong><small>Status order</small></span></div>
              <div><Icon name="shield" /><span><strong>Secure flow</strong><small>Backend-ready</small></span></div>
              <div><Icon name="spark" /><span><strong>Smart pricing</strong><small>Multi-supplier</small></span></div>
            </div>
          </div>

          <div className="hero-visual-wrap">
            <div className="hero-visual" ref={heroVisualRef}>
              <div className="visual-glow" />
              <div className="market-window">
                <div className="window-bar">
                  <div className="window-brand"><span className="mini-mark" /> DLavie</div>
                  <div className="window-status"><span /> Live market</div>
                </div>
                <div className="window-balance">
                  <div><small>Available balance</small><strong>{rupiah.format(balance)}</strong></div>
                  <button onClick={() => setModal('deposit')}>+</button>
                </div>
                <div className="window-search"><Icon name="search" /><span>Cari layanan...</span><kbd>⌘ K</kbd></div>
                <div className="window-list">
                  {services.slice(0, 4).map((service, index) => (
                    <div className="window-row" key={service.id}>
                      <div className="window-logo" style={{ '--service-tint': service.tint } as React.CSSProperties}>{service.short}</div>
                      <div className="window-meta"><strong>{service.name}</strong><span>{service.flag} {service.stock} stok</span></div>
                      <div className="window-price"><small>mulai</small><strong>{rupiah.format(service.price)}</strong></div>
                      <span className={`row-pulse pulse-${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="floating-note float-card-a"><span className="success-icon">✓</span><div><small>Order selesai</small><strong>OTP diterima</strong></div></div>
              <div className="floating-note float-card-b"><span className="coin-icon">Rp</span><div><small>Minimum deposit</small><strong>Rp1.000 saja</strong></div></div>
            </div>
          </div>
        </section>

        <section className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...Array(2)].flatMap((_, set) => ['WhatsApp', 'Telegram', 'Google', 'Discord', 'Instagram', 'Microsoft'].map((name) => <span key={`${set}-${name}`}>{name}<i>✦</i></span>))}
          </div>
        </section>

        <section className="catalog-section shell" id="catalog">
          <div className="section-heading" data-reveal>
            <div><span className="eyebrow">Market</span><h2>Cari nomor yang kamu butuhkan.</h2></div>
            <p>Harga demo di bawah disiapkan untuk UI. Saat supplier API aktif, harga dan stok dapat diperbarui otomatis.</p>
          </div>

          <div className="catalog-panel" data-reveal>
            <div className="search-field"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari WhatsApp, Telegram, Google..." /></div>
            <div className="country-tabs" data-lenis-prevent-horizontal>
              {countries.map((item) => <button key={item.code} className={country === item.code ? 'active' : ''} onClick={() => setCountry(item.code)}>{item.label}</button>)}
            </div>
          </div>

          <div className="service-grid">
            {filtered.map((service) => <ServiceCard service={service} onBuy={buy} key={service.id} />)}
          </div>
          {filtered.length === 0 && <div className="empty-state"><Icon name="search" /><h3>Layanan belum ditemukan</h3><p>Coba kata kunci atau negara lain.</p></div>}
        </section>

        <section className="experience shell" id="how">
          <div className="experience-card" data-reveal>
            <div className="experience-head"><span className="eyebrow">Simple by design</span><h2>Tiga langkah. Selesai.</h2><p>Tidak ada dashboard yang penuh tombol tidak penting. Fokusnya hanya pada apa yang dibutuhkan untuk menyelesaikan order.</p></div>
            <div className="steps-grid">
              <article><span className="step-number">01</span><div className="step-icon"><Icon name="wallet" /></div><h3>Isi saldo</h3><p>Deposit mulai Rp1.000 dengan alur pembayaran yang nantinya diverifikasi oleh backend.</p></article>
              <article><span className="step-number">02</span><div className="step-icon"><Icon name="search" /></div><h3>Pilih layanan</h3><p>Filter negara, lihat stok dan harga, lalu pilih penawaran yang paling cocok.</p></article>
              <article><span className="step-number">03</span><div className="step-icon"><Icon name="bolt" /></div><h3>Pantau order</h3><p>Status, kode masuk, timeout, cancel, dan refund dipusatkan dalam satu flow.</p></article>
            </div>
          </div>
        </section>

        <section className="security shell" id="security">
          <div className="security-copy" data-reveal>
            <span className="eyebrow">Built to scale</span>
            <h2>Frontend terasa ringan. Arsitektur tetap serius.</h2>
            <p>UI ini dipisahkan dari secret key, callback pembayaran, dan kredensial supplier. Semua bagian sensitif memang harus hidup di backend ketika production diaktifkan.</p>
            <div className="security-list">
              <div><span><Icon name="shield" /></span><p><strong>Secret tetap di server</strong><small>Tidak pernah ditanam di JavaScript browser.</small></p></div>
              <div><span><Icon name="bolt" /></span><p><strong>Supplier-agnostic</strong><small>Siap memilih provider berdasar harga dan stok.</small></p></div>
              <div><span><Icon name="spark" /></span><p><strong>Motion yang terkontrol</strong><small>GSAP + Lenis dengan reduced-motion fallback.</small></p></div>
            </div>
          </div>
          <div className="architecture-card" data-reveal>
            <div className="architecture-top"><span>Architecture</span><span className="status-chip">Production-ready pattern</span></div>
            <div className="architecture-flow">
              <div className="arch-node primary"><span>01</span><strong>GitHub Pages</strong><small>React UI</small></div>
              <i><Icon name="chevron" /></i>
              <div className="arch-node"><span>02</span><strong>Secure API</strong><small>Auth · balance</small></div>
              <i><Icon name="chevron" /></i>
              <div className="arch-node"><span>03</span><strong>Providers</strong><small>QRIS · supplier</small></div>
            </div>
            <div className="code-strip"><span>status</span><strong>200 OK</strong><i /><span>latency</span><strong>84ms</strong><i /><span>region</span><strong>SEA</strong></div>
          </div>
        </section>

        <section className="history-section shell" data-reveal>
          <div className="history-card">
            <div className="history-head"><div><span className="eyebrow">Wallet activity</span><h2>Riwayat demo</h2></div><strong>{rupiah.format(balance)}</strong></div>
            {history.length ? <div className="history-list">{history.map((item) => <div className="history-row" key={item.id}><span className={item.type}><Icon name={item.type === 'deposit' ? 'wallet' : 'arrow'} /></span><div><strong>{item.label}</strong><small>{item.time}</small></div><b className={item.amount > 0 ? 'positive' : ''}>{item.amount > 0 ? '+' : ''}{rupiah.format(item.amount)}</b></div>)}</div> : <div className="history-empty"><span><Icon name="wallet" /></span><p><strong>Belum ada aktivitas</strong><small>Deposit atau pembelian demo akan muncul di sini.</small></p></div>}
          </div>
        </section>

        <section className="final-cta shell" data-reveal>
          <div className="cta-card">
            <div className="cta-orb" />
            <span className="eyebrow">DLavie Market</span>
            <h2>Lebih cepat dari cari nomor sampai order selesai.</h2>
            <p>Mulai dari deposit Rp1.000 dan alur yang dirancang mobile-first.</p>
            <MagneticButton className="button button-light" onClick={scrollToCatalog}>Explore market <Icon name="arrow" /></MagneticButton>
          </div>
        </section>
      </main>

      <footer className="footer shell">
        <a className="brand" href="#top"><span className="brand-mark"><i /><i /></span><span>DLavie<span>Market</span></span></a>
        <p>Modern static frontend on GitHub Pages.</p>
        <span>© 2026 DLavie</span>
      </footer>

      {modal && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
          <section className="modal-shell" data-lenis-prevent>
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Tutup"><Icon name="close" /></button>
            {modal === 'deposit' && (
              <form onSubmit={submitDeposit}>
                <div className="modal-icon"><Icon name="wallet" /></div>
                <span className="eyebrow">Wallet</span>
                <h2>Tambah saldo</h2>
                <p>Minimum deposit <strong>Rp1.000</strong>. Saat ini masih simulasi frontend dan belum membuat QRIS asli.</p>
                <label className="amount-input"><span>Rp</span><input inputMode="numeric" value={deposit} onChange={(event) => setDeposit(event.target.value.replace(/\D/g, ''))} autoFocus /></label>
                <div className="preset-grid">{[1000, 5000, 10000, 25000].map((amount) => <button type="button" key={amount} onClick={() => setDeposit(String(amount))}>{rupiah.format(amount).replace('Rp', 'Rp ')}</button>)}</div>
                <MagneticButton type="submit" className="button button-primary button-full">Lanjutkan deposit <Icon name="arrow" /></MagneticButton>
                {Number(deposit || 0) < 1000 && <span className="form-error">Minimum deposit adalah Rp1.000.</span>}
              </form>
            )}
            {modal === 'order' && selected && (
              <div>
                <div className="modal-icon" style={{ '--service-tint': selected.tint } as React.CSSProperties}>{selected.short}</div>
                <span className="eyebrow">Confirm order</span>
                <h2>{selected.name}</h2>
                <p>Pastikan layanan dan negaranya sudah sesuai sebelum melanjutkan.</p>
                <div className="order-summary"><div><span>Negara</span><strong>{selected.flag} {countries.find((item) => item.code === selected.country)?.label.replace(/^..\s/, '')}</strong></div><div><span>Harga</span><strong>{rupiah.format(selected.price)}</strong></div><div><span>Saldo</span><strong>{rupiah.format(balance)}</strong></div></div>
                <MagneticButton className="button button-primary button-full" onClick={confirmOrder}>{balance >= selected.price ? 'Konfirmasi pembelian' : 'Saldo kurang — deposit'} <Icon name="arrow" /></MagneticButton>
                <small className="modal-footnote">Order masih berupa simulasi dan belum menghubungi supplier sungguhan.</small>
              </div>
            )}
            {modal === 'auth' && (
              <div>
                <div className="modal-icon"><Icon name="user" /></div>
                <span className="eyebrow">Account</span>
                <h2>Masuk ke DLavie</h2>
                <p>Form akun production akan dihubungkan ke backend auth pada tahap berikutnya.</p>
                <label className="text-field"><span>Email</span><input type="email" placeholder="nama@email.com" /></label>
                <label className="text-field"><span>Password</span><input type="password" placeholder="••••••••" /></label>
                <MagneticButton className="button button-primary button-full" onClick={() => setModal(null)}>Masuk <Icon name="arrow" /></MagneticButton>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default App