import { useEffect, useMemo, useRef, useState } from 'react'

type Language = 'id' | 'en'
type StoredProfile = { username?: string; email?: string; avatarId?: string }
type MenuIconName = 'menu' | 'close' | 'profile' | 'wallet' | 'appearance' | 'music' | 'language' | 'activity' | 'shield' | 'help' | 'chevron'

const LANGUAGE_KEY = 'dlavie-language'
const PROFILE_KEY = 'dlavie-account-profile-v1'
const BALANCE_KEY = 'dlavie-balance'
const STATE_EVENT = 'dlavie:state-changed'

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

function readProfile(): StoredProfile | null {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') as StoredProfile | null } catch { return null }
}

function greetingFor(language: Language, hour: number) {
  if (language === 'en') {
    if (hour >= 5 && hour < 11) return 'Good morning'
    if (hour >= 11 && hour < 15) return 'Good afternoon'
    if (hour >= 15 && hour < 18) return 'Good evening'
    return 'Good night'
  }
  if (hour >= 5 && hour < 11) return 'Selamat pagi'
  if (hour >= 11 && hour < 15) return 'Selamat siang'
  if (hour >= 15 && hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function MenuIcon({ name }: { name: MenuIconName }) {
  const paths: Record<MenuIconName, React.ReactNode> = {
    menu: <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>,
    close: <><path d="m6 6 12 12"/><path d="M18 6 6 18"/></>,
    profile: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    wallet: <><path d="M4 7a3 3 0 0 1 3-3h12v16H7a3 3 0 0 1-3-3V7Z"/><path d="M4 8h15"/><path d="M15 12h6v5h-6a2.5 2.5 0 0 1 0-5Z"/></>,
    appearance: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><path d="M8 4v6M16 14v6"/></>,
    music: <><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></>,
    language: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
    activity: <><path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v6h6"/><path d="M12 8v5l3 2"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6Z"/><path d="m9 12 2 2 4-4"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 0 1 4.5 1.2c0 1.8-2.3 2.1-2.3 3.8"/><path d="M12 17h.01"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

export default function NavUtilityMenu() {
  const [open, setOpen] = useState(false)
  const [language] = useState<Language>(() => localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'id')
  const [profile, setProfile] = useState<StoredProfile | null>(() => readProfile())
  const [balance, setBalance] = useState(() => Number(localStorage.getItem(BALANCE_KEY) || 0))
  const [hour, setHour] = useState(() => new Date().getHours())
  const rootRef = useRef<HTMLDivElement>(null)

  const greeting = useMemo(() => greetingFor(language, hour), [language, hour])
  const accountName = profile?.username || (language === 'en' ? 'Guest account' : 'Akun tamu')
  const accountSub = profile?.email || (language === 'en' ? 'Sign in to sync your account identity' : 'Masuk untuk mengelola identitas akun')
  const initials = (profile?.username || profile?.email || 'DL').slice(0, 2).toUpperCase()
  const labels = language === 'en'
    ? {
        menu: 'Account sidebar', account: 'Account', profile: 'Manage profile', wallet: 'DLavie Balance', walletAction: 'Manage',
        navigation: 'Navigation', activity: 'Activity', activitySub: 'Orders, payments and refunds', security: 'Security', securitySub: 'Account and transaction protection', help: 'Help', helpSub: 'FAQ and support',
        preferences: 'Preferences', appearance: 'Appearance', appearanceSub: 'Theme, mode and accent', music: 'Music', musicSub: 'DLavie ambient player',
        language: 'Language', id: 'Indonesia', en: 'International', international: 'English', close: 'Close sidebar', status: 'Digital account center',
      }
    : {
        menu: 'Sidebar akun', account: 'Akun', profile: 'Kelola profil', wallet: 'Saldo DLavie', walletAction: 'Kelola',
        navigation: 'Navigasi', activity: 'Aktivitas', activitySub: 'Pesanan, pembayaran, dan refund', security: 'Keamanan', securitySub: 'Proteksi akun dan transaksi', help: 'Bantuan', helpSub: 'FAQ dan dukungan',
        preferences: 'Preferensi', appearance: 'Tampilan', appearanceSub: 'Tema, mode, dan warna aksen', music: 'Musik', musicSub: 'Pemutar ambient DLavie',
        language: 'Bahasa', id: 'Indonesia', en: 'Internasional', international: 'English', close: 'Tutup sidebar', status: 'Pusat akun digital',
      }

  useEffect(() => {
    const sync = () => {
      setProfile(readProfile())
      setBalance(Number(localStorage.getItem(BALANCE_KEY) || 0))
    }
    sync()
    window.addEventListener(STATE_EVENT, sync)
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener(STATE_EVENT, sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const installGreeting = () => {
      const brandText = document.querySelector<HTMLElement>('.site-nav .brand > span:last-child')
      if (!brandText) return
      brandText.classList.add('nav-brand-copy')
      let node = brandText.querySelector<HTMLElement>('.nav-brand-greeting')
      if (!node) {
        node = document.createElement('small')
        node.className = 'nav-brand-greeting'
        brandText.appendChild(node)
      }
      if (node.textContent !== greeting) node.textContent = greeting
    }

    let frame = window.requestAnimationFrame(installGreeting)
    const onRouteChange = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(installGreeting)
    }

    window.addEventListener('hashchange', onRouteChange)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('hashchange', onRouteChange)
    }
  }, [greeting])

  useEffect(() => {
    if (!open) return
    document.documentElement.classList.add('utility-sidebar-open')
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target)) setOpen(false)
    }
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.documentElement.classList.remove('utility-sidebar-open')
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [open])

  const openProfile = () => {
    setOpen(false)
    document.querySelector<HTMLButtonElement>('.avatar-button')?.click()
  }

  const openWallet = () => {
    setOpen(false)
    document.querySelector<HTMLButtonElement>('.balance-pill')?.click()
  }

  const openAppearance = () => {
    setOpen(false)
    window.setTimeout(() => document.querySelector<HTMLButtonElement>('.theme-trigger')?.click(), 20)
  }

  const openMusic = () => {
    setOpen(false)
    window.setTimeout(() => document.querySelector<HTMLButtonElement>('.ambient-trigger')?.click(), 20)
  }

  const navigate = (route: string) => {
    setOpen(false)
    window.location.hash = route
  }

  const changeLanguage = (next: Language) => {
    if (next === language) return
    localStorage.setItem(LANGUAGE_KEY, next)
    document.documentElement.dataset.language = next
    window.location.reload()
  }

  return (
    <div className={`utility-dock${open ? ' is-open' : ''}`} ref={rootRef}>
      <button className="utility-trigger" type="button" onClick={() => { setOpen((value) => !value); setProfile(readProfile()); setBalance(Number(localStorage.getItem(BALANCE_KEY) || 0)) }} aria-expanded={open} aria-label={labels.menu}>
        <MenuIcon name="menu" />
      </button>

      {open && <div className="utility-sidebar-backdrop" onPointerDown={() => setOpen(false)} aria-hidden="true" />}

      {open && (
        <aside className="utility-sidebar" role="dialog" aria-modal="true" aria-label={labels.menu}>
          <header className="utility-sidebar-head">
            <div className="utility-sidebar-brand">
              <span className="utility-sidebar-brandmark">D</span>
              <span><strong>DLavie Market</strong><small>{greeting} · {labels.status}</small></span>
            </div>
            <button className="utility-sidebar-close" type="button" onClick={() => setOpen(false)} aria-label={labels.close}><MenuIcon name="close" /></button>
          </header>

          <div className="utility-sidebar-scroll">
            <section className="utility-account-summary" aria-label={labels.account}>
              <button className="utility-account-card" type="button" onClick={openProfile}>
                <span className="utility-account-avatar">{initials}</span>
                <span className="utility-account-copy"><small>{labels.account}</small><strong>{accountName}</strong><em>{accountSub}</em></span>
                <span className="utility-account-action">{labels.profile}<MenuIcon name="chevron" /></span>
              </button>

              <button className="utility-wallet-card" type="button" onClick={openWallet}>
                <span className="utility-wallet-icon"><MenuIcon name="wallet" /></span>
                <span><small>{labels.wallet}</small><strong>{rupiah.format(balance)}</strong></span>
                <span className="utility-wallet-action">{labels.walletAction}<MenuIcon name="chevron" /></span>
              </button>
            </section>

            <section className="utility-sidebar-section">
              <div className="utility-sidebar-section-title"><span>{labels.navigation}</span><i /></div>
              <div className="utility-sidebar-list">
                <button className="utility-sidebar-row" type="button" onClick={() => navigate('#/activity')}>
                  <span className="utility-row-icon"><MenuIcon name="activity" /></span><span className="utility-row-copy"><strong>{labels.activity}</strong><small>{labels.activitySub}</small></span><MenuIcon name="chevron" />
                </button>
                <button className="utility-sidebar-row" type="button" onClick={() => navigate('#/security')}>
                  <span className="utility-row-icon"><MenuIcon name="shield" /></span><span className="utility-row-copy"><strong>{labels.security}</strong><small>{labels.securitySub}</small></span><MenuIcon name="chevron" />
                </button>
                <button className="utility-sidebar-row" type="button" onClick={() => navigate('#/help')}>
                  <span className="utility-row-icon"><MenuIcon name="help" /></span><span className="utility-row-copy"><strong>{labels.help}</strong><small>{labels.helpSub}</small></span><MenuIcon name="chevron" />
                </button>
              </div>
            </section>

            <section className="utility-sidebar-section">
              <div className="utility-sidebar-section-title"><span>{labels.preferences}</span><i /></div>
              <div className="utility-sidebar-list">
                <button className="utility-sidebar-row" type="button" onClick={openAppearance}>
                  <span className="utility-row-icon"><MenuIcon name="appearance" /></span><span className="utility-row-copy"><strong>{labels.appearance}</strong><small>{labels.appearanceSub}</small></span><MenuIcon name="chevron" />
                </button>
                <button className="utility-sidebar-row" type="button" onClick={openMusic}>
                  <span className="utility-row-icon"><MenuIcon name="music" /></span><span className="utility-row-copy"><strong>{labels.music}</strong><small>{labels.musicSub}</small></span><MenuIcon name="chevron" />
                </button>
              </div>
            </section>

            <section className="utility-language utility-language-sidebar">
              <div className="utility-language-head">
                <span className="utility-row-icon"><MenuIcon name="language" /></span>
                <span><strong>{labels.language}</strong><small>{language === 'id' ? 'Bahasa Indonesia' : 'International · English'}</small></span>
              </div>
              <div className="utility-language-toggle" role="group" aria-label={labels.language}>
                <button type="button" className={language === 'id' ? 'active' : ''} onClick={() => changeLanguage('id')}><b>ID</b><span>{labels.id}</span></button>
                <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => changeLanguage('en')}><b>EN</b><span>{labels.en}<small>{labels.international}</small></span></button>
              </div>
            </section>
          </div>

          <footer className="utility-sidebar-footer"><span className="utility-sidebar-footer-dot" /><span>DLavie Market</span><small>Secure digital commerce interface</small></footer>
        </aside>
      )}
    </div>
  )
}
