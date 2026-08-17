import { useEffect, useMemo, useRef, useState } from 'react'

const PROFILE_KEY = 'dlavie-account-profile-v1'
const SESSION_KEY = 'dlavie-account-session-v1'
const CONSENT_KEY = 'dlavie-consent-v1'
const CONSENT_VERSION = '2026-08-18-v1'
const AUTH_EVENT = 'dlavie:auth-state'

type Profile = { id: string; username: string; email: string; createdAt: string; avatarId?: string }
type Consent = { version: string; userId: string; acceptedAt: string; documents: Record<string, string> }
type GuestPage = 'overview' | 'product' | 'how' | 'payments' | 'security' | 'faq' | 'collaboration' | 'legal'

type AccessState = { profile: Profile | null; signedIn: boolean; consent: Consent | null; authorized: boolean; pending: boolean }

type DocSection = { title: string; text: string; bullets?: string[] }

const BASE = import.meta.env.BASE_URL

function readProfile(): Profile | null {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') as Profile | null } catch { return null }
}
function readConsent(): Consent | null {
  try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null') as Consent | null } catch { return null }
}
function consentValid(profile: Profile | null, consent: Consent | null) {
  return !!profile && !!consent && consent.version === CONSENT_VERSION && consent.userId === profile.id
}
function readAccess(): AccessState {
  const profile = readProfile()
  const consent = readConsent()
  const signedIn = sessionStorage.getItem(SESSION_KEY) === 'active'
  const accepted = consentValid(profile, consent)
  return { profile, signedIn, consent, authorized: signedIn && accepted, pending: signedIn && !!profile && !accepted }
}
function guestPageFromHash(): GuestPage {
  const route = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase()
  if (route === 'help' || route === 'faq' || route === 'docs/faq') return 'faq'
  if (route === 'legal' || route === 'terms' || route === 'privacy' || route === 'docs/legal') return 'legal'
  if (route === 'docs/product') return 'product'
  if (route === 'docs/how') return 'how'
  if (route === 'docs/payments') return 'payments'
  if (route === 'docs/security') return 'security'
  if (route === 'docs/collaboration') return 'collaboration'
  return 'overview'
}
function goGuest(page: GuestPage) {
  window.location.hash = page === 'faq' ? '/docs/faq' : page === 'legal' ? '/docs/legal' : `/docs/${page}`
}
function openAuth() {
  const button = document.querySelector<HTMLButtonElement>('.avatar-button')
  if (button) button.click()
}
function isEnglish() { return localStorage.getItem('dlavie-language') === 'en' }

const docsId: Record<GuestPage, { eyebrow: string; title: string; intro: string; sections: DocSection[] }> = {
  overview: {
    eyebrow: 'DLAVIE DOCUMENTATION', title: 'Marketplace nomor virtual yang lebih terstruktur.', intro: 'Pelajari cara DLavie bekerja, bagaimana transaksi dicatat, dan apa yang perlu diketahui sebelum membuat akun.',
    sections: [
      { title: 'Satu alur dari wallet sampai OTP', text: 'DLavie menyatukan pemilihan layanan, negara, provider, pembayaran, sesi nomor, OTP, serta histori transaksi dalam satu antarmuka.' },
      { title: 'Status yang transparan', text: 'Label Demo, Sandbox, dan Production dipisahkan agar pengguna dapat mengetahui data mana yang masih simulasi dan mana yang berasal dari backend.' },
      { title: 'Reference ID di setiap tahap', text: 'User ID, Wallet ID, Order ID, timestamp, dan status membantu audit transaksi serta mempercepat proses bantuan.' },
    ],
  },
  product: {
    eyebrow: 'PRODUCT', title: 'Apa yang tersedia di DLavie.', intro: 'Gambaran fitur utama yang dapat digunakan setelah akun aktif dan persetujuan onboarding selesai.',
    sections: [
      { title: 'Market', text: 'Pilih layanan, negara, operator/provider, harga, dan stok dalam flow bertahap agar keputusan tidak terasa seperti katalog yang penuh.' },
      { title: 'Wallet', text: 'Saldo server, deposit, reference ID, status pembayaran, dan riwayat deposit dipusatkan pada wallet.', bullets: ['Minimum deposit disiapkan mulai Rp1.000.', 'Saldo hanya dikreditkan setelah status pembayaran diverifikasi backend.', 'Metode pembayaran mengikuti channel merchant yang aktif.'] },
      { title: 'Order & OTP', text: 'Sesi aktif mempunyai waktu kedaluwarsa, status provider, nomor, kode OTP, dan histori yang dapat ditinjau kembali.' },
      { title: 'Activity ledger', text: 'Aktivitas menampilkan metadata order, waktu dibuat, waktu sesi berakhir, User ID, dan status transaksi.' },
    ],
  },
  how: {
    eyebrow: 'HOW IT WORKS', title: 'Dari akun sampai order selesai.', intro: 'DLavie dirancang agar setiap langkah mempunyai konteks dan status yang bisa ditelusuri.',
    sections: [
      { title: '01 · Buat akun', text: 'Daftar menggunakan username, email, dan password. Setelah verifikasi, onboarding persetujuan harus diselesaikan sebelum akses Market dibuka.' },
      { title: '02 · Isi wallet', text: 'Pilih nominal deposit dan metode pembayaran yang tersedia. Status pembayaran diproses server-side.' },
      { title: '03 · Pilih kebutuhan', text: 'Pilih layanan, negara, provider, lalu tinjau ringkasan sebelum order dikonfirmasi.' },
      { title: '04 · Pantau sesi', text: 'Nomor aktif, timer, status provider, dan event OTP muncul pada halaman Aktivitas.' },
      { title: '05 · Selesai atau refund', text: 'Order yang berhasil tercatat di histori. Refund mengikuti status supplier dan Payment & Refund Policy.' },
    ],
  },
  payments: {
    eyebrow: 'PAYMENTS', title: 'Pembayaran dan wallet.', intro: 'Arsitektur payment dipisahkan dari frontend agar saldo tidak dapat ditambah hanya dengan memanipulasi browser.',
    sections: [
      { title: 'Midtrans', text: 'DLavie menggunakan Midtrans sebagai payment gateway pada integrasi yang sedang dikembangkan. Sandbox digunakan untuk pengujian tanpa uang sungguhan.' },
      { title: 'Verifikasi server', text: 'Callback browser bukan sumber kebenaran saldo. Backend memeriksa status transaksi dan webhook sebelum mengkredit wallet.' },
      { title: 'Core API', text: 'Custom payment UI DLavie menggunakan jalur Core API. Ketersediaan QRIS, e-wallet, VA, retail, atau paylater mengikuti channel yang diaktifkan pada merchant.' },
      { title: 'Refund', text: 'Refund dapat bergantung pada status payment gateway, supplier, apakah OTP sudah diterima, dan alasan kegagalan order.' },
    ],
  },
  security: {
    eyebrow: 'SECURITY', title: 'Batas antara browser dan backend.', intro: 'Dokumentasi ini menjelaskan kontrol yang sudah diterapkan serta bagian yang masih perlu ditingkatkan sebelum production.',
    sections: [
      { title: 'Secret tidak ditaruh di frontend', text: 'Credential sensitif payment gateway disimpan di backend/Vault, bukan di source JavaScript publik.' },
      { title: 'Wallet token', text: 'Wallet menggunakan token acak dan backend memproses identitas wallet tanpa mempercayai saldo dari browser.' },
      { title: 'Akun saat ini masih demo browser', text: 'Password demo diolah dengan PBKDF2-SHA256, tetapi autentikasi production tetap perlu server-side auth, verifikasi email, rate limit, dan session token yang lebih kuat.' },
      { title: 'Guest access dibatasi', text: 'Pengunjung yang belum login hanya mendapat akses dokumentasi/campaign. Deposit, Market, order, dan wallet dikunci sampai sesi login dan persetujuan kebijakan valid.' },
    ],
  },
  faq: {
    eyebrow: 'FAQ', title: 'Pertanyaan yang sering muncul.', intro: 'Jawaban singkat sebelum kamu membuat akun atau mulai bertransaksi.',
    sections: [
      { title: 'Apakah saya harus punya akun?', text: 'Ya. Dokumentasi tetap dapat dibaca tanpa akun, tetapi Market, wallet, deposit, dan pembelian membutuhkan sesi login yang valid.' },
      { title: 'Kenapa ada Sandbox?', text: 'Sandbox dipakai untuk menguji integrasi pembayaran tanpa uang sungguhan. Status Sandbox tidak boleh dianggap sebagai transaksi production.' },
      { title: 'Apakah OTP dijamin masuk?', text: 'Tidak. Pengiriman OTP dipengaruhi layanan tujuan, supplier, operator, filtering SMS, dan kondisi jaringan.' },
      { title: 'Apa yang harus disimpan saat ada masalah?', text: 'Simpan User ID, Order ID, waktu kejadian, layanan/provider, status, dan screenshot. Jangan pernah membagikan password atau Server Key.' },
      { title: 'Kapan refund mungkin diberikan?', text: 'Order gagal sebelum layanan diberikan, sesi expired tanpa OTP, atau pembayaran ganda yang terverifikasi dapat memenuhi syarat sesuai kebijakan yang berlaku.' },
    ],
  },
  collaboration: {
    eyebrow: 'COLLABORATION & INTEGRATIONS', title: 'Ekosistem teknologi DLavie.', intro: 'Brand berikut ditampilkan karena dipakai sebagai integrasi atau infrastruktur. Penempatan logo tidak menyatakan endorsement atau partnership resmi.',
    sections: [],
  },
  legal: {
    eyebrow: 'POLICIES', title: 'Kebijakan sebelum menggunakan Market.', intro: 'Ringkasan dokumen yang harus dipahami pengguna sebelum mengakses layanan transaksi.',
    sections: [
      { title: 'Terms of Service', text: 'Mengatur penggunaan akun, wallet, order, sesi nomor, pihak ketiga, penangguhan, dan tanggung jawab pengguna.' },
      { title: 'Privacy Policy', text: 'Menjelaskan metadata akun, wallet, transaksi, order, data teknis, tujuan pemrosesan, retensi, dan kontrol pengguna.' },
      { title: 'Payment & Refund Policy', text: 'Mengatur kapan saldo dikreditkan, kondisi transaksi gagal, order expired, duplicate payment, dan kelayakan refund.' },
      { title: 'Acceptable Use Policy', text: 'Melarang fraud, phishing, spam, harassment, account takeover, mass abuse, dan penggunaan yang melanggar hukum atau kebijakan platform.' },
      { title: 'Service Disclosure', text: 'Menjelaskan perbedaan Demo/Sandbox/Production serta ketergantungan pada supplier, operator, payment gateway, dan layanan pihak ketiga.' },
    ],
  },
}

const docsEn: Record<GuestPage, { eyebrow: string; title: string; intro: string; sections: DocSection[] }> = {
  overview: { eyebrow: 'DLAVIE DOCUMENTATION', title: 'A more structured virtual-number marketplace.', intro: 'Learn how DLavie works, how transactions are referenced, and what to know before creating an account.', sections: [{ title: 'One flow from wallet to OTP', text: 'DLavie combines service, country, provider, payment, number session, OTP status and transaction history in one interface.' }, { title: 'Transparent states', text: 'Demo, Sandbox and Production states are separated so users can understand what is simulated and what is server-backed.' }, { title: 'Reference IDs', text: 'User ID, Wallet ID, Order ID and timestamps make transaction support and auditing easier.' }] },
  product: { eyebrow: 'PRODUCT', title: 'What DLavie provides.', intro: 'An overview of features available after account access and onboarding consent are complete.', sections: [{ title: 'Market', text: 'A staged service, country and provider selection flow.' }, { title: 'Wallet', text: 'Server balance, deposits, payment status and references in one place.' }, { title: 'Order & OTP', text: 'Active number sessions, expiry, provider status and OTP events.' }, { title: 'Activity ledger', text: 'Order metadata, timestamps and transaction state remain reviewable.' }] },
  how: { eyebrow: 'HOW IT WORKS', title: 'From account to completed order.', intro: 'Each step has context and a traceable state.', sections: [{ title: '01 · Create an account', text: 'Register, verify and complete the mandatory policy onboarding.' }, { title: '02 · Fund wallet', text: 'Choose an available payment method and wait for server verification.' }, { title: '03 · Choose service', text: 'Select service, country and provider, then review the order.' }, { title: '04 · Monitor session', text: 'Track number, timer, provider and OTP state.' }, { title: '05 · Complete or refund', text: 'Completion and refund status is recorded in activity history.' }] },
  payments: { eyebrow: 'PAYMENTS', title: 'Payments and wallet.', intro: 'Payment state is separated from browser state so wallet balance cannot be trusted from frontend callbacks alone.', sections: [{ title: 'Midtrans', text: 'Midtrans is used as the payment-gateway integration currently under development, with Sandbox used for testing.' }, { title: 'Server verification', text: 'The backend verifies payment status before crediting wallet balance.' }, { title: 'Core API', text: 'DLavie custom payment UI relies on Core API channels enabled for the merchant.' }, { title: 'Refunds', text: 'Refund eligibility depends on payment status, supplier state and service delivery.' }] },
  security: { eyebrow: 'SECURITY', title: 'The boundary between browser and backend.', intro: 'Controls already in place and areas that still require production hardening.', sections: [{ title: 'Secrets stay server-side', text: 'Payment secrets are not embedded in public browser code.' }, { title: 'Wallet token', text: 'Random wallet tokens are processed by the backend rather than trusting browser balances.' }, { title: 'Current account auth is still a browser demo', text: 'Production still requires server-side authentication, email verification, rate limits and stronger sessions.' }, { title: 'Guest access is restricted', text: 'Guests only see campaign/documentation until login and policy consent are valid.' }] },
  faq: { eyebrow: 'FAQ', title: 'Common questions.', intro: 'Short answers before you create an account or transact.', sections: [{ title: 'Do I need an account?', text: 'Documentation is public, but Market, wallet, deposits and orders require login.' }, { title: 'Why Sandbox?', text: 'Sandbox is a non-real-money environment for integration testing.' }, { title: 'Is OTP guaranteed?', text: 'No. Delivery depends on the destination service, supplier, carrier and network conditions.' }, { title: 'What should I keep for support?', text: 'Keep User ID, Order ID, time, provider and screenshots. Never share passwords or Server Keys.' }, { title: 'When can refunds apply?', text: 'Verified failures, expired sessions without OTP, or duplicate payments may qualify under the active policy.' }] },
  collaboration: { eyebrow: 'COLLABORATION & INTEGRATIONS', title: 'DLavie technology ecosystem.', intro: 'These brands are shown because they are used as integrations or infrastructure. Logo placement does not imply endorsement or an official partnership.', sections: [] },
  legal: { eyebrow: 'POLICIES', title: 'Policies before accessing Market.', intro: 'A summary of the documents users must understand before transactional access.', sections: [{ title: 'Terms of Service', text: 'Account, wallet, orders, temporary-number sessions, third parties and user responsibilities.' }, { title: 'Privacy Policy', text: 'Account, wallet, transaction, order and technical metadata handling.' }, { title: 'Payment & Refund Policy', text: 'Wallet crediting, failed transactions, expiry, duplicates and refund eligibility.' }, { title: 'Acceptable Use Policy', text: 'Fraud, phishing, spam, harassment, account takeover and mass abuse are prohibited.' }, { title: 'Service Disclosure', text: 'Explains Demo/Sandbox/Production and third-party dependencies.' }] },
}

function Collaboration() {
  const integrations = [
    { name: 'Midtrans', role: 'Payment gateway', detail: 'Sandbox payment processing & Core API integration', logo: `${BASE}integrations/midtrans.svg`, wide: true },
    { name: 'Supabase', role: 'Backend & database', detail: 'Edge Functions, database, Vault, server wallet', logo: `${BASE}integrations/supabase.svg` },
    { name: 'GitHub Pages', role: 'Frontend delivery', detail: 'Source repository, CI build and static deployment', logo: `${BASE}integrations/github.svg` },
  ]
  return <div className="guest-integration-grid">{integrations.map((item) => <article key={item.name}><div className={`guest-integration-logo${item.wide ? ' wide' : ''}`}><img src={item.logo} alt={`${item.name} logo`} /></div><span>{item.role}</span><h3>{item.name}</h3><p>{item.detail}</p><small>Integration · no endorsement implied</small></article>)}</div>
}

function GuestSite({ state, onSync }: { state: AccessState; onSync: () => void }) {
  const [page, setPage] = useState<GuestPage>(() => guestPageFromHash())
  const [menu, setMenu] = useState(false)
  const [english, setEnglish] = useState(() => isEnglish())
  const nav = english ? [
    ['overview','Overview'],['product','Product'],['how','How it works'],['payments','Payments'],['security','Security'],['faq','FAQ'],['collaboration','Collaboration'],['legal','Policies'],
  ] : [
    ['overview','Ringkasan'],['product','Produk'],['how','Cara kerja'],['payments','Pembayaran'],['security','Keamanan'],['faq','FAQ'],['collaboration','Kolaborasi'],['legal','Kebijakan'],
  ]
  const doc = (english ? docsEn : docsId)[page]

  useEffect(() => {
    const route = () => { setPage(guestPageFromHash()); setMenu(false); window.scrollTo({ top: 0, behavior: 'auto' }) }
    window.addEventListener('hashchange', route)
    return () => window.removeEventListener('hashchange', route)
  }, [])

  const changeLang = () => {
    const next = !english
    localStorage.setItem('dlavie-language', next ? 'en' : 'id')
    setEnglish(next)
    window.dispatchEvent(new Event('dlavie:language-change'))
  }
  const authLabel = state.profile ? (english ? 'Sign in' : 'Masuk') : (english ? 'Create account' : 'Buat akun')

  return (
    <div className="guest-site" role="document">
      <header className="guest-topbar">
        <button className="guest-brand" onClick={() => goGuest('overview')}><b>D</b><span>DLavie</span><small>Docs</small></button>
        <div className="guest-top-actions"><button onClick={changeLang}>{english ? 'ID' : 'EN'}</button><button className="guest-login" onClick={() => { openAuth(); window.setTimeout(onSync, 40) }}>{authLabel}<span>→</span></button><button className="guest-menu-button" onClick={() => setMenu((v) => !v)} aria-label="Menu">☰</button></div>
      </header>

      <aside className={`guest-sidebar${menu ? ' open' : ''}`}>
        <div className="guest-sidebar-head"><span>{english ? 'DOCUMENTATION' : 'DOKUMENTASI'}</span><small>Public access</small></div>
        <nav>{nav.map(([id,label], index) => <button key={id} className={page === id ? 'active' : ''} onClick={() => goGuest(id as GuestPage)}><i>{String(index + 1).padStart(2,'0')}</i><span>{label}</span><b>→</b></button>)}</nav>
        <div className="guest-sidebar-foot"><span>DLavie Market</span><p>{english ? 'Transactional access requires an account and accepted policies.' : 'Akses transaksi membutuhkan akun dan persetujuan kebijakan.'}</p></div>
      </aside>
      {menu && <button className="guest-menu-scrim" aria-label="Tutup menu" onClick={() => setMenu(false)} />}

      <main className="guest-doc-main">
        <section className="guest-doc-hero">
          <span>{doc.eyebrow}</span>
          <h1>{doc.title}</h1>
          <p>{doc.intro}</p>
          {page === 'overview' && <div className="guest-hero-actions"><button className="guest-primary" onClick={openAuth}>{state.profile ? (english ? 'Sign in to DLavie' : 'Masuk ke DLavie') : (english ? 'Create DLavie account' : 'Buat akun DLavie')}<b>→</b></button><button onClick={() => goGuest('how')}>{english ? 'Read how it works' : 'Pelajari cara kerja'}</button></div>}
        </section>

        {page === 'overview' && <section className="guest-status-strip"><div><small>01</small><strong>{english ? 'Public documentation' : 'Dokumentasi publik'}</strong><span>{english ? 'Available without login' : 'Bisa dibaca tanpa login'}</span></div><div><small>02</small><strong>Market & Wallet</strong><span>{english ? 'Account required' : 'Wajib login'}</span></div><div><small>03</small><strong>{english ? 'Policy consent' : 'Persetujuan kebijakan'}</strong><span>{english ? 'Required before access' : 'Wajib sebelum akses'}</span></div></section>}

        {page === 'collaboration' ? <Collaboration /> : <div className="guest-doc-sections">{doc.sections.map((section, index) => <article key={section.title}><div className="guest-section-index">{String(index + 1).padStart(2,'0')}</div><div><h2>{section.title}</h2><p>{section.text}</p>{section.bullets && <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}</div></article>)}</div>}

        {page === 'legal' && <section className="guest-legal-note"><strong>{english ? 'Before transactional access' : 'Sebelum akses transaksi'}</strong><p>{english ? 'New accounts must scroll through the onboarding summary and explicitly accept Terms, Privacy, Payment & Refund, and Acceptable Use policies. The acceptance record is versioned to the User ID.' : 'Akun baru wajib menggulir ringkasan onboarding sampai selesai lalu menyetujui Terms, Privacy, Payment & Refund, dan Acceptable Use secara eksplisit. Catatan persetujuan disimpan berdasarkan versi kebijakan dan User ID.'}</p></section>}

        <footer className="guest-doc-footer"><div><b>D</b><span><strong>DLavie</strong><small>Documentation & campaign</small></span></div><p>{english ? 'Guest mode does not expose wallet, deposits, orders or Market purchasing.' : 'Mode guest tidak membuka wallet, deposit, order, atau pembelian Market.'}</p></footer>
      </main>
    </div>
  )
}

function OnboardingConsent({ profile, onAccepted }: { profile: Profile; onAccepted: () => void }) {
  const reader = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [readToEnd, setReadToEnd] = useState(false)
  const [checks, setChecks] = useState({ terms: false, privacy: false, payment: false, acceptable: false })
  const allChecked = Object.values(checks).every(Boolean)

  const onScroll = () => {
    const node = reader.current
    if (!node) return
    const max = Math.max(1, node.scrollHeight - node.clientHeight)
    const value = Math.min(100, Math.round((node.scrollTop / max) * 100))
    setProgress(value)
    if (node.scrollTop + node.clientHeight >= node.scrollHeight - 8) { setReadToEnd(true); setProgress(100) }
  }
  useEffect(() => {
    const node = reader.current
    if (node && node.scrollHeight <= node.clientHeight + 4) { setReadToEnd(true); setProgress(100) }
  }, [])

  const accept = () => {
    if (!readToEnd || !allChecked) return
    const accepted: Consent = {
      version: CONSENT_VERSION,
      userId: profile.id,
      acceptedAt: new Date().toISOString(),
      documents: { terms: '2026-08-18', privacy: '2026-08-18', paymentRefund: '2026-08-18', acceptableUse: '2026-08-18' },
    }
    localStorage.setItem(CONSENT_KEY, JSON.stringify(accepted))
    document.querySelector<HTMLButtonElement>('.account-close')?.click()
    window.dispatchEvent(new Event(AUTH_EVENT))
    window.location.hash = '/home'
    onAccepted()
  }

  return (
    <div className="consent-gate" role="dialog" aria-modal="true" aria-label="Persetujuan awal DLavie">
      <section className="consent-shell">
        <header className="consent-head"><div className="consent-brand"><b>D</b><span><small>ACCOUNT ONBOARDING</small><strong>Selamat datang di DLavie.</strong></span></div><span className="consent-step">03 / 03</span></header>
        <div className="consent-profile"><img src={`${BASE}avatars/${profile.avatarId || 'neon-ape'}.svg`} alt="Avatar akun" /><div><small>AKUN BARU</small><strong>{profile.username}</strong><span>{profile.email}</span></div><div className="consent-user-id"><small>USER ID</small><b>{profile.id}</b></div></div>

        <div className="consent-intro"><span>SEBELUM MASUK KE MARKET</span><h2>Baca ringkasan, lalu berikan persetujuan.</h2><p>Scroll dokumen sampai bagian paling bawah. Checklist baru dapat dipilih setelah seluruh ringkasan sudah dilewati.</p></div>

        <div className="consent-reader-wrap"><div className="consent-progress"><span style={{ width: `${progress}%` }} /></div><div className="consent-reader" ref={reader} onScroll={onScroll}>
          <section><small>01 · TERMS OF SERVICE</small><h3>Penggunaan akun dan layanan</h3><p>Kamu bertanggung jawab menjaga akun, menggunakan nomor virtual secara sah, memeriksa ringkasan order, serta mematuhi kebijakan layanan tujuan. DLavie dapat membatasi akses jika terdapat fraud, spam, account takeover, abuse, atau risiko keamanan.</p></section>
          <section><small>02 · PRIVACY POLICY</small><h3>Data dan metadata transaksi</h3><p>DLavie dapat memproses data akun, User ID, Wallet ID, Order ID, status transaksi, waktu kejadian, status sesi, serta log teknis yang diperlukan untuk operasional, keamanan, dukungan, refund, dan pencegahan penyalahgunaan.</p></section>
          <section><small>03 · PAYMENT & REFUND</small><h3>Saldo hanya sah setelah verifikasi server</h3><p>Callback sukses di browser tidak otomatis menambah saldo. Deposit harus diverifikasi backend. Refund bergantung pada status payment gateway, supplier, expiry sesi, duplicate payment, serta apakah layanan/OTP sudah berhasil diberikan.</p></section>
          <section><small>04 · ACCEPTABLE USE</small><h3>Penggunaan yang dilarang</h3><p>DLavie tidak boleh digunakan untuk penipuan, phishing, spam, harassment, account takeover, mass-registration abuse, bypass enforcement, manipulasi pembayaran, atau aktivitas lain yang melanggar hukum maupun hak pihak ketiga.</p></section>
          <section><small>05 · SERVICE DISCLOSURE</small><h3>Ketergantungan pihak ketiga</h3><p>Ketersediaan nomor, provider, SMS/OTP, harga, metode pembayaran, dan waktu proses dapat dipengaruhi supplier, operator, payment gateway, serta layanan tujuan. Label Demo, Sandbox, dan Production harus dibaca sesuai status yang tampil.</p></section>
          <div className="consent-end"><b>✓</b><div><strong>Akhir ringkasan persetujuan</strong><span>Kamu sekarang dapat memilih checklist di bawah.</span></div></div>
        </div></div>

        <div className={`consent-checks${readToEnd ? ' unlocked' : ''}`}>
          {!readToEnd && <div className="consent-lock-note">↓ Scroll ringkasan sampai bawah untuk membuka persetujuan.</div>}
          {[
            ['terms','Saya menyetujui Terms of Service DLavie.'],
            ['privacy','Saya memahami dan menyetujui Privacy Policy.'],
            ['payment','Saya memahami Payment & Refund Policy.'],
            ['acceptable','Saya menyetujui Acceptable Use Policy dan penggunaan yang dilarang.'],
          ].map(([key,label]) => <label key={key}><input type="checkbox" disabled={!readToEnd} checked={checks[key as keyof typeof checks]} onChange={(e) => setChecks((v) => ({ ...v, [key]: e.target.checked }))} /><i>{checks[key as keyof typeof checks] ? '✓' : ''}</i><span>{label}</span></label>)}
        </div>

        <div className="consent-actions"><button className="consent-doc-link" type="button" onClick={() => window.open(`${window.location.origin}${BASE}#/docs/legal`, '_blank', 'noopener,noreferrer')}>Buka dokumen kebijakan lengkap ↗</button><button className="consent-continue" type="button" disabled={!readToEnd || !allChecked} onClick={accept}><span>{!readToEnd ? 'Selesaikan bacaan' : !allChecked ? 'Centang semua persetujuan' : 'Setuju & masuk ke Beranda'}</span><b>→</b></button></div>
        <footer className="consent-foot"><span>Consent version {CONSENT_VERSION}</span><span>Acceptance akan dicatat dengan User ID dan timestamp.</span></footer>
      </section>
    </div>
  )
}

export default function AccessExperience() {
  const [state, setState] = useState<AccessState>(() => readAccess())
  const snapshot = useMemo(() => `${state.profile?.id || ''}|${state.signedIn}|${state.consent?.version || ''}|${state.consent?.userId || ''}`, [state])

  const sync = () => setState(readAccess())

  useEffect(() => {
    const update = () => sync()
    const click = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('.account-primary,.account-logout,.danger-link,.account-close')) window.setTimeout(sync, 80)
    }
    const observer = new MutationObserver(() => window.setTimeout(sync, 0))
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('storage', update)
    window.addEventListener('focus', update)
    window.addEventListener(AUTH_EVENT, update)
    document.addEventListener('click', click, true)
    return () => { observer.disconnect(); window.removeEventListener('storage', update); window.removeEventListener('focus', update); window.removeEventListener(AUTH_EVENT, update); document.removeEventListener('click', click, true) }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.access = state.authorized ? 'member' : state.pending ? 'onboarding' : 'guest'
    const route = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase()
    if (state.authorized) {
      if (route.startsWith('docs/')) history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/home`)
    } else if (!route.startsWith('docs/') && !['help','faq','legal','terms','privacy'].includes(route)) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/docs/overview`)
    }
  }, [snapshot, state.authorized, state.pending])

  if (state.authorized) return null
  return <><GuestSite state={state} onSync={sync} />{state.pending && state.profile && <OnboardingConsent profile={state.profile} onAccepted={sync} />}</>
}
