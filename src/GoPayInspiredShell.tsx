import { useEffect, useMemo, useState } from 'react'

type PageId = 'home' | 'market' | 'guide' | 'security' | 'activity' | 'help' | 'legal'
type HistoryItem = { id: string; type: 'deposit' | 'order'; label: string; amount: number; time: string }

type IconName = 'home' | 'market' | 'activity' | 'help' | 'more' | 'wallet' | 'phone' | 'grid' | 'history' | 'search' | 'shield' | 'arrow' | 'spark'

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5h5v5"/></>,
    market: <><path d="M4 8h16l-1 12H5L4 8Z"/><path d="M7 8a5 5 0 0 1 10 0"/></>,
    activity: <><path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v6h6"/><path d="M12 8v5l3 2"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 0 1 4.5 1.2c0 1.8-2.3 2.1-2.3 3.8"/><path d="M12 17h.01"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    wallet: <><path d="M4 7a3 3 0 0 1 3-3h12v16H7a3 3 0 0 1-3-3Z"/><path d="M4 8h15"/><path d="M15 12h6v4h-6a2 2 0 0 1 0-4Z"/></>,
    phone: <><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10 6h4"/><path d="M11 18h2"/></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></>,
    history: <><path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v6h6"/><path d="M12 8v4l2.5 1.5"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.7-3.7"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6Z"/><path d="m9 12 2 2 4-4"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    spark: <><path d="m12 3 1.5 4.4L18 9l-4.5 1.6L12 15l-1.5-4.4L6 9l4.5-1.6Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function normalizePage(hash = window.location.hash): PageId {
  const value = hash.replace(/^#\/?/, '').split(/[?&]/)[0].toLowerCase()
  if (value === 'market') return 'market'
  if (value === 'guide' || value === 'cara-kerja') return 'guide'
  if (value === 'security' || value === 'keamanan') return 'security'
  if (value === 'activity' || value === 'aktivitas') return 'activity'
  if (value === 'help' || value === 'faq' || value === 'bantuan') return 'help'
  if (value === 'legal' || value === 'terms' || value === 'privacy' || value === 'kebijakan') return 'legal'
  return 'home'
}

function readHistory(): HistoryItem[] {
  try {
    const value = JSON.parse(localStorage.getItem('dlavie-history') || '[]') as HistoryItem[]
    return Array.isArray(value) ? value.slice(0, 3) : []
  } catch {
    return []
  }
}

function readBalance() {
  const value = Number(localStorage.getItem('dlavie-balance') || 0)
  return Number.isFinite(value) ? value : 0
}

const serviceShortcuts = [
  { name: 'WhatsApp', meta: 'Indonesia', price: 1250, initials: 'WA' },
  { name: 'Telegram', meta: 'Indonesia', price: 950, initials: 'TG' },
  { name: 'Google', meta: 'Indonesia', price: 1350, initials: 'G' },
  { name: 'Discord', meta: 'Indonesia', price: 1100, initials: 'DC' },
]

export default function GoPayInspiredShell() {
  const [page, setPage] = useState<PageId>(() => normalizePage())
  const [balance, setBalance] = useState(readBalance)
  const [history, setHistory] = useState<HistoryItem[]>(readHistory)
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.dlvLayout = 'app-v37'
    const onHash = () => { setPage(normalizePage()); setMoreOpen(false) }
    window.addEventListener('hashchange', onHash)
    const timer = window.setInterval(() => {
      const nextBalance = readBalance()
      const nextHistory = readHistory()
      setBalance((current) => current === nextBalance ? current : nextBalance)
      setHistory((current) => JSON.stringify(current) === JSON.stringify(nextHistory) ? current : nextHistory)
    }, 700)
    return () => {
      window.removeEventListener('hashchange', onHash)
      window.clearInterval(timer)
      delete document.documentElement.dataset.dlvLayout
    }
  }, [])

  const navigate = (next: PageId, query = '') => {
    setMoreOpen(false)
    window.location.hash = `/${next}${query}`
  }

  const openDeposit = () => {
    const button = document.querySelector<HTMLButtonElement>('.balance-pill')
    if (button) button.click()
    else navigate('home')
  }

  const latest = useMemo(() => history.slice(0, 3), [history])

  return (
    <>
      {page === 'home' && (
        <main className="dlv-app-home-v37" aria-label="Beranda DLavie Market">
          <section className="dlv37-welcome">
            <div>
              <span className="dlv37-kicker">DLavie Market</span>
              <h1>Semua kebutuhan digitalmu, satu langkah lebih dekat.</h1>
              <p>Isi saldo, pilih layanan, dan pantau transaksi dari satu beranda yang ringkas.</p>
            </div>
            <button className="dlv37-round-action" type="button" onClick={() => navigate('help')} aria-label="Buka bantuan"><Icon name="help" /></button>
          </section>

          <div className="dlv37-home-grid">
            <section className="dlv37-primary-column">
              <article className="dlv37-wallet-card">
                <div className="dlv37-wallet-head">
                  <span><Icon name="wallet" /> Saldo DLavie</span>
                  <small>Siap digunakan</small>
                </div>
                <strong>{rupiah.format(balance)}</strong>
                <div className="dlv37-wallet-actions">
                  <button type="button" onClick={openDeposit}><span>+</span> Isi saldo</button>
                  <button type="button" onClick={() => navigate('activity')}><Icon name="history" /> Riwayat</button>
                </div>
              </article>

              <section className="dlv37-quick-actions" aria-label="Aksi cepat">
                <button type="button" onClick={openDeposit}><span><Icon name="wallet" /></span><b>Isi Saldo</b><small>Mulai Rp1.000</small></button>
                <button type="button" onClick={() => navigate('market', '?mode=nokos')}><span><Icon name="phone" /></span><b>Beli Nomor</b><small>OTP & verifikasi</small></button>
                <button type="button" onClick={() => navigate('market')}><span><Icon name="grid" /></span><b>Produk Digital</b><small>Pulsa & voucher</small></button>
                <button type="button" onClick={() => navigate('activity')}><span><Icon name="history" /></span><b>Aktivitas</b><small>Status terbaru</small></button>
              </section>

              <button className="dlv37-search-entry" type="button" onClick={() => navigate('market')}>
                <Icon name="search" />
                <span><b>Cari layanan</b><small>WhatsApp, Telegram, pulsa, voucher...</small></span>
                <Icon name="arrow" />
              </button>

              <section className="dlv37-section">
                <div className="dlv37-section-head"><div><span>Sering dicari</span><h2>Layanan populer</h2></div><button type="button" onClick={() => navigate('market')}>Lihat semua</button></div>
                <div className="dlv37-service-row">
                  {serviceShortcuts.map((item) => (
                    <button type="button" className="dlv37-service-card" key={item.name} onClick={() => navigate('market', '?mode=nokos')}>
                      <span className="dlv37-service-logo">{item.initials}</span>
                      <span className="dlv37-service-copy"><b>{item.name}</b><small>{item.meta}</small></span>
                      <strong>{rupiah.format(item.price)}</strong>
                    </button>
                  ))}
                </div>
              </section>
            </section>

            <aside className="dlv37-side-column">
              <article className="dlv37-promo-card">
                <span className="dlv37-promo-icon"><Icon name="spark" /></span>
                <small>Pilihan hemat</small>
                <h2>Nomor virtual mulai dari Rp950.</h2>
                <p>Bandingkan layanan dan negara tanpa harus membuka banyak halaman.</p>
                <button type="button" onClick={() => navigate('market', '?mode=nokos')}>Jelajahi market <Icon name="arrow" /></button>
              </article>

              <section className="dlv37-activity-card">
                <div className="dlv37-section-head"><div><span>Terbaru</span><h2>Aktivitas</h2></div><button type="button" onClick={() => navigate('activity')}>Lihat semua</button></div>
                {latest.length ? (
                  <div className="dlv37-activity-list">
                    {latest.map((item) => (
                      <div className="dlv37-activity-row" key={item.id}>
                        <span className={`dlv37-activity-icon ${item.type}`}><Icon name={item.type === 'deposit' ? 'wallet' : 'market'} /></span>
                        <span><b>{item.label}</b><small>{item.time}</small></span>
                        <strong className={item.amount > 0 ? 'positive' : ''}>{item.amount > 0 ? '+' : ''}{rupiah.format(item.amount)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dlv37-empty-activity"><Icon name="activity" /><b>Belum ada transaksi</b><small>Aktivitas pembelian dan deposit akan muncul di sini.</small></div>
                )}
              </section>

              <button className="dlv37-trust-card" type="button" onClick={() => navigate('security')}>
                <span><Icon name="shield" /></span>
                <span><b>Keamanan & perlindungan</b><small>Pelajari bagaimana Dlavie menjaga flow transaksi.</small></span>
                <Icon name="arrow" />
              </button>
            </aside>
          </div>
        </main>
      )}

      <nav className="dlv37-bottom-nav" aria-label="Navigasi utama">
        <button type="button" className={page === 'home' ? 'active' : ''} onClick={() => navigate('home')}><Icon name="home" /><span>Beranda</span></button>
        <button type="button" className={page === 'market' ? 'active' : ''} onClick={() => navigate('market')}><Icon name="market" /><span>Market</span></button>
        <button type="button" className={page === 'activity' ? 'active' : ''} onClick={() => navigate('activity')}><Icon name="activity" /><span>Aktivitas</span></button>
        <button type="button" className={page === 'help' ? 'active' : ''} onClick={() => navigate('help')}><Icon name="help" /><span>Bantuan</span></button>
        <button type="button" className={['guide','security','legal'].includes(page) || moreOpen ? 'active' : ''} onClick={() => setMoreOpen((value) => !value)} aria-expanded={moreOpen}><Icon name="more" /><span>Lainnya</span></button>
      </nav>

      {moreOpen && (
        <div className="dlv37-more-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setMoreOpen(false)}>
          <section className="dlv37-more-sheet" aria-label="Menu lainnya">
            <div className="dlv37-sheet-handle" />
            <div className="dlv37-sheet-head"><div><small>Menu lainnya</small><h2>Informasi Dlavie</h2></div><button type="button" onClick={() => setMoreOpen(false)}>×</button></div>
            <div className="dlv37-more-list">
              <button type="button" onClick={() => navigate('guide')}><span><Icon name="grid" /></span><p><b>Cara kerja</b><small>Pelajari alur deposit, pembelian, dan status order.</small></p><Icon name="arrow" /></button>
              <button type="button" onClick={() => navigate('security')}><span><Icon name="shield" /></span><p><b>Keamanan</b><small>Proteksi akun, backend, dan data transaksi.</small></p><Icon name="arrow" /></button>
              <button type="button" onClick={() => navigate('legal')}><span><Icon name="history" /></span><p><b>Kebijakan & legal</b><small>Terms, privasi, refund, dan ketentuan layanan.</small></p><Icon name="arrow" /></button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
