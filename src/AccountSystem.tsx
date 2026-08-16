import { FormEvent, useEffect, useMemo, useState } from 'react'
import { gsap } from 'gsap'

const AVATARS = [
  { id: 'neon-ape', name: 'Neon Ape' },
  { id: 'void-bot', name: 'Void Bot' },
  { id: 'mint-fox', name: 'Mint Fox' },
  { id: 'crimson-oni', name: 'Crimson Oni' },
  { id: 'solar-cat', name: 'Solar Cat' },
  { id: 'ice-orbit', name: 'Ice Orbit' },
  { id: 'pixel-raven', name: 'Pixel Raven' },
] as const

type AvatarId = typeof AVATARS[number]['id']

type AccountProfile = {
  id: string
  username: string
  email: string
  createdAt: string
  avatarId: AvatarId
}

type StoredCredential = {
  salt: string
  hash: string
  iterations: number
}

type View = 'register' | 'verify' | 'welcome' | 'login' | 'profile'

const PROFILE_KEY = 'dlavie-account-profile-v1'
const CREDENTIAL_KEY = 'dlavie-account-credential-v1'
const SESSION_KEY = 'dlavie-account-session-v1'
const ITERATIONS = 210_000

function avatarUrl(id: AvatarId) {
  return `${import.meta.env.BASE_URL}avatars/${id}.svg`
}

function isAvatarId(value: unknown): value is AvatarId {
  return AVATARS.some((avatar) => avatar.id === value)
}

function randomAvatarId(): AvatarId {
  const value = crypto.getRandomValues(new Uint32Array(1))[0]
  return AVATARS[value % AVATARS.length].id
}

function Avatar({ id, className = '', alt }: { id: AvatarId; className?: string; alt?: string }) {
  const avatar = AVATARS.find((item) => item.id === id)
  return (
    <span className={`profile-avatar nft-avatar ${className}`.trim()}>
      <img src={avatarUrl(id)} alt={alt ?? avatar?.name ?? 'Avatar'} draggable={false} />
    </span>
  )
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function base64ToBytes(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function derivePassword(password: string, salt: Uint8Array, iterations = ITERATIONS) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const saltBuffer = new Uint8Array(salt).buffer as ArrayBuffer
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBuffer, iterations },
    keyMaterial,
    256,
  )
  return new Uint8Array(bits)
}

function secureEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index)
  return diff === 0
}

function loadProfile(): AccountProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AccountProfile> & { avatarId?: string }
    if (!parsed.id || !parsed.username || !parsed.email || !parsed.createdAt) return null
    const profile: AccountProfile = {
      id: parsed.id,
      username: parsed.username,
      email: parsed.email,
      createdAt: parsed.createdAt,
      avatarId: isAvatarId(parsed.avatarId) ? parsed.avatarId : randomAvatarId(),
    }
    if (parsed.avatarId !== profile.avatarId) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    return profile
  } catch {
    return null
  }
}

function makeUserId() {
  const clean = crypto.randomUUID().replaceAll('-', '').toUpperCase()
  return `DLV-${clean.slice(0, 6)}-${clean.slice(6, 10)}`
}

function passwordChecks(password: string) {
  return {
    length: password.length >= 10,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
}

function Icon({ name }: { name: 'user' | 'mail' | 'lock' | 'eye' | 'eyeOff' | 'shield' | 'check' | 'arrow' | 'logout' | 'copy' | 'edit' }) {
  const paths = {
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    eyeOff: <><path d="m3 3 18 18"/><path d="M10.6 6.2A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.1 2.8M6.5 7.2C4 9 2.5 12 2.5 12s3.5 6 9.5 6c1.1 0 2.2-.2 3.1-.5"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.7 2.8 8 7 10 4.2-2 7-5.3 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    logout: <><path d="M10 5H5v14h5"/><path d="M13 8l4 4-4 4M8 12h9"/></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

export default function AccountSystem() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('register')
  const [profile, setProfile] = useState<AccountProfile | null>(() => loadProfile())
  const [signedIn, setSignedIn] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'active')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loginIdentity, setLoginIdentity] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [humanVerified, setHumanVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [avatarEditing, setAvatarEditing] = useState(false)
  const [avatarSaved, setAvatarSaved] = useState(false)

  const checks = useMemo(() => passwordChecks(password), [password])
  const passwordStrong = Object.values(checks).every(Boolean)
  const usernameValid = /^[A-Za-z0-9._]{3,20}$/.test(username)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const registerValid = usernameValid && emailValid && passwordStrong && password === confirmPassword

  useEffect(() => {
    const button = document.querySelector<HTMLButtonElement>('.avatar-button')
    if (!button) return
    if (signedIn && profile) {
      button.classList.add('account-ready')
      button.dataset.avatar = profile.avatarId
      button.style.backgroundImage = `url("${avatarUrl(profile.avatarId)}")`
      button.setAttribute('aria-label', `Akun ${profile.username}`)
    } else {
      button.classList.remove('account-ready')
      delete button.dataset.avatar
      button.style.removeProperty('background-image')
      button.setAttribute('aria-label', 'Masuk atau buat akun')
    }
  }, [profile, signedIn])

  useEffect(() => {
    const interceptAvatar = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest('.avatar-button')) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      setError('')
      setAvatarEditing(false)
      setView(signedIn && profile ? 'profile' : profile ? 'login' : 'register')
      setOpen(true)
    }
    document.addEventListener('click', interceptAvatar, true)
    return () => document.removeEventListener('click', interceptAvatar, true)
  }, [profile, signedIn])

  useEffect(() => {
    if (!open) return
    document.documentElement.classList.add('account-open')
    requestAnimationFrame(() => {
      gsap.fromTo('.account-shell', { y: 24, opacity: 0, scale: .985 }, { y: 0, opacity: 1, scale: 1, duration: .42, ease: 'power3.out' })
    })
    return () => document.documentElement.classList.remove('account-open')
  }, [open])

  useEffect(() => {
    if (!open) return
    gsap.fromTo('.account-view', { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: .28, ease: 'power2.out' })
  }, [view, open])

  const goVerify = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!registerValid) {
      setError('Periksa kembali username, email, dan password.')
      return
    }
    setView('verify')
  }

  const verifyHuman = () => {
    if (verifying || humanVerified) return
    setVerifying(true)
    window.setTimeout(() => {
      setVerifying(false)
      setHumanVerified(true)
    }, 900)
  }

  const createAccount = async () => {
    if (!humanVerified || !registerValid) return
    setBusy(true)
    setError('')
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const derived = await derivePassword(password, salt)
      const credential: StoredCredential = {
        salt: bytesToBase64(salt),
        hash: bytesToBase64(derived),
        iterations: ITERATIONS,
      }
      const nextProfile: AccountProfile = {
        id: makeUserId(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
        avatarId: randomAvatarId(),
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile))
      localStorage.setItem(CREDENTIAL_KEY, JSON.stringify(credential))
      sessionStorage.setItem(SESSION_KEY, 'active')
      setProfile(nextProfile)
      setSignedIn(true)
      setPassword('')
      setConfirmPassword('')
      setView('welcome')
    } catch {
      setError('Akun belum dapat dibuat. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  const login = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!profile) {
      setView('register')
      return
    }
    const identity = loginIdentity.trim().toLowerCase()
    const matchesIdentity = identity === profile.email.toLowerCase() || identity === profile.username.toLowerCase()
    if (!matchesIdentity) {
      setError('Username atau email tidak ditemukan.')
      return
    }
    setBusy(true)
    try {
      const raw = localStorage.getItem(CREDENTIAL_KEY)
      if (!raw) throw new Error('missing credential')
      const credential = JSON.parse(raw) as StoredCredential
      const derived = await derivePassword(loginPassword, base64ToBytes(credential.salt), credential.iterations)
      if (!secureEqual(bytesToBase64(derived), credential.hash)) {
        setError('Password yang kamu masukkan salah.')
        return
      }
      sessionStorage.setItem(SESSION_KEY, 'active')
      setSignedIn(true)
      setLoginPassword('')
      setView('profile')
    } catch {
      setError('Login belum dapat diproses. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  const selectAvatar = (avatarId: AvatarId) => {
    if (!profile) return
    const nextProfile = { ...profile, avatarId }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile))
    setProfile(nextProfile)
    setAvatarSaved(true)
    requestAnimationFrame(() => {
      gsap.fromTo('.profile-head .nft-avatar', { scale: .88, rotate: -4 }, { scale: 1, rotate: 0, duration: .48, ease: 'back.out(1.8)' })
    })
    window.setTimeout(() => setAvatarSaved(false), 1400)
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setSignedIn(false)
    setLoginIdentity(profile?.email || '')
    setAvatarEditing(false)
    setView('login')
  }

  const resetAccount = () => {
    localStorage.removeItem(PROFILE_KEY)
    localStorage.removeItem(CREDENTIAL_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    setProfile(null)
    setSignedIn(false)
    setUsername('')
    setEmail('')
    setHumanVerified(false)
    setLoginIdentity('')
    setAvatarEditing(false)
    setView('register')
  }

  const copyId = async () => {
    if (!profile) return
    await navigator.clipboard?.writeText(profile.id)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  if (!open) return null

  return (
    <div className="account-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <section className="account-shell" role="dialog" aria-modal="true" aria-label="Akun DLavie">
        <button className="account-close" type="button" onClick={() => setOpen(false)} aria-label="Tutup">×</button>

        {(view === 'register' || view === 'verify') && (
          <div className="account-progress" aria-label="Proses pendaftaran">
            <span className={view === 'register' ? 'active' : 'done'}><i>{view === 'register' ? '1' : '✓'}</i>Data akun</span>
            <b />
            <span className={view === 'verify' ? 'active' : ''}><i>2</i>Verifikasi</span>
          </div>
        )}

        {view === 'register' && (
          <form className="account-view account-register" onSubmit={goVerify}>
            <div className="account-title-icon"><Icon name="user" /></div>
            <span className="account-eyebrow">Buat akun</span>
            <h2>Mulai dengan akun DLavie.</h2>
            <p>Isi data berikut untuk membuat akun. Kamu bisa menggunakan username atau email saat login.</p>

            <label className="account-field">
              <span>Username</span>
              <div><Icon name="user" /><input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value.replace(/\s/g, ''))} placeholder="contoh: drmacze" maxLength={20} /></div>
              {username && !usernameValid && <small>Gunakan 3–20 karakter: huruf, angka, titik, atau garis bawah.</small>}
            </label>

            <label className="account-field">
              <span>Email</span>
              <div><Icon name="mail" /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" /></div>
              {email && !emailValid && <small>Masukkan alamat email yang valid.</small>}
            </label>

            <label className="account-field">
              <span>Password</span>
              <div><Icon name="lock" /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Buat password yang kuat" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}><Icon name={showPassword ? 'eyeOff' : 'eye'} /></button></div>
            </label>

            <div className="password-checks">
              <span className={checks.length ? 'ok' : ''}>10+ karakter</span>
              <span className={checks.upper && checks.lower ? 'ok' : ''}>Huruf besar & kecil</span>
              <span className={checks.number ? 'ok' : ''}>Angka</span>
              <span className={checks.symbol ? 'ok' : ''}>Simbol</span>
            </div>

            <label className="account-field">
              <span>Ulangi password</span>
              <div><Icon name="lock" /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Ketik ulang password" /></div>
              {confirmPassword && password !== confirmPassword && <small>Password belum sama.</small>}
            </label>

            {error && <div className="account-error">{error}</div>}
            <button className="account-primary" type="submit" disabled={!registerValid}>Lanjut ke verifikasi <Icon name="arrow" /></button>
            <button className="account-text-button" type="button" onClick={() => setView('login')}>Sudah punya akun? <strong>Masuk</strong></button>
          </form>
        )}

        {view === 'verify' && (
          <div className="account-view account-verify">
            <div className="account-title-icon"><Icon name="shield" /></div>
            <span className="account-eyebrow">Verifikasi keamanan</span>
            <h2>Pastikan kamu bukan robot.</h2>
            <p>Langkah ini membantu mengurangi pendaftaran otomatis dan aktivitas yang mencurigakan.</p>

            <button className={`human-check${humanVerified ? ' verified' : ''}${verifying ? ' loading' : ''}`} type="button" onClick={verifyHuman} disabled={verifying || humanVerified}>
              <span className="human-box">{humanVerified ? <Icon name="check" /> : verifying ? <i /> : null}</span>
              <span><strong>{humanVerified ? 'Verifikasi selesai' : verifying ? 'Memeriksa…' : 'Saya bukan robot'}</strong><small>DLavie Security</small></span>
              <Icon name="shield" />
            </button>

            <div className="security-note"><Icon name="lock" /><span><strong>Password tidak disimpan sebagai teks biasa.</strong><small>Versi demo menggunakan Web Crypto. CAPTCHA production akan diproses oleh layanan verifikasi server-side.</small></span></div>

            {error && <div className="account-error">{error}</div>}
            <button className="account-primary" type="button" disabled={!humanVerified || busy} onClick={createAccount}>{busy ? 'Membuat akun…' : 'Buat akun'} {!busy && <Icon name="arrow" />}</button>
            <button className="account-text-button" type="button" onClick={() => setView('register')}>← Kembali</button>
          </div>
        )}

        {view === 'welcome' && profile && (
          <div className="account-view account-welcome">
            <div className="welcome-confetti" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            <Avatar id={profile.avatarId} className="large" alt={`Avatar ${profile.username}`} />
            <span className="account-eyebrow">Akun berhasil dibuat</span>
            <h2>Selamat datang, {profile.username}.</h2>
            <p>Senang kamu bergabung. Semoga layanan yang tersedia sesuai dengan kebutuhanmu.</p>

            <div className="welcome-profile-card">
              <div className="welcome-user"><Avatar id={profile.avatarId} alt="Avatar akun" /><span><strong>{profile.username}</strong><small>{profile.email}</small></span></div>
              <div className="welcome-id"><span>ID Pengguna</span><button type="button" onClick={copyId}>{profile.id}<Icon name="copy" /></button></div>
            </div>

            <div className="avatar-random-note"><span>Avatar koleksi</span><strong>{AVATARS.find((item) => item.id === profile.avatarId)?.name}</strong><small>Dipilih secara acak. Kamu bisa menggantinya kapan saja dari profil.</small></div>
            <div className="welcome-security"><span><Icon name="shield" /></span><p><strong>Keamanan akun aktif</strong><small>Password terlindungi dan verifikasi keamanan sudah selesai.</small></p></div>
            <button className="account-primary" type="button" onClick={() => { setOpen(false); window.location.hash = '/market' }}>Lanjut ke Market <Icon name="arrow" /></button>
          </div>
        )}

        {view === 'login' && (
          <form className="account-view account-login" onSubmit={login}>
            <div className="account-title-icon"><Icon name="lock" /></div>
            <span className="account-eyebrow">Masuk</span>
            <h2>Selamat datang kembali.</h2>
            <p>Masuk menggunakan username atau email yang terdaftar.</p>

            <label className="account-field"><span>Username atau email</span><div><Icon name="user" /><input autoComplete="username" value={loginIdentity} onChange={(event) => setLoginIdentity(event.target.value)} placeholder="Username atau email" /></div></label>
            <label className="account-field"><span>Password</span><div><Icon name="lock" /><input type={showLoginPassword ? 'text' : 'password'} autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder="Password" /><button type="button" onClick={() => setShowLoginPassword((value) => !value)} aria-label="Lihat password"><Icon name={showLoginPassword ? 'eyeOff' : 'eye'} /></button></div></label>

            {error && <div className="account-error">{error}</div>}
            <button className="account-primary" type="submit" disabled={!loginIdentity || !loginPassword || busy}>{busy ? 'Memeriksa…' : 'Masuk'} {!busy && <Icon name="arrow" />}</button>
            {!profile ? <button className="account-text-button" type="button" onClick={() => setView('register')}>Belum punya akun? <strong>Daftar</strong></button> : <button className="account-text-button danger-link" type="button" onClick={resetAccount}>Hapus akun demo di perangkat ini</button>}
          </form>
        )}

        {view === 'profile' && profile && (
          <div className="account-view account-profile">
            <div className="profile-head">
              <div className="profile-avatar-wrap">
                <Avatar id={profile.avatarId} className="large" alt={`Avatar ${profile.username}`} />
                <button className="avatar-edit-mini" type="button" onClick={() => setAvatarEditing((value) => !value)} aria-label="Ubah avatar"><Icon name="edit" /></button>
              </div>
              <div><span className="account-eyebrow">Akun saya</span><h2>{profile.username}</h2><p>{profile.email}</p><button className="change-avatar-link" type="button" onClick={() => setAvatarEditing((value) => !value)}>{avatarEditing ? 'Tutup pilihan avatar' : 'Ubah avatar'}</button></div>
            </div>

            {avatarEditing && (
              <section className="avatar-picker-panel">
                <div className="avatar-picker-head"><div><strong>Pilih avatar</strong><small>7 avatar koleksi DLavie</small></div><span>{avatarSaved ? 'Tersimpan ✓' : 'Perubahan tersimpan otomatis'}</span></div>
                <div className="avatar-grid">
                  {AVATARS.map((avatar) => (
                    <button key={avatar.id} type="button" className={profile.avatarId === avatar.id ? 'active' : ''} onClick={() => selectAvatar(avatar.id)} aria-label={`Pilih ${avatar.name}`}>
                      <img src={avatarUrl(avatar.id)} alt="" draggable={false} />
                      <span>{avatar.name}</span>
                      {profile.avatarId === avatar.id && <i><Icon name="check" /></i>}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="profile-info-grid">
              <div><span>ID Pengguna</span><button type="button" onClick={copyId}><strong>{profile.id}</strong><Icon name="copy" /></button><small>{copied ? 'ID disalin' : 'ID unik akunmu'}</small></div>
              <div><span>Status</span><strong className="verified-status"><i /> Aktif</strong><small>Session terverifikasi</small></div>
              <div><span>Bergabung</span><strong>{new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(profile.createdAt))}</strong><small>DLavie Market</small></div>
              <div><span>Avatar</span><strong>{AVATARS.find((item) => item.id === profile.avatarId)?.name}</strong><small>Koleksi DLavie</small></div>
            </div>
            <div className="profile-security-row"><span><Icon name="shield" /></span><p><strong>Perlindungan akun</strong><small>Untuk production, autentikasi akan dipindahkan ke server dengan verifikasi email, CAPTCHA asli, rate-limit, dan session token aman.</small></p></div>
            <button className="account-primary" type="button" onClick={() => setOpen(false)}>Lanjut <Icon name="arrow" /></button>
            <button className="account-logout" type="button" onClick={logout}><Icon name="logout" /> Keluar dari akun</button>
          </div>
        )}
      </section>
    </div>
  )
}
