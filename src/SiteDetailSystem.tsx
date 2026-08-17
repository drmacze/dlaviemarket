import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type PageId = 'home' | 'market' | 'guide' | 'security' | 'activity'
type Profile = { id?: string; username?: string; email?: string; createdAt?: string; avatarId?: string }
type Order = { id: string; serviceName?: string; providerName?: string; price?: number; createdAt: number; expiresAt: number; status: 'waiting' | 'received' | 'cancelled' | 'expired' }
type Deposit = { order_id: string; amount: number; status: string; payment_type?: string | null; created_at: string; updated_at?: string | null; credited_at?: string | null; expires_at?: string | null; midtrans_status_code?: string | null; midtrans_status_message?: string | null }
type WalletPayload = { ok?: boolean; wallet_id?: string | null; balance?: number; deposits?: Deposit[] }
type DetailItem = { label: string; value: string; tone?: 'good' | 'warn' | 'muted' }
type Context = { eyebrow: string; title: string; subtitle: string; rail: DetailItem[]; groups: Array<{ title: string; items: DetailItem[] }> }

const API = 'https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-wallet'
const TOKEN_KEY = 'dlavie-wallet-token-v1'
const PROFILE_KEY = 'dlavie-account-profile-v1'
const SESSION_KEY = 'dlavie-account-session-v1'
const ORDER_KEY = 'dlavie-orders-v1'
const STATE_EVENT = 'dlavie:state-changed'
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

function pageFromHash(): PageId {
  const value = window.location.hash.replace(/^#\/?/, '').split(/[?&]/)[0].toLowerCase()
  if (value === 'market') return 'market'
  if (value === 'guide' || value === 'cara-kerja') return 'guide'
  if (value === 'security' || value === 'keamanan') return 'security'
  if (value === 'activity' || value === 'aktivitas') return 'activity'
  return 'home'
}
function lang() { return localStorage.getItem('dlavie-language') === 'en' ? 'en' : 'id' }
function profile(): Profile | null { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') as Profile | null } catch { return null } }
function orders(): Order[] { try { return JSON.parse(localStorage.getItem(ORDER_KEY) || '[]') as Order[] } catch { return [] } }
function balance() { const value = Number(localStorage.getItem('dlavie-balance') || 0); return Number.isFinite(value) ? value : 0 }
function formatDate(value?: string | number | null, includeSeconds = false) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(lang() === 'en' ? 'en-US' : 'id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', ...(includeSeconds ? { second: '2-digit' as const } : {}) }).format(d)
}
function walletRef(value?: string | null) { return value ? `WLT-${value.replaceAll('-', '').slice(0, 12).toUpperCase()}` : '—' }
function method(value?: string | null) {
  const names: Record<string, string> = { qris: 'QRIS', gopay: 'GoPay', shopeepay: 'ShopeePay', dana: 'DANA', ovo: 'OVO', bca: 'BCA VA', bni: 'BNI VA', bri: 'BRI VA', permata: 'Permata VA', mandiri: 'Mandiri Bill', indomaret: 'Indomaret', alfamart: 'Alfamart', akulaku: 'Akulaku', kredivo: 'Kredivo' }
  return names[String(value)] || value || '—'
}
function latestOrder(all: Order[]) { return [...all].sort((a, b) => b.createdAt - a.createdAt)[0] }
function latestDeposit(all: Deposit[]) { return [...all].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] }
function targetFor(page: PageId) {
  const selector: Record<PageId, string> = { home: '.hero', market: '.market-flow-head', guide: '.experience-card', security: '.security', activity: '.order-center-head' }
  return document.querySelector<HTMLElement>(selector[page])
}

function ContextRail({ context, expanded, onToggle }: { context: Context; expanded: boolean; onToggle: () => void }) {
  return (
    <section className={`site-context ${expanded ? 'is-expanded' : ''}`} aria-label={context.title}>
      <div className="site-context-head">
        <div><span>{context.eyebrow}</span><strong>{context.title}</strong><small>{context.subtitle}</small></div>
        <button type="button" onClick={onToggle} aria-expanded={expanded}><span>{expanded ? (lang() === 'en' ? 'Close details' : 'Tutup detail') : (lang() === 'en' ? 'View details' : 'Lihat detail')}</span><b>{expanded ? '−' : '+'}</b></button>
      </div>
      <div className="site-context-rail">
        {context.rail.map((item) => <div key={`${item.label}-${item.value}`} data-tone={item.tone || 'muted'}><small>{item.label}</small><strong>{item.value}</strong></div>)}
      </div>
      {expanded && (
        <div className="site-context-detail">
          {context.groups.map((group) => (
            <section key={group.title}>
              <h4>{group.title}</h4>
              <div>{group.items.map((item) => <p key={`${group.title}-${item.label}`} data-tone={item.tone || 'muted'}><span>{item.label}</span><b>{item.value}</b></p>)}</div>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}

function ProfileSystemDetails({ walletId, deposits, syncedAt }: { walletId: string | null; deposits: Deposit[]; syncedAt: number | null }) {
  const p = profile()
  const signed = sessionStorage.getItem(SESSION_KEY) === 'active'
  const paid = deposits.filter((item) => item.status === 'paid').length
  return (
    <section className="profile-system-details">
      <div className="profile-system-title"><span>{lang() === 'en' ? 'ACCOUNT DETAILS' : 'DETAIL AKUN'}</span><strong>{lang() === 'en' ? 'Identity & session' : 'Identitas & sesi'}</strong></div>
      <div className="profile-system-rows">
        <p><span>User ID</span><b>{p?.id || 'Guest'}</b></p>
        <p><span>{lang() === 'en' ? 'Account created' : 'Akun dibuat'}</span><b>{formatDate(p?.createdAt)}</b></p>
        <p><span>{lang() === 'en' ? 'Session' : 'Sesi'}</span><b data-tone={signed ? 'good' : 'warn'}>{signed ? (lang() === 'en' ? 'Active in this tab' : 'Aktif di tab ini') : (lang() === 'en' ? 'Signed out' : 'Tidak aktif')}</b></p>
        <p><span>Wallet ID</span><b>{walletRef(walletId)}</b></p>
        <p><span>{lang() === 'en' ? 'Verified deposits' : 'Deposit terverifikasi'}</span><b>{paid}</b></p>
        <p><span>{lang() === 'en' ? 'Last server sync' : 'Sinkron server terakhir'}</span><b>{formatDate(syncedAt)}</b></p>
        <p><span>{lang() === 'en' ? 'Password protection' : 'Proteksi password'}</span><b>PBKDF2-SHA256 · 210k</b></p>
        <p><span>{lang() === 'en' ? 'Account storage' : 'Penyimpanan akun'}</span><b>{lang() === 'en' ? 'This device · demo auth' : 'Perangkat ini · auth demo'}</b></p>
      </div>
      <small className="profile-system-note">{lang() === 'en' ? 'Payment balance is server-backed. The current account/login system is still a browser demo and will need server-side auth before production.' : 'Saldo pembayaran sudah berasal dari server. Sistem akun/login saat ini masih demo browser dan perlu auth server-side sebelum production.'}</small>
    </section>
  )
}

export default function SiteDetailSystem() {
  const [page, setPage] = useState<PageId>(() => pageFromHash())
  const [expanded, setExpanded] = useState(false)
  const [revision, setRevision] = useState(0)
  const [walletId, setWalletId] = useState<string | null>(null)
  const [serverBalance, setServerBalance] = useState<number | null>(null)
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [syncedAt, setSyncedAt] = useState<number | null>(null)
  const [serverReachable, setServerReachable] = useState<boolean | null>(null)
  const [profileTarget, setProfileTarget] = useState<HTMLElement | null>(null)

  const syncServer = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setWalletId(null); setDeposits([]); setServerBalance(null); setServerReachable(null); return }
    try {
      const response = await fetch(API, { method: 'POST', body: new URLSearchParams({ action: 'status', wallet_token: token }) })
      const data = await response.json().catch(() => ({})) as WalletPayload
      if (!response.ok || !data.ok) throw new Error('wallet_status')
      setWalletId(data.wallet_id || null)
      setDeposits(data.deposits || [])
      setServerBalance(typeof data.balance === 'number' ? data.balance : null)
      setSyncedAt(Date.now())
      setServerReachable(true)
    } catch { setServerReachable(false) }
  }, [])

  useEffect(() => {
    const refresh = () => { setRevision((value) => value + 1); void syncServer() }
    const route = () => { setPage(pageFromHash()); setExpanded(false); refresh() }
    void syncServer()
    window.addEventListener('hashchange', route)
    window.addEventListener(STATE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('hashchange', route)
      window.removeEventListener(STATE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [syncServer])

  useEffect(() => {
    const resolveProfile = () => {
      const next = document.querySelector<HTMLElement>('.account-profile')
      setProfileTarget((current) => current === next ? current : next)
    }
    resolveProfile()
    const observer = new MutationObserver(resolveProfile)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  const p = useMemo(() => profile(), [revision])
  const allOrders = useMemo(() => orders(), [revision])
  const currentBalance = serverBalance ?? balance()
  const activeOrders = allOrders.filter((item) => item.status === 'waiting' || item.status === 'received')
  const receivedOrders = allOrders.filter((item) => item.status === 'received')
  const paidDeposits = deposits.filter((item) => item.status === 'paid')
  const pendingDeposits = deposits.filter((item) => item.status === 'pending' || item.status === 'created')
  const failedDeposits = deposits.filter((item) => ['failed', 'denied', 'expired', 'cancelled'].includes(item.status))
  const lastOrder = latestOrder(allOrders)
  const lastDeposit = latestDeposit(deposits)
  const id = p?.id || (lang() === 'en' ? 'Guest' : 'Tamu')
  const syncLabel = serverReachable === true ? (lang() === 'en' ? 'Connected' : 'Terhubung') : serverReachable === false ? (lang() === 'en' ? 'Sync delayed' : 'Sinkron tertunda') : (lang() === 'en' ? 'Local only' : 'Lokal')

  const context = useMemo<Context>(() => {
    const commonIdentity: DetailItem[] = [
      { label: 'User ID', value: id },
      { label: 'Wallet ID', value: walletRef(walletId) },
      { label: lang() === 'en' ? 'Account created' : 'Akun dibuat', value: formatDate(p?.createdAt) },
      { label: lang() === 'en' ? 'Session' : 'Sesi', value: sessionStorage.getItem(SESSION_KEY) === 'active' ? (lang() === 'en' ? 'Active' : 'Aktif') : (lang() === 'en' ? 'Guest / signed out' : 'Tamu / tidak aktif') },
    ]
    if (page === 'home') return {
      eyebrow: 'DLAVIE OVERVIEW', title: lang() === 'en' ? 'Your current workspace' : 'Ringkasan ruang kerja', subtitle: lang() === 'en' ? 'Identity, wallet and activity at a glance.' : 'Identitas, wallet, dan aktivitas dalam satu ringkasan.',
      rail: [
        { label: lang() === 'en' ? 'Account' : 'Akun', value: p?.username || id },
        { label: lang() === 'en' ? 'Balance' : 'Saldo', value: rupiah.format(currentBalance), tone: currentBalance > 0 ? 'good' : 'muted' },
        { label: lang() === 'en' ? 'Active orders' : 'Order aktif', value: String(activeOrders.length) },
        { label: lang() === 'en' ? 'Wallet server' : 'Server wallet', value: syncLabel, tone: serverReachable === false ? 'warn' : 'good' },
      ],
      groups: [
        { title: lang() === 'en' ? 'Identity' : 'Identitas', items: commonIdentity },
        { title: 'Wallet', items: [{ label: lang() === 'en' ? 'Server balance' : 'Saldo server', value: rupiah.format(currentBalance) }, { label: lang() === 'en' ? 'Deposits recorded' : 'Deposit tercatat', value: String(deposits.length) }, { label: lang() === 'en' ? 'Last sync' : 'Sinkron terakhir', value: formatDate(syncedAt) }] },
        { title: lang() === 'en' ? 'Recent activity' : 'Aktivitas terbaru', items: [{ label: lang() === 'en' ? 'Orders stored' : 'Order tersimpan', value: String(allOrders.length) }, { label: lang() === 'en' ? 'Latest order' : 'Order terakhir', value: lastOrder ? `${lastOrder.id} · ${formatDate(lastOrder.createdAt)}` : '—' }, { label: lang() === 'en' ? 'Latest deposit' : 'Deposit terakhir', value: lastDeposit ? `${lastDeposit.order_id} · ${formatDate(lastDeposit.created_at)}` : '—' }] },
      ],
    }
    if (page === 'market') return {
      eyebrow: 'MARKET CONTEXT', title: lang() === 'en' ? 'Purchase context' : 'Konteks pembelian', subtitle: lang() === 'en' ? 'What is real, simulated, and currently active.' : 'Apa yang sudah nyata, masih simulasi, dan sedang aktif.',
      rail: [
        { label: lang() === 'en' ? 'Balance' : 'Saldo', value: rupiah.format(currentBalance), tone: currentBalance > 0 ? 'good' : 'muted' },
        { label: lang() === 'en' ? 'Active sessions' : 'Sesi aktif', value: String(activeOrders.length) },
        { label: lang() === 'en' ? 'Services' : 'Layanan', value: '6' },
        { label: lang() === 'en' ? 'Supplier data' : 'Data supplier', value: lang() === 'en' ? 'Demo' : 'Simulasi', tone: 'warn' },
      ],
      groups: [
        { title: lang() === 'en' ? 'Buyer' : 'Pembeli', items: [...commonIdentity.slice(0, 2), { label: lang() === 'en' ? 'Available balance' : 'Saldo tersedia', value: rupiah.format(currentBalance) }] },
        { title: lang() === 'en' ? 'Market coverage' : 'Cakupan market', items: [{ label: lang() === 'en' ? 'Order flow' : 'Alur order', value: lang() === 'en' ? '5 steps · service to OTP' : '5 tahap · layanan sampai OTP' }, { label: lang() === 'en' ? 'Countries' : 'Negara', value: '5' }, { label: lang() === 'en' ? 'Services' : 'Layanan', value: '6' }, { label: lang() === 'en' ? 'Price / stock source' : 'Sumber harga / stok', value: lang() === 'en' ? 'Demo dataset' : 'Dataset simulasi', tone: 'warn' }] },
        { title: lang() === 'en' ? 'Current sessions' : 'Sesi saat ini', items: [{ label: lang() === 'en' ? 'Active' : 'Aktif', value: String(activeOrders.length) }, { label: lang() === 'en' ? 'OTP received' : 'OTP diterima', value: String(receivedOrders.length) }, { label: lang() === 'en' ? 'Latest order' : 'Order terakhir', value: lastOrder ? `${lastOrder.id} · ${formatDate(lastOrder.createdAt)}` : '—' }] },
      ],
    }
    if (page === 'guide') return {
      eyebrow: 'FLOW GUIDE', title: lang() === 'en' ? 'How DLavie currently works' : 'Cara kerja DLavie saat ini', subtitle: lang() === 'en' ? 'A transparent view of the full purchase lifecycle.' : 'Gambaran transparan dari seluruh siklus pembelian.',
      rail: [
        { label: lang() === 'en' ? 'Purchase flow' : 'Alur pembelian', value: '5 tahap' },
        { label: lang() === 'en' ? 'Payment' : 'Pembayaran', value: 'Midtrans Sandbox', tone: 'warn' },
        { label: lang() === 'en' ? 'Supplier' : 'Supplier', value: lang() === 'en' ? 'Demo' : 'Simulasi', tone: 'warn' },
        { label: 'OTP', value: lang() === 'en' ? 'Demo simulation' : 'Simulasi demo', tone: 'warn' },
      ],
      groups: [
        { title: lang() === 'en' ? 'Purchase lifecycle' : 'Siklus pembelian', items: [{ label: '01', value: lang() === 'en' ? 'Choose service' : 'Pilih layanan' }, { label: '02', value: lang() === 'en' ? 'Choose country' : 'Pilih negara' }, { label: '03', value: lang() === 'en' ? 'Compare provider' : 'Bandingkan provider' }, { label: '04', value: lang() === 'en' ? 'Confirm & deduct balance' : 'Konfirmasi & potong saldo' }, { label: '05', value: lang() === 'en' ? 'Monitor SMS / OTP' : 'Pantau SMS / OTP' }] },
        { title: lang() === 'en' ? 'Backend state' : 'Status backend', items: [{ label: 'Wallet', value: serverReachable === false ? syncLabel : (lang() === 'en' ? 'Server-backed' : 'Sudah server') , tone: serverReachable === false ? 'warn' : 'good' }, { label: 'Midtrans', value: lang() === 'en' ? 'Sandbox · Core API channels awaiting activation' : 'Sandbox · channel Core API menunggu aktivasi', tone: 'warn' }, { label: lang() === 'en' ? 'Virtual-number supplier' : 'Supplier nomor virtual', value: lang() === 'en' ? 'Not connected yet' : 'Belum tersambung', tone: 'warn' }] },
      ],
    }
    if (page === 'security') return {
      eyebrow: 'SECURITY STATE', title: lang() === 'en' ? 'Security boundaries' : 'Batas keamanan sistem', subtitle: lang() === 'en' ? 'Which protections are server-side and which are still demo.' : 'Proteksi mana yang sudah server-side dan mana yang masih demo.',
      rail: [
        { label: 'Midtrans Server Key', value: 'Supabase Vault', tone: 'good' },
        { label: lang() === 'en' ? 'Payment verification' : 'Verifikasi pembayaran', value: 'Server webhook', tone: 'good' },
        { label: lang() === 'en' ? 'Account auth' : 'Auth akun', value: lang() === 'en' ? 'Browser demo' : 'Demo browser', tone: 'warn' },
        { label: 'Environment', value: 'Sandbox', tone: 'warn' },
      ],
      groups: [
        { title: lang() === 'en' ? 'Server-side protections' : 'Proteksi server-side', items: [{ label: 'Midtrans Server Key', value: lang() === 'en' ? 'Encrypted in Supabase Vault' : 'Terenkripsi di Supabase Vault', tone: 'good' }, { label: lang() === 'en' ? 'Wallet access token' : 'Token akses wallet', value: lang() === 'en' ? '256-bit random · SHA-256 hash on server' : 'Random 256-bit · hash SHA-256 di server', tone: 'good' }, { label: lang() === 'en' ? 'Payment crediting' : 'Kredit saldo', value: lang() === 'en' ? 'Webhook verified · idempotent' : 'Webhook terverifikasi · idempotent', tone: 'good' }] },
        { title: lang() === 'en' ? 'Browser-side state' : 'Status di browser', items: [{ label: lang() === 'en' ? 'Password demo' : 'Password demo', value: 'PBKDF2-SHA256 · 210,000 iterations' }, { label: lang() === 'en' ? 'Profile' : 'Profil', value: lang() === 'en' ? 'Stored on this device' : 'Disimpan di perangkat ini', tone: 'warn' }, { label: lang() === 'en' ? 'Session' : 'Sesi', value: lang() === 'en' ? 'sessionStorage · current tab' : 'sessionStorage · tab saat ini', tone: 'warn' }] },
        { title: lang() === 'en' ? 'Before production' : 'Sebelum production', items: [{ label: lang() === 'en' ? 'Account system' : 'Sistem akun', value: lang() === 'en' ? 'Move to server-side authentication' : 'Pindahkan ke autentikasi server', tone: 'warn' }, { label: lang() === 'en' ? 'Supplier credentials' : 'Kredensial supplier', value: lang() === 'en' ? 'Keep only on backend' : 'Simpan hanya di backend', tone: 'good' }, { label: lang() === 'en' ? 'Payment channels' : 'Channel pembayaran', value: lang() === 'en' ? 'Activate required Core API channels' : 'Aktifkan channel Core API yang diperlukan', tone: 'warn' }] },
      ],
    }
    return {
      eyebrow: 'ACTIVITY CONTEXT', title: lang() === 'en' ? 'Orders & payment activity' : 'Aktivitas order & pembayaran', subtitle: lang() === 'en' ? 'Current sessions, deposits, references and status.' : 'Sesi aktif, deposit, referensi, dan status dalam satu tempat.',
      rail: [
        { label: lang() === 'en' ? 'Active orders' : 'Order aktif', value: String(activeOrders.length) },
        { label: lang() === 'en' ? 'Paid deposits' : 'Deposit berhasil', value: String(paidDeposits.length), tone: paidDeposits.length ? 'good' : 'muted' },
        { label: lang() === 'en' ? 'Waiting' : 'Menunggu', value: String(pendingDeposits.length), tone: pendingDeposits.length ? 'warn' : 'muted' },
        { label: lang() === 'en' ? 'Balance' : 'Saldo', value: rupiah.format(currentBalance) },
      ],
      groups: [
        { title: lang() === 'en' ? 'Identity & wallet' : 'Identitas & wallet', items: [...commonIdentity.slice(0, 2), { label: lang() === 'en' ? 'Last sync' : 'Sinkron terakhir', value: formatDate(syncedAt) }] },
        { title: lang() === 'en' ? 'Order summary' : 'Ringkasan order', items: [{ label: lang() === 'en' ? 'Stored orders' : 'Order tersimpan', value: String(allOrders.length) }, { label: lang() === 'en' ? 'Active sessions' : 'Sesi aktif', value: String(activeOrders.length) }, { label: lang() === 'en' ? 'OTP received' : 'OTP diterima', value: String(receivedOrders.length) }, { label: lang() === 'en' ? 'Latest reference' : 'Referensi terbaru', value: lastOrder ? lastOrder.id : '—' }] },
        { title: lang() === 'en' ? 'Deposit summary' : 'Ringkasan deposit', items: [{ label: lang() === 'en' ? 'Successful' : 'Berhasil', value: String(paidDeposits.length), tone: 'good' }, { label: lang() === 'en' ? 'Waiting' : 'Menunggu', value: String(pendingDeposits.length), tone: pendingDeposits.length ? 'warn' : 'muted' }, { label: lang() === 'en' ? 'Failed / expired' : 'Gagal / kedaluwarsa', value: String(failedDeposits.length), tone: failedDeposits.length ? 'warn' : 'muted' }, { label: lang() === 'en' ? 'Latest deposit' : 'Deposit terbaru', value: lastDeposit ? `${method(lastDeposit.payment_type)} · ${lastDeposit.order_id}` : '—' }] },
      ],
    }
  }, [page, p, id, walletId, currentBalance, activeOrders.length, receivedOrders.length, allOrders.length, deposits, paidDeposits.length, pendingDeposits.length, failedDeposits.length, syncedAt, serverReachable, syncLabel, lastOrder, lastDeposit])

  const target = targetFor(page)
  return (
    <>
      {target ? createPortal(<ContextRail context={context} expanded={expanded} onToggle={() => setExpanded((value) => !value)} />, target) : null}
      {profileTarget ? createPortal(<ProfileSystemDetails walletId={walletId} deposits={deposits} syncedAt={syncedAt} />, profileTarget) : null}
    </>
  )
}
