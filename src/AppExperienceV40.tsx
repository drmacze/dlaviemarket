import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type PreferenceState = {
  compactHome: boolean
  smartSuggestions: boolean
  reduceEffects: boolean
  maskBalance: boolean
  transactionReminders: boolean
}

type HistoryItem = { id?: string; type?: string; label?: string; detail?: string; amount?: number; time?: string }
type StoredOrder = { id: string; serviceName?: string; providerName?: string; status?: string; expiresAt?: number; price?: number }
type Profile = { username?: string; email?: string }
type Suggestion = { id: string; title: string; body: string; route: string; symbol: string; reason: string }

const PREF_KEY = 'dlavie-preferences-v40'
const HISTORY_KEY = 'dlavie-history'
const ORDERS_KEY = 'dlavie-orders-v1'
const PROFILE_KEY = 'dlavie-account-profile-v1'
const FAVORITES_KEY = 'dlavie-favorites-v39'
const RECENTS_KEY = 'dlavie-recents-v39'
const STATE_EVENT = 'dlavie:state-changed'

const defaultPreferences: PreferenceState = {
  compactHome: false,
  smartSuggestions: true,
  reduceEffects: false,
  maskBalance: false,
  transactionReminders: true,
}

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

function parseArray<T>(key: string): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]') as T[]
    return Array.isArray(value) ? value : []
  } catch { return [] }
}

function readObject<T>(key: string): T | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null') as T | null
    return value && typeof value === 'object' ? value : null
  } catch { return null }
}

function readPreferences(): PreferenceState {
  return { ...defaultPreferences, ...(readObject<Partial<PreferenceState>>(PREF_KEY) || {}) }
}

function route(routeName: string) {
  window.location.hash = routeName.replace(/^#/, '')
}

function timeGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

export default function AppExperienceV40() {
  const [preferences, setPreferences] = useState<PreferenceState>(readPreferences)
  const [history, setHistory] = useState<HistoryItem[]>(() => parseArray<HistoryItem>(HISTORY_KEY))
  const [orders, setOrders] = useState<StoredOrder[]>(() => parseArray<StoredOrder>(ORDERS_KEY))
  const [favorites, setFavorites] = useState<string[]>(() => parseArray<string>(FAVORITES_KEY))
  const [recents, setRecents] = useState<string[]>(() => parseArray<string>(RECENTS_KEY))
  const [profile, setProfile] = useState<Profile | null>(() => readObject<Profile>(PROFILE_KEY))
  const [balance, setBalance] = useState(() => Number(localStorage.getItem('dlavie-balance') || 0))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [homeHost, setHomeHost] = useState<HTMLElement | null>(null)
  const [profileHost, setProfileHost] = useState<HTMLElement | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.dlvExperience40 = 'true'
    const sync = () => {
      setPreferences(readPreferences())
      setHistory(parseArray<HistoryItem>(HISTORY_KEY))
      setOrders(parseArray<StoredOrder>(ORDERS_KEY))
      setFavorites(parseArray<string>(FAVORITES_KEY))
      setRecents(parseArray<string>(RECENTS_KEY))
      setProfile(readObject<Profile>(PROFILE_KEY))
      setBalance(Number(localStorage.getItem('dlavie-balance') || 0))
    }
    const scan = () => {
      setHomeHost(document.querySelector<HTMLElement>('.dlv-app-home-v37'))
      setProfileHost(document.querySelector<HTMLElement>('.dlv39-profile-view'))
    }
    const observer = new MutationObserver(() => requestAnimationFrame(scan))
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener(STATE_EVENT, sync)
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    sync()
    scan()
    return () => {
      delete document.documentElement.dataset.dlvExperience40
      observer.disconnect()
      window.removeEventListener(STATE_EVENT, sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dlv40-compact-home', preferences.compactHome)
    document.documentElement.classList.toggle('dlv40-reduce-effects', preferences.reduceEffects)
    document.documentElement.classList.toggle('dlv40-mask-balance', preferences.maskBalance)
  }, [preferences])

  useEffect(() => {
    if (!settingsOpen && !insightsOpen) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSettingsOpen(false)
        setInsightsOpen(false)
      }
    }
    document.documentElement.classList.add('dlv40-sheet-open')
    document.addEventListener('keydown', close)
    return () => {
      document.documentElement.classList.remove('dlv40-sheet-open')
      document.removeEventListener('keydown', close)
    }
  }, [settingsOpen, insightsOpen])

  const activeOrders = useMemo(() => orders.filter((item) => item.status === 'waiting' || item.status === 'received'), [orders])
  const spend = useMemo(() => history.reduce((total, item) => total + (typeof item.amount === 'number' && item.amount < 0 ? Math.abs(item.amount) : 0), 0), [history])

  const suggestions = useMemo<Suggestion[]>(() => {
    const output: Suggestion[] = []
    if (activeOrders.some((item) => item.status === 'received')) output.push({ id: 'otp-ready', title: 'OTP sudah tersedia', body: 'Ada pesanan nomor virtual yang sudah menerima kode. Buka Aktivitas untuk melihatnya.', route: '#/activity', symbol: '✓', reason: 'Pesanan aktif' })
    else if (activeOrders.some((item) => item.status === 'waiting')) output.push({ id: 'otp-waiting', title: 'Pantau nomor virtual', body: 'Ada sesi yang masih menunggu SMS. Status terbaru tersedia di Aktivitas.', route: '#/activity', symbol: 'SMS', reason: 'Pesanan aktif' })

    if (balance < 5000) output.push({ id: 'low-balance', title: 'Saldo mulai menipis', body: 'Tambah saldo sekarang supaya checkout berikutnya tidak terputus.', route: '#/home', symbol: '+', reason: `Saldo ${rupiah.format(balance)}` })

    const last = recents[0]
    if (last === 'data') output.push({ id: 'repeat-data', title: 'Buka Paket Data lagi', body: 'Layanan ini termasuk yang terakhir kamu buka.', route: '#/market?category=Paket%20Data', symbol: '5G', reason: 'Terakhir dibuka' })
    else if (last === 'wallet') output.push({ id: 'repeat-wallet', title: 'Top up E-Wallet lagi', body: 'Akses kembali kategori e-wallet tanpa mencari dari awal.', route: '#/market?category=E-Wallet', symbol: 'W', reason: 'Terakhir dibuka' })
    else if (last === 'game') output.push({ id: 'repeat-game', title: 'Kembali ke Voucher & Game', body: 'Buka kembali koleksi game yang terakhir kamu jelajahi.', route: '#/market?category=Voucher%20%26%20Game', symbol: '✦', reason: 'Terakhir dibuka' })

    if (!output.length) output.push({ id: 'discover', title: 'Jelajahi Digital Market', body: 'Pulsa, paket data, PLN, e-wallet, game, dan layanan digital lain ada dalam satu katalog.', route: '#/market', symbol: 'D', reason: 'Rekomendasi untukmu' })
    return output.slice(0, 3)
  }, [activeOrders, balance, recents])

  const updatePreference = (key: keyof PreferenceState) => {
    const next = { ...preferences, [key]: !preferences[key] }
    setPreferences(next)
    localStorage.setItem(PREF_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(STATE_EVENT))
  }

  const refresh = () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    window.dispatchEvent(new CustomEvent(STATE_EVENT))
    window.setTimeout(() => setIsRefreshing(false), 620)
  }

  const name = profile?.username || profile?.email?.split('@')[0] || 'kamu'

  const adaptiveHome = (
    <section className="dlv40-adaptive-home" aria-label="Ringkasan personal">
      <div className="dlv40-adaptive-head">
        <div><small>{timeGreeting()}, {name}</small><h2>Yang penting sekarang.</h2></div>
        <button type="button" className={isRefreshing ? 'is-refreshing' : ''} onClick={refresh} aria-label="Segarkan ringkasan">↻</button>
      </div>
      <div className="dlv40-status-strip">
        <button type="button" onClick={() => route('#/activity')}><span>Aktif</span><strong>{activeOrders.length}</strong><small>pesanan</small></button>
        <button type="button" onClick={() => route('#/activity')}><span>Aktivitas</span><strong>{history.length}</strong><small>tersimpan</small></button>
        <button type="button" onClick={() => setInsightsOpen(true)}><span>Favorit</span><strong>{favorites.length}</strong><small>layanan</small></button>
        <button type="button" onClick={() => setSettingsOpen(true)}><span>Saldo</span><strong className="dlv40-sensitive">{rupiah.format(balance)}</strong><small>tersedia</small></button>
      </div>
      {preferences.smartSuggestions && <div className="dlv40-suggestion-row">{suggestions.map((item) => <button type="button" key={item.id} onClick={() => route(item.route)}><i>{item.symbol}</i><span><small>{item.reason}</small><b>{item.title}</b><em>{item.body}</em></span><strong>›</strong></button>)}</div>}
    </section>
  )

  const settingsShortcut = <button className="dlv40-settings-entry" type="button" onClick={() => setSettingsOpen(true)}><span>⚙</span><p><b>Pengaturan pengalaman</b><small>Tampilan, privasi saldo, rekomendasi, dan efek.</small></p><strong>›</strong></button>

  return <>
    {homeHost && createPortal(adaptiveHome, homeHost)}
    {profileHost && createPortal(settingsShortcut, profileHost)}

    {insightsOpen && <div className="dlv40-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setInsightsOpen(false)}>
      <section className="dlv40-sheet dlv40-insight-sheet" role="dialog" aria-modal="true">
        <div className="dlv40-handle" />
        <header><div><small>DLAVIE INSIGHTS</small><h2>Ringkasan penggunaan</h2><p>Informasi lokal dari aktivitas perangkat ini, bukan program cashback.</p></div><button type="button" onClick={() => setInsightsOpen(false)}>×</button></header>
        <div className="dlv40-insight-grid">
          <article><small>Total aktivitas</small><strong>{history.length}</strong><span>catatan transaksi lokal</span></article>
          <article><small>Nilai transaksi keluar</small><strong>{rupiah.format(spend)}</strong><span>berdasarkan history tersimpan</span></article>
          <article><small>Pesanan aktif</small><strong>{activeOrders.length}</strong><span>menunggu atau OTP diterima</span></article>
          <article><small>Layanan favorit</small><strong>{favorites.length}</strong><span>shortcut personal tersimpan</span></article>
        </div>
        <div className="dlv40-next-actions"><h3>Lanjut dari sini</h3>{suggestions.map((item) => <button type="button" key={item.id} onClick={() => { setInsightsOpen(false); route(item.route) }}><i>{item.symbol}</i><span><b>{item.title}</b><small>{item.body}</small></span><strong>›</strong></button>)}</div>
      </section>
    </div>}

    {settingsOpen && <div className="dlv40-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSettingsOpen(false)}>
      <section className="dlv40-sheet dlv40-settings-sheet" role="dialog" aria-modal="true">
        <div className="dlv40-handle" />
        <header><div><small>PERSONALISASI</small><h2>Pengaturan DLavie</h2><p>Preferensi ini disimpan lokal di perangkat.</p></div><button type="button" onClick={() => setSettingsOpen(false)}>×</button></header>
        <div className="dlv40-settings-list">
          <button type="button" onClick={() => updatePreference('maskBalance')}><span><b>Sembunyikan saldo</b><small>Mask nominal pada ringkasan personal.</small></span><i className={preferences.maskBalance ? 'on' : ''}><b /></i></button>
          <button type="button" onClick={() => updatePreference('smartSuggestions')}><span><b>Rekomendasi pintar</b><small>Gunakan recent, saldo, dan status pesanan untuk saran kontekstual.</small></span><i className={preferences.smartSuggestions ? 'on' : ''}><b /></i></button>
          <button type="button" onClick={() => updatePreference('compactHome')}><span><b>Beranda ringkas</b><small>Kurangi jarak dan ukuran kartu untuk penggunaan satu tangan.</small></span><i className={preferences.compactHome ? 'on' : ''}><b /></i></button>
          <button type="button" onClick={() => updatePreference('reduceEffects')}><span><b>Kurangi efek visual</b><small>Minimalkan blur, glow, dan motion tambahan.</small></span><i className={preferences.reduceEffects ? 'on' : ''}><b /></i></button>
          <button type="button" onClick={() => updatePreference('transactionReminders')}><span><b>Pengingat transaksi</b><small>Simpan preferensi untuk notifikasi transaksi saat integrasi push tersedia.</small></span><i className={preferences.transactionReminders ? 'on' : ''}><b /></i></button>
        </div>
        <div className="dlv40-settings-actions">
          <button type="button" onClick={() => { setSettingsOpen(false); route('#/security') }}><span>✓</span><p><b>Keamanan</b><small>Buka panduan keamanan transaksi.</small></p><strong>›</strong></button>
          <button type="button" onClick={() => { setSettingsOpen(false); route('#/help') }}><span>?</span><p><b>Bantuan</b><small>FAQ dan pusat dukungan.</small></p><strong>›</strong></button>
        </div>
      </section>
    </div>}
  </>
}
