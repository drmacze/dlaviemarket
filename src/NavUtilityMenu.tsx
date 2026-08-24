import { useEffect, useMemo, useRef, useState } from 'react'

type Language = 'id' | 'en'
type StoredProfile = { username?: string; email?: string; avatarId?: string }
type MenuIconName = 'menu' | 'profile' | 'wallet' | 'appearance' | 'music' | 'language' | 'chevron'

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
    if (hour >= 5 && hour < 11) return 'Good morning, everyone'
    if (hour >= 11 && hour < 15) return 'Good afternoon, everyone'
    if (hour >= 15 && hour < 18) return 'Good evening, everyone'
    return 'Good night, everyone'
  }
  if (hour >= 5 && hour < 11) return 'Selamat pagi semuanya'
  if (hour >= 11 && hour < 15) return 'Selamat siang semuanya'
  if (hour >= 15 && hour < 18) return 'Selamat sore semuanya'
  return 'Selamat malam semuanya'
}

function MenuIcon({ name }: { name: MenuIconName }) {
  const paths: Record<MenuIconName, React.ReactNode> = {
    menu: <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>,
    profile: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    wallet: <><path d="M4 7a3 3 0 0 1 3-3h12v16H7a3 3 0 0 1-3-3V7Z"/><path d="M4 8h15"/><path d="M15 12h6v5h-6a2.5 2.5 0 0 1 0-5Z"/></>,
    appearance: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><path d="M8 4v6M16 14v6"/></>,
    music: <><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></>,
    language: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
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
  const labels = language === 'en'
    ? {
        menu: 'Account menu', profile: 'Profile', profileSub: profile?.username || 'Sign in or manage account',
        wallet: 'Wallet', balance: rupiah.format(balance), appearance: 'Appearance', appearanceSub: 'Theme, mode and accent',
        music: 'Music', musicSub: 'Open the DLavie player', language: 'Language', id: 'Indonesia', en: 'International', international: 'English',
      }
    : {
        menu: 'Menu akun', profile: 'Profil', profileSub: profile?.username || 'Masuk atau kelola akun',
        wallet: 'Wallet', balance: rupiah.format(balance), appearance: 'Tampilan', appearanceSub: 'Tema, mode, dan warna aksen',
        music: 'Music', musicSub: 'Buka pemutar DLavie', language: 'Bahasa', id: 'Indonesia', en: 'Internasional', international: 'English',
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
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
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

      {open && (
        <section className="utility-menu" aria-label={labels.menu}>
          <div className="utility-menu-head">
            <span>DLavie</span>
            <small>{greeting}</small>
          </div>

          <button className="utility-row" type="button" onClick={openProfile}>
            <span className="utility-row-icon"><MenuIcon name="profile" /></span>
            <span className="utility-row-copy"><strong>{labels.profile}</strong><small>{labels.profileSub}</small></span>
            <MenuIcon name="chevron" />
          </button>

          <button className="utility-row" type="button" onClick={openWallet}>
            <span className="utility-row-icon"><MenuIcon name="wallet" /></span>
            <span className="utility-row-copy"><strong>{labels.wallet}</strong><small>{labels.balance}</small></span>
            <MenuIcon name="chevron" />
          </button>

          <button className="utility-row utility-row-mobile" type="button" onClick={openAppearance}>
            <span className="utility-row-icon"><MenuIcon name="appearance" /></span>
            <span className="utility-row-copy"><strong>{labels.appearance}</strong><small>{labels.appearanceSub}</small></span>
            <MenuIcon name="chevron" />
          </button>

          <button className="utility-row utility-row-mobile" type="button" onClick={openMusic}>
            <span className="utility-row-icon"><MenuIcon name="music" /></span>
            <span className="utility-row-copy"><strong>{labels.music}</strong><small>{labels.musicSub}</small></span>
            <MenuIcon name="chevron" />
          </button>

          <div className="utility-language">
            <div className="utility-language-head">
              <span className="utility-row-icon"><MenuIcon name="language" /></span>
              <span><strong>{labels.language}</strong><small>{language === 'id' ? 'Bahasa Indonesia' : 'International · English'}</small></span>
            </div>
            <div className="utility-language-toggle" role="group" aria-label={labels.language}>
              <button type="button" className={language === 'id' ? 'active' : ''} onClick={() => changeLanguage('id')}><b>ID</b><span>{labels.id}</span></button>
              <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => changeLanguage('en')}><b>EN</b><span>{labels.en}<small>{labels.international}</small></span></button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
