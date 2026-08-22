import { useEffect, useMemo, useState } from 'react'

type PageId = 'home' | 'market' | 'guide' | 'security' | 'activity' | 'help' | 'legal'
type Profile = { username?: string; email?: string; avatarId?: string }
type IconName = 'back' | 'wallet' | 'user' | 'search' | 'shield' | 'help' | 'home'

const PROFILE_KEY = 'dlavie-account-profile-v1'
const STATE_EVENT = 'dlavie:state-changed'
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

const routeMeta: Record<PageId, { eyebrow: string; title: string; description: string }> = {
  home: { eyebrow: 'DLavie Market', title: 'Beranda', description: 'Ringkasan wallet dan layanan.' },
  market: { eyebrow: 'Marketplace', title: 'Market', description: 'Pilih layanan, produk, lalu bayar dari wallet.' },
  activity: { eyebrow: 'Transaksi', title: 'Aktivitas', description: 'Pantau order, OTP, pembayaran, dan refund.' },
  help: { eyebrow: 'Support', title: 'Bantuan', description: 'FAQ, dukungan, dan informasi transaksi.' },
  guide: { eyebrow: 'Panduan', title: 'Cara kerja', description: 'Kenali alur penggunaan DLavie Market.' },
  security: { eyebrow: 'Trust', title: 'Keamanan', description: 'Proteksi akun dan transaksi.' },
  legal: { eyebrow: 'Informasi', title: 'Kebijakan', description: 'Privasi, refund, dan ketentuan layanan.' },
}

function normalizePage(hash = window.location.hash): PageId {
  const value = hash.replace(/^#\/?/, '').split(/[?&]/)[0].toLowerCase()
  if (value === 'market') return 'market'
  if (value === 'activity' || value === 'aktivitas') return 'activity'
  if (value === 'help' || value === 'faq' || value === 'bantuan') return 'help'
  if (value === 'guide' || value === 'cara-kerja') return 'guide'
  if (value === 'security' || value === 'keamanan') return 'security'
  if (value === 'legal' || value === 'terms' || value === 'privacy' || value === 'kebijakan') return 'legal'
  return 'home'
}

function readBalance() {
  const value = Number(localStorage.getItem('dlavie-balance') || 0)
  return Number.isFinite(value) ? value : 0
}

function readProfile(): Profile | null {
  try {
    const value = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') as Profile | null
    return value && typeof value === 'object' ? value : null
  } catch {
    return null
  }
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    back: <><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></>,
    wallet: <><path d="M4 7a3 3 0 0 1 3-3h12v16H7a3 3 0 0 1-3-3Z"/><path d="M4 8h15"/><path d="M15 12h6v4h-6a2 2 0 0 1 0-4Z"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.7-3.7"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6Z"/><path d="m9 12 2 2 4-4"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 0 1 4.5 1.2c0 1.8-2.3 2.1-2.3 3.8"/><path d="M12 17h.01"/></>,
    home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5h5v5"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

export default function AppFlowV38() {
  const [page, setPage] = useState<PageId>(() => normalizePage())
  const [balance, setBalance] = useState(readBalance)
  const [profile, setProfile] = useState<Profile | null>(readProfile)

  useEffect(() => {
    document.documentElement.dataset.dlvFlow = 'v38'
    const syncRoute = () => setPage(normalizePage())
    const syncState = () => {
      setBalance(readBalance())
      setProfile(readProfile())
    }
    syncState()
    window.addEventListener('hashchange', syncRoute)
    window.addEventListener(STATE_EVENT, syncState)
    window.addEventListener('storage', syncState)
    window.addEventListener('focus', syncState)
    const timer = window.setInterval(syncState, 1200)
    return () => {
      window.removeEventListener('hashchange', syncRoute)
      window.removeEventListener(STATE_EVENT, syncState)
      window.removeEventListener('storage', syncState)
      window.removeEventListener('focus', syncState)
      window.clearInterval(timer)
      delete document.documentElement.dataset.dlvFlow
    }
  }, [])

  const meta = routeMeta[page]
  const initials = useMemo(() => {
    const source = profile?.username || profile?.email || 'Akun'
    return source.trim().slice(0, 2).toUpperCase()
  }, [profile])

  const openDeposit = () => document.querySelector<HTMLButtonElement>('.balance-pill')?.click()
  const openAccount = () => document.querySelector<HTMLButtonElement>('.avatar-button')?.click()
  const goHome = () => { window.location.hash = '/home' }

  if (page === 'home') return null

  return (
    <header className="dlv38-routebar-wrap">
      <div className="dlv38-routebar">
        <div className="dlv38-route-identity">
          <button className="dlv38-back" type="button" onClick={goHome} aria-label="Kembali ke beranda"><Icon name="back" /></button>
          <div className="dlv38-route-copy"><small>{meta.eyebrow}</small><strong>{meta.title}</strong><span>{meta.description}</span></div>
        </div>
        <div className="dlv38-route-actions">
          {page === 'market' && <button className="dlv38-route-tool" type="button" onClick={() => document.querySelector<HTMLInputElement>('.dlv21-search input, .dlv21-product-tools input')?.focus()} aria-label="Cari produk"><Icon name="search" /></button>}
          {page === 'security' && <span className="dlv38-route-state"><Icon name="shield" /> Proteksi aktif</span>}
          {page === 'help' && <span className="dlv38-route-state"><Icon name="help" /> Support</span>}
          <button className="dlv38-balance" type="button" onClick={openDeposit}><Icon name="wallet" /><span><small>Saldo</small><b>{rupiah.format(balance)}</b></span></button>
          <button className="dlv38-account" type="button" onClick={openAccount} aria-label="Buka akun"><span>{initials}</span></button>
        </div>
      </div>
    </header>
  )
}
