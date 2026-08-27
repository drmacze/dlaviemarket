import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import AppIcon, { type AppIconName } from './AppIcon'
import './icon-system-v50.css'

type Panel = 'search' | 'notifications' | 'rewards' | 'profile' | null
type Profile = { id?: string; username?: string; email?: string; avatarId?: string }
type HistoryItem = { id?: string; type?: string; label?: string; detail?: string; amount?: number; time?: string }
type StoredOrder = { id: string; serviceName?: string; providerName?: string; countryName?: string; flag?: string; status?: string; expiresAt?: number; price?: number }
type SearchItem = { id: string; name: string; subtitle: string; group: string; route: string; icon: AppIconName }
type Reward = { id: string; label: string; title: string; body: string; route: string; icon: AppIconName }
type NotificationItem = { id: string; title: string; body: string; icon: AppIconName; route?: string }

const PROFILE_KEY = 'dlavie-account-profile-v1'
const HISTORY_KEY = 'dlavie-history'
const ORDERS_KEY = 'dlavie-orders-v1'
const FAVORITES_KEY = 'dlavie-favorites-v39'
const RECENTS_KEY = 'dlavie-recents-v39'
const REWARDS_KEY = 'dlavie-rewards-v39'
const READ_KEY = 'dlavie-notifications-read-v39'
const STATE_EVENT = 'dlavie:state-changed'
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

const catalog: SearchItem[] = [
  { id: 'nokos', name: 'Nomor Virtual', subtitle: 'Nomor verifikasi & OTP', group: 'Market', route: '#/market?mode=nokos', icon: 'sim' },
  { id: 'pulsa', name: 'Pulsa', subtitle: 'Isi pulsa semua operator', group: 'Produk Digital', route: '#/market?category=Pulsa', icon: 'phone' },
  { id: 'data', name: 'Paket Data', subtitle: 'Kuota & paket internet', group: 'Produk Digital', route: '#/market?category=Paket%20Data', icon: 'network' },
  { id: 'pln', name: 'PLN', subtitle: 'Token listrik & layanan PLN', group: 'Produk Digital', route: '#/market?category=PLN', icon: 'bolt' },
  { id: 'wallet', name: 'E-Wallet', subtitle: 'DANA, OVO, GoPay & lainnya', group: 'Produk Digital', route: '#/market?category=E-Wallet', icon: 'wallet' },
  { id: 'game', name: 'Voucher & Game', subtitle: 'Diamond, UC, voucher dan item', group: 'Produk Digital', route: '#/market?category=Voucher%20%26%20Game', icon: 'game' },
  { id: 'streaming', name: 'Streaming & Hiburan', subtitle: 'Voucher layanan hiburan', group: 'Produk Digital', route: '#/market?category=Streaming%20%26%20Hiburan', icon: 'play' },
  { id: 'activity', name: 'Aktivitas', subtitle: 'Pesanan, OTP, pembayaran & refund', group: 'Akun', route: '#/activity', icon: 'activity' },
  { id: 'help', name: 'Bantuan', subtitle: 'FAQ dan dukungan transaksi', group: 'Akun', route: '#/help', icon: 'help' },
  { id: 'security', name: 'Keamanan', subtitle: 'Proteksi akun & transaksi', group: 'Akun', route: '#/security', icon: 'shield' },
]

const rewards: Reward[] = [
  { id: 'cheap-nokos', label: 'REKOMENDASI', title: 'Nomor virtual mulai dari pilihan termurah.', body: 'Bandingkan provider, stok, dan estimasi SMS sebelum mengaktifkan nomor.', route: '#/market?mode=nokos', icon: 'sim' },
  { id: 'data-auto', label: 'FITUR', title: 'Cari paket data dari nomor.', body: 'Masukkan nomor untuk membantu mendeteksi operator, atau pilih operator secara manual.', route: '#/market?category=Paket%20Data', icon: 'network' },
  { id: 'game-hub', label: 'KOLEKSI', title: 'Voucher game dalam satu hub.', body: 'Buka Mobile Legends, Free Fire, PUBG, Roblox, Valorant, dan judul lain dari kategori yang sama.', route: '#/market?category=Voucher%20%26%20Game', icon: 'game' },
  { id: 'wallet-safe', label: 'TIPS', title: 'Periksa tujuan sebelum top up.', body: 'Buka pilihan e-wallet dan cek kembali nomor serta nominal sebelum transaksi dikirim.', route: '#/market?category=E-Wallet', icon: 'wallet' },
]

function parseArray<T>(key: string): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]') as T[]
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function readProfile(): Profile | null {
  try {
    const value = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') as Profile | null
    return value && typeof value === 'object' ? value : null
  } catch {
    return null
  }
}

function writeArray<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value))
}

function Icon({ name }: { name: AppIconName }) {
  return <span className="dlv39-icon"><AppIcon name={name} /></span>
}

export default function AppExperienceV39() {
  const [panel, setPanel] = useState<Panel>(null)
  const [query, setQuery] = useState('')
  const [balance, setBalance] = useState(() => Number(localStorage.getItem('dlavie-balance') || 0))
  const [profile, setProfile] = useState<Profile | null>(readProfile)
  const [history, setHistory] = useState<HistoryItem[]>(() => parseArray<HistoryItem>(HISTORY_KEY))
  const [orders, setOrders] = useState<StoredOrder[]>(() => parseArray<StoredOrder>(ORDERS_KEY))
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = parseArray<string>(FAVORITES_KEY)
    return saved.length ? saved : ['nokos', 'data', 'wallet']
  })
  const [recents, setRecents] = useState<string[]>(() => parseArray<string>(RECENTS_KEY))
  const [savedRewards, setSavedRewards] = useState<string[]>(() => parseArray<string>(REWARDS_KEY))
  const [readFingerprint, setReadFingerprint] = useState(() => localStorage.getItem(READ_KEY) || '')
  const [homeToolsHost, setHomeToolsHost] = useState<HTMLElement | null>(null)
  const [homeQuickHost, setHomeQuickHost] = useState<HTMLElement | null>(null)
  const [routeToolsHost, setRouteToolsHost] = useState<HTMLElement | null>(null)

  useEffect(() => {
    document.documentElement.dataset.dlvExperience = 'v39'
    const sync = () => {
      setBalance(Number(localStorage.getItem('dlavie-balance') || 0))
      setProfile(readProfile())
      setHistory(parseArray<HistoryItem>(HISTORY_KEY))
      setOrders(parseArray<StoredOrder>(ORDERS_KEY))
      setFavorites((current) => {
        const value = parseArray<string>(FAVORITES_KEY)
        return value.length ? value : current
      })
      setRecents(parseArray<string>(RECENTS_KEY))
      setSavedRewards(parseArray<string>(REWARDS_KEY))
    }
    sync()
    window.addEventListener(STATE_EVENT, sync)
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    const timer = window.setInterval(sync, 1500)
    return () => {
      delete document.documentElement.dataset.dlvExperience
      window.removeEventListener(STATE_EVENT, sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    const owned: HTMLElement[] = []
    const ensure = (parent: Element | null, className: string, after?: Element | null) => {
      if (!parent) return null
      let node = parent.querySelector<HTMLElement>(`:scope > .${className}`)
      if (!node) {
        node = document.createElement('div')
        node.className = className
        if (after?.parentElement === parent) after.insertAdjacentElement('afterend', node)
        else parent.appendChild(node)
        owned.push(node)
      }
      return node
    }
    let queued = false
    const scan = () => {
      queued = false
      const welcome = document.querySelector('.dlv37-welcome')
      const homeRoot = document.querySelector('.dlv-app-home-v37')
      const searchEntry = document.querySelector('.dlv37-search-entry')
      const routeActions = document.querySelector('.dlv38-route-actions')
      setHomeToolsHost(ensure(welcome, 'dlv39-home-tools-host'))
      setHomeQuickHost(ensure(homeRoot, 'dlv39-home-quick-host', searchEntry))
      setRouteToolsHost(ensure(routeActions, 'dlv39-route-tools-host'))
    }
    const queue = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(scan)
    }
    const observer = new MutationObserver(queue)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('hashchange', queue)
    queue()
    return () => {
      observer.disconnect()
      window.removeEventListener('hashchange', queue)
      owned.forEach((node) => node.remove())
    }
  }, [])

  useEffect(() => {
    if (!panel) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanel(null)
    }
    document.documentElement.classList.add('dlv39-panel-open')
    document.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.classList.remove('dlv39-panel-open')
      document.removeEventListener('keydown', onKey)
    }
  }, [panel])

  const fingerprint = useMemo(() => {
    const orderSignal = orders.slice(0, 4).map((item) => `${item.id}:${item.status || ''}`).join('|')
    const historySignal = history.slice(0, 4).map((item) => `${item.id || item.label || ''}:${item.time || ''}`).join('|')
    return `${orderSignal}::${historySignal}`
  }, [history, orders])

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = []
    orders.filter((item) => item.status === 'waiting' || item.status === 'received').slice(0, 3).forEach((item) => {
      items.push({
        id: `order-${item.id}`,
        title: item.status === 'received' ? `OTP ${item.serviceName || 'pesanan'} sudah masuk` : `${item.serviceName || 'Nomor virtual'} sedang menunggu SMS`,
        body: item.providerName ? `${item.providerName}${item.flag ? ` · ${item.flag}` : ''}` : 'Pantau status pesanan dari Aktivitas.',
        icon: item.status === 'received' ? 'check' : 'message',
        route: '#/activity',
      })
    })
    history.slice(0, 2).forEach((item, index) => {
      items.push({
        id: `history-${item.id || index}`,
        title: item.label || 'Aktivitas terbaru',
        body: item.detail || item.time || 'Transaksi DLavie',
        icon: item.type === 'deposit' ? 'deposit' : 'activity',
        route: '#/activity',
      })
    })
    if (!items.length) items.push({ id: 'welcome', title: 'Semua siap digunakan', body: 'Cari produk, simpan layanan favorit, atau buka Market untuk memulai.', icon: 'spark', route: '#/market' })
    items.push({ id: 'security', title: 'Periksa data sebelum bayar', body: 'Pastikan nomor, User ID, provider, dan nominal sudah benar sebelum konfirmasi.', icon: 'shield', route: '#/security' })
    return items
  }, [history, orders])

  const unreadCount = fingerprint && fingerprint !== readFingerprint ? Math.min(9, notifications.length) : 0

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return catalog
    return catalog.filter((item) => `${item.name} ${item.subtitle} ${item.group}`.toLowerCase().includes(value))
  }, [query])

  const favoriteItems = favorites.map((id) => catalog.find((item) => item.id === id)).filter((item): item is SearchItem => !!item).slice(0, 5)
  const recentItems = recents.map((id) => catalog.find((item) => item.id === id)).filter((item): item is SearchItem => !!item).slice(0, 4)

  const remember = (id: string) => {
    const next = [id, ...recents.filter((item) => item !== id)].slice(0, 6)
    setRecents(next)
    writeArray(RECENTS_KEY, next)
  }

  const navigate = (item: SearchItem | { route: string; id?: string }) => {
    if ('id' in item && item.id) remember(item.id)
    setPanel(null)
    window.location.hash = item.route.replace(/^#/, '')
  }

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [id, ...favorites].slice(0, 6)
    setFavorites(next)
    writeArray(FAVORITES_KEY, next)
  }

  const toggleReward = (id: string) => {
    const next = savedRewards.includes(id) ? savedRewards.filter((item) => item !== id) : [id, ...savedRewards]
    setSavedRewards(next)
    writeArray(REWARDS_KEY, next)
  }

  const markRead = () => {
    localStorage.setItem(READ_KEY, fingerprint)
    setReadFingerprint(fingerprint)
  }

  const openAccount = () => {
    setPanel(null)
    document.querySelector<HTMLButtonElement>('.avatar-button')?.click()
  }

  const initials = (profile?.username || profile?.email || 'Guest').slice(0, 2).toUpperCase()

  const utilityButtons = (
    <div className="dlv39-utility-row">
      <button type="button" onClick={() => setPanel('search')}><Icon name="search" /><span>Cari</span></button>
      <button type="button" onClick={() => setPanel('rewards')}><Icon name="spark" /><span>Promo</span></button>
      <button type="button" className="dlv39-notif-button" onClick={() => setPanel('notifications')}><Icon name="inbox" /><span>Inbox</span>{unreadCount > 0 && <b>{unreadCount}</b>}</button>
      <button type="button" onClick={() => setPanel('profile')}><Icon name="user" /><span>Akun</span></button>
    </div>
  )

  return <>
    {homeToolsHost && createPortal(utilityButtons, homeToolsHost)}
    {routeToolsHost && createPortal(
      <div className="dlv39-route-utilities">
        <button type="button" onClick={() => setPanel('search')} aria-label="Cari semua layanan"><AppIcon name="search" /></button>
        <button type="button" onClick={() => setPanel('rewards')} aria-label="Promo dan rekomendasi"><AppIcon name="spark" /></button>
        <button className="dlv39-route-inbox" type="button" onClick={() => setPanel('notifications')} aria-label="Notifikasi"><AppIcon name="inbox" />{unreadCount > 0 && <b>{unreadCount}</b>}</button>
      </div>, routeToolsHost)}

    {homeQuickHost && createPortal(
      <section className="dlv39-favorites-card">
        <div className="dlv39-section-head"><div><small>Akses cepat</small><h2>Favorit & terakhir dibuka</h2></div><button type="button" onClick={() => setPanel('search')}>Atur</button></div>
        <div className="dlv39-favorite-row">{favoriteItems.map((item) => <button type="button" key={item.id} onClick={() => navigate(item)}><span><AppIcon name={item.icon} /></span><b>{item.name}</b><small>{item.subtitle}</small></button>)}</div>
        {recentItems.length > 0 && <div className="dlv39-recent-line"><span>Terakhir:</span>{recentItems.map((item) => <button type="button" key={item.id} onClick={() => navigate(item)}>{item.name}</button>)}</div>}
      </section>, homeQuickHost)}

    {panel && <div className="dlv39-panel-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setPanel(null)}>
      <section className={`dlv39-panel dlv39-panel-${panel}`} role="dialog" aria-modal="true">
        <div className="dlv39-panel-handle" />
        <header className="dlv39-panel-head"><div><small>DLavie Market</small><h2>{panel === 'search' ? 'Cari semua layanan' : panel === 'notifications' ? 'Notifikasi' : panel === 'rewards' ? 'Promo & rekomendasi' : 'Akun saya'}</h2></div><button type="button" onClick={() => setPanel(null)} aria-label="Tutup"><AppIcon name="close" /></button></header>

        {panel === 'search' && <div className="dlv39-search-view">
          <label className="dlv39-global-search"><span><AppIcon name="search" /></span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nomor virtual, pulsa, PLN, game..." /><kbd>ESC</kbd></label>
          {!query && favoriteItems.length > 0 && <section><div className="dlv39-subhead"><b>Favorit</b><small>Gunakan bintang untuk mengubah</small></div><div className="dlv39-search-favorites">{favoriteItems.map((item) => <button key={item.id} type="button" onClick={() => navigate(item)}><span><AppIcon name={item.icon} /></span><b>{item.name}</b></button>)}</div></section>}
          <div className="dlv39-search-results">{filtered.map((item) => <article key={item.id}><button className="dlv39-result-main" type="button" onClick={() => navigate(item)}><span><AppIcon name={item.icon} /></span><p><small>{item.group}</small><b>{item.name}</b><em>{item.subtitle}</em></p><strong className="dlv39-row-arrow"><AppIcon name="arrow" /></strong></button><button className={`dlv39-fav-toggle${favorites.includes(item.id) ? ' is-active' : ''}`} type="button" onClick={() => toggleFavorite(item.id)} aria-label={favorites.includes(item.id) ? 'Hapus favorit' : 'Tambah favorit'}><AppIcon name="star" filled={favorites.includes(item.id)} /></button></article>)}</div>
          {!filtered.length && <div className="dlv39-empty"><b>Tidak ditemukan</b><span>Coba nama produk, kategori, atau layanan lain.</span></div>}
        </div>}

        {panel === 'notifications' && <div className="dlv39-notification-view">
          <div className="dlv39-notification-toolbar"><span>{notifications.length} informasi terbaru</span><button type="button" onClick={markRead}>Tandai sudah dibaca</button></div>
          <div className="dlv39-notification-list">{notifications.map((item) => <button type="button" key={item.id} onClick={() => item.route && navigate({ route: item.route })}><span><AppIcon name={item.icon} /></span><p><b>{item.title}</b><small>{item.body}</small></p><strong className="dlv39-row-arrow"><AppIcon name="arrow" /></strong></button>)}</div>
        </div>}

        {panel === 'rewards' && <div className="dlv39-rewards-view">
          <div className="dlv39-rewards-intro"><span><AppIcon name="spark" /></span><div><small>DISCOVERY CENTER</small><h3>Temukan fitur dan pilihan yang relevan.</h3><p>Bagian ini menyimpan rekomendasi, bukan menjanjikan cashback atau saldo tambahan.</p></div></div>
          <div className="dlv39-reward-grid">{rewards.map((reward) => <article key={reward.id}><span><AppIcon name={reward.icon} /></span><small>{reward.label}</small><h3>{reward.title}</h3><p>{reward.body}</p><div><button type="button" onClick={() => navigate({ route: reward.route, id: reward.id })}>Buka <b><AppIcon name="arrow" /></b></button><button className={savedRewards.includes(reward.id) ? 'is-saved' : ''} type="button" onClick={() => toggleReward(reward.id)}>{savedRewards.includes(reward.id) ? 'Tersimpan' : 'Simpan'}</button></div></article>)}</div>
        </div>}

        {panel === 'profile' && <div className="dlv39-profile-view">
          <article className="dlv39-profile-hero"><span className="dlv39-profile-avatar">{initials}</span><div><small>{profile ? 'AKUN DLAVIE' : 'MODE TAMU'}</small><h3>{profile?.username || 'Belum masuk'}</h3><p>{profile?.email || 'Masuk untuk mengelola identitas dan avatar akun.'}</p></div><button type="button" onClick={openAccount}>{profile ? 'Kelola akun' : 'Masuk / Daftar'}</button></article>
          <div className="dlv39-profile-stats"><div><small>Saldo</small><strong>{rupiah.format(balance)}</strong></div><div><small>Transaksi lokal</small><strong>{history.length}</strong></div><div><small>Favorit</small><strong>{favorites.length}</strong></div></div>
          <div className="dlv39-profile-menu">
            <button type="button" onClick={() => navigate({ route: '#/activity' })}><span><AppIcon name="activity" /></span><p><b>Aktivitas</b><small>Pesanan, pembayaran, OTP dan refund.</small></p><strong className="dlv39-row-arrow"><AppIcon name="arrow" /></strong></button>
            <button type="button" onClick={() => navigate({ route: '#/security' })}><span><AppIcon name="shield" /></span><p><b>Keamanan</b><small>Proteksi akun dan alur transaksi.</small></p><strong className="dlv39-row-arrow"><AppIcon name="arrow" /></strong></button>
            <button type="button" onClick={() => navigate({ route: '#/help' })}><span><AppIcon name="help" /></span><p><b>Bantuan</b><small>FAQ dan dukungan DLavie.</small></p><strong className="dlv39-row-arrow"><AppIcon name="arrow" /></strong></button>
          </div>
        </div>}
      </section>
    </div>}
  </>
}
