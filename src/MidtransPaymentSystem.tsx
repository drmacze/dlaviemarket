import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

type PaymentDetail = {
  kind: 'qris' | 'gopay' | 'va'
  qr_url?: string | null
  qr_string?: string | null
  deeplink_url?: string | null
  bank?: string | null
  va_number?: string | null
}

type Deposit = {
  order_id: string
  amount: number
  status: 'created' | 'pending' | 'paid' | 'expired' | 'cancelled' | 'failed' | 'denied'
  payment_type?: string | null
  payment_detail?: PaymentDetail | null
  expires_at?: string | null
  created_at: string
  updated_at: string
  credited_at?: string | null
}

type WalletResponse = {
  ok?: boolean
  wallet_token?: string | null
  balance?: number
  deposits?: Deposit[]
  error?: string
}

type ChargeResponse = {
  ok?: boolean
  order_id?: string
  amount?: number
  method?: string
  payment?: PaymentDetail
  expires_at?: string
  error?: string
  status?: number
  message?: string | null
}

type Profile = { username?: string; email?: string }
type MethodId = 'qris' | 'gopay' | 'bca' | 'bni' | 'bri' | 'permata'

const API_BASE = 'https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1'
const TOKEN_KEY = 'dlavie-wallet-token-v1'
const STATE_EVENT = 'dlavie:state-changed'
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

const methods: Array<{ id: MethodId; title: string; subtitle: string; badge: string }> = [
  { id: 'qris', title: 'QRIS', subtitle: 'Semua aplikasi QRIS', badge: 'QR' },
  { id: 'gopay', title: 'GoPay', subtitle: 'Buka GoPay / Gojek', badge: 'GP' },
  { id: 'bca', title: 'BCA Virtual Account', subtitle: 'Transfer lewat BCA', badge: 'BCA' },
  { id: 'bni', title: 'BNI Virtual Account', subtitle: 'Transfer lewat BNI', badge: 'BNI' },
  { id: 'bri', title: 'BRI Virtual Account', subtitle: 'Transfer lewat BRI', badge: 'BRI' },
  { id: 'permata', title: 'Permata Virtual Account', subtitle: 'Transfer lewat Permata', badge: 'P' },
]

function readProfile(): Profile | null {
  try { return JSON.parse(localStorage.getItem('dlavie-account-profile-v1') || 'null') as Profile | null } catch { return null }
}
function language() { return localStorage.getItem('dlavie-language') === 'en' ? 'en' : 'id' }
function createWalletToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return `dlv_${btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')}`
}
function getWalletToken() {
  let token = localStorage.getItem(TOKEN_KEY)
  if (!token) { token = createWalletToken(); localStorage.setItem(TOKEN_KEY, token) }
  return token
}
function localBalance() {
  const value = Number(localStorage.getItem('dlavie-balance') || 0)
  return Number.isFinite(value) ? value : 0
}
function formatTime(ms: number) {
  if (ms <= 0) return '00:00'
  const total = Math.floor(ms / 1000)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export default function MidtransPaymentSystem() {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('10000')
  const [balance, setBalance] = useState(() => localBalance())
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [selected, setSelected] = useState<MethodId>('qris')
  const [active, setActive] = useState<Deposit | null>(null)
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const [lang, setLang] = useState<'id' | 'en'>(() => language())

  const copy = useMemo(() => lang === 'en' ? {
    eyebrow: 'DLAVIE PAY · SANDBOX', title: 'Add wallet balance', body: 'Payment runs inside DLavie. Midtrans Core API only processes the transaction in the background.',
    sandbox: 'Sandbox mode. No real money is used.', balance: 'Server balance', refresh: 'Refresh', checking: 'Checking…', amount: 'Deposit amount', method: 'Payment method', pay: 'Create payment', creating: 'Creating payment…',
    inactive: 'Midtrans Core API payment channels are not activated for this merchant yet. The DLavie checkout is ready, but Midtrans must activate Core API channels before this method can be charged.',
    failed: 'Payment could not be created.', min: 'Minimum deposit is Rp1,000.', back: 'Choose another method', copy: 'Copy', copied: 'Copied', pending: 'Waiting for payment', paid: 'Payment received', expired: 'Expired', openGopay: 'Open GoPay',
    qrisHelp: 'Scan this QR with any QRIS-compatible banking or e-wallet app.', vaHelp: 'Transfer exactly to this virtual account number before the timer expires.', gopayHelp: 'Open GoPay/Gojek to complete the payment, or scan the QR from another device.', recent: 'Recent deposits', none: 'No deposits yet.', order: 'Order ID', expires: 'Expires in',
  } : {
    eyebrow: 'DLAVIE PAY · SANDBOX', title: 'Isi saldo wallet', body: 'Pembayaran berjalan di dalam DLavie. Midtrans Core API hanya memproses transaksi di belakang layar.',
    sandbox: 'Mode Sandbox. Tidak menggunakan uang sungguhan.', balance: 'Saldo server', refresh: 'Perbarui', checking: 'Memeriksa…', amount: 'Nominal deposit', method: 'Metode pembayaran', pay: 'Buat pembayaran', creating: 'Membuat pembayaran…',
    inactive: 'Channel pembayaran Midtrans Core API belum diaktifkan untuk merchant ini. Tampilan DLavie sudah siap, tetapi Midtrans harus mengaktifkan channel Core API sebelum metode ini bisa dipakai.',
    failed: 'Pembayaran belum bisa dibuat.', min: 'Minimum deposit adalah Rp1.000.', back: 'Pilih metode lain', copy: 'Salin', copied: 'Tersalin', pending: 'Menunggu pembayaran', paid: 'Pembayaran diterima', expired: 'Kedaluwarsa', openGopay: 'Buka GoPay',
    qrisHelp: 'Scan QR ini dengan aplikasi bank atau e-wallet yang mendukung QRIS.', vaHelp: 'Transfer dengan nominal yang sama persis ke nomor virtual account ini sebelum waktu habis.', gopayHelp: 'Buka GoPay/Gojek untuk menyelesaikan pembayaran, atau scan QR dari perangkat lain.', recent: 'Deposit terbaru', none: 'Belum ada deposit.', order: 'Order ID', expires: 'Berakhir dalam',
  }, [lang])

  const applyWallet = useCallback((data: WalletResponse) => {
    if (typeof data.balance === 'number') {
      setBalance(data.balance)
      localStorage.setItem('dlavie-balance', String(data.balance))
      window.dispatchEvent(new CustomEvent(STATE_EVENT))
    }
    const list = Array.isArray(data.deposits) ? data.deposits : []
    setDeposits(list)
    setActive((current) => {
      if (!current) return current
      return list.find((item) => item.order_id === current.order_id) || current
    })
  }, [])

  const walletRequest = useCallback(async (action: 'ensure' | 'status') => {
    const body = new URLSearchParams({ action, wallet_token: getWalletToken() })
    const response = await fetch(`${API_BASE}/dlavie-wallet`, { method: 'POST', body })
    const data = await response.json().catch(() => ({})) as WalletResponse
    if (!response.ok || !data.ok) throw new Error(data.error || 'wallet_error')
    applyWallet(data)
    return data
  }, [applyWallet])

  const syncWallet = useCallback(async () => {
    setSyncing(true)
    try { return await walletRequest('status') }
    catch { return await walletRequest('ensure') }
    finally { setSyncing(false) }
  }, [walletRequest])

  useEffect(() => {
    const intercept = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const trigger = target.closest('.balance-pill, .hero-actions .button-secondary, .window-balance button, .order-center-balance button')
      if (!trigger) return
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation()
      setLang(language()); setError(''); setActive(null); setOpen(true)
      void syncWallet().catch(() => undefined)
    }
    document.addEventListener('click', intercept, true)
    return () => document.removeEventListener('click', intercept, true)
  }, [syncWallet])

  useEffect(() => {
    if (!open) return
    document.documentElement.classList.add('midtrans-open')
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', close)
    return () => { document.documentElement.classList.remove('midtrans-open'); document.removeEventListener('keydown', close); window.clearInterval(timer) }
  }, [open])

  useEffect(() => {
    if (!active || active.status !== 'pending') return
    const timer = window.setInterval(() => void syncWallet().catch(() => undefined), 4500)
    return () => window.clearInterval(timer)
  }, [active, syncWallet])

  const createPayment = async (event: FormEvent) => {
    event.preventDefault()
    const numeric = Number(amount.replace(/\D/g, ''))
    if (!Number.isInteger(numeric) || numeric < 1000) { setError(copy.min); return }
    setBusy(true); setError('')
    try {
      const profile = readProfile()
      const body = new URLSearchParams({
        wallet_token: getWalletToken(), amount: String(numeric), method: selected,
        customer_name: profile?.username || '', customer_email: profile?.email || '',
      })
      const response = await fetch(`${API_BASE}/dlavie-create-payment`, { method: 'POST', body })
      const data = await response.json().catch(() => ({})) as ChargeResponse
      if (!response.ok || !data.ok || !data.order_id || !data.payment) {
        if (data.status === 402 || data.message?.toLowerCase().includes('not activated')) setError(copy.inactive)
        else setError(`${copy.failed}${data.message ? ` ${data.message}` : ''}`)
        return
      }
      const item: Deposit = {
        order_id: data.order_id, amount: data.amount || numeric, status: 'pending', payment_type: data.method || selected,
        payment_detail: data.payment, expires_at: data.expires_at || null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }
      setActive(item)
      setDeposits((old) => [item, ...old.filter((x) => x.order_id !== item.order_id)])
      void syncWallet().catch(() => undefined)
    } catch {
      setError(copy.failed)
    } finally { setBusy(false) }
  }

  const copyText = async (value?: string | null) => {
    if (!value) return
    try { await navigator.clipboard.writeText(value) } catch {
      const area = document.createElement('textarea'); area.value = value; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove()
    }
  }

  const remaining = active?.expires_at ? new Date(active.expires_at).getTime() - now : 0
  const activeMethod = methods.find((method) => method.id === active?.payment_type)
  const statusText = (status: Deposit['status']) => status === 'paid' ? copy.paid : status === 'expired' ? copy.expired : copy.pending

  return !open ? null : (
    <div className="midtrans-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <section className="midtrans-sheet dlv-pay-sheet" aria-label={copy.title}>
        <button className="midtrans-close" type="button" onClick={() => setOpen(false)} aria-label="Close">×</button>
        <div className="midtrans-head dlv-pay-head">
          <span className="midtrans-mark dlv-pay-mark">D</span>
          <div><small>{copy.eyebrow}</small><h2>{copy.title}</h2><p>{copy.body}</p></div>
        </div>
        <div className="midtrans-live-note dlv-sandbox-note"><i />{copy.sandbox}</div>
        <div className="midtrans-balance">
          <span>{copy.balance}</span><strong>{rupiah.format(balance)}</strong>
          <button type="button" onClick={() => void syncWallet().catch(() => undefined)}>{syncing ? copy.checking : copy.refresh}</button>
        </div>

        {!active ? (
          <form onSubmit={createPayment} className="dlv-core-form">
            <label><span>{copy.amount}</span><div className="midtrans-amount"><b>Rp</b><input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))} /></div></label>
            <div className="midtrans-presets">{[1000, 5000, 10000, 25000, 50000, 100000].map((value) => <button type="button" key={value} className={Number(amount) === value ? 'active' : ''} onClick={() => setAmount(String(value))}>{rupiah.format(value)}</button>)}</div>
            <span className="dlv-method-label">{copy.method}</span>
            <div className="dlv-method-grid">
              {methods.map((method) => <button type="button" key={method.id} className={`dlv-method ${selected === method.id ? 'active' : ''}`} onClick={() => { setSelected(method.id); setError('') }}>
                <b>{method.badge}</b><span><strong>{method.title}</strong><small>{method.subtitle}</small></span><i>›</i>
              </button>)}
            </div>
            {error && <div className="midtrans-error dlv-core-error">{error}</div>}
            <button className="midtrans-pay" type="submit" disabled={busy}>{busy ? copy.creating : copy.pay}<span>→</span></button>
          </form>
        ) : (
          <div className="dlv-payment-stage">
            <div className={`dlv-payment-status status-${active.status}`}><i /><span><small>{activeMethod?.title || active.payment_type}</small><strong>{statusText(active.status)}</strong></span><b>{active.status === 'pending' ? formatTime(remaining) : active.status === 'paid' ? '✓' : '—'}</b></div>
            <div className="dlv-payment-total"><span>{rupiah.format(active.amount)}</span><small>{copy.order} · {active.order_id}</small></div>

            {active.payment_detail?.kind === 'qris' && <div className="dlv-qris-panel">
              <p>{copy.qrisHelp}</p>{active.payment_detail.qr_url && <div className="dlv-qr-wrap"><img src={active.payment_detail.qr_url} alt="QRIS pembayaran DLavie" /></div>}
              {active.payment_detail.qr_string && <button type="button" className="dlv-copy-wide" onClick={() => void copyText(active.payment_detail?.qr_string)}>{copy.copy} QRIS</button>}
            </div>}

            {active.payment_detail?.kind === 'gopay' && <div className="dlv-qris-panel">
              <p>{copy.gopayHelp}</p>{active.payment_detail.qr_url && <div className="dlv-qr-wrap"><img src={active.payment_detail.qr_url} alt="QR GoPay DLavie" /></div>}
              {active.payment_detail.deeplink_url && <button type="button" className="midtrans-pay dlv-open-app" onClick={() => { window.location.href = active.payment_detail?.deeplink_url || '#' }}>{copy.openGopay}<span>↗</span></button>}
            </div>}

            {active.payment_detail?.kind === 'va' && <div className="dlv-va-panel">
              <p>{copy.vaHelp}</p><small>{activeMethod?.title || active.payment_detail.bank}</small>
              <div className="dlv-va-number"><strong>{active.payment_detail.va_number}</strong><button type="button" onClick={() => void copyText(active.payment_detail?.va_number)}>{copy.copy}</button></div>
            </div>}

            {active.status === 'pending' && <div className="dlv-expiry-row"><span>{copy.expires}</span><strong>{formatTime(remaining)}</strong></div>}
            <button type="button" className="dlv-back-method" onClick={() => { setActive(null); setError('') }}>← {copy.back}</button>
          </div>
        )}

        <div className="midtrans-history">
          <div className="midtrans-history-head"><strong>{copy.recent}</strong><span>{deposits.length}</span></div>
          {deposits.length ? deposits.slice(0, 5).map((deposit) => <button type="button" className="midtrans-deposit dlv-history-button" key={deposit.order_id} onClick={() => deposit.payment_detail && setActive(deposit)}>
            <span><strong>{rupiah.format(deposit.amount)}</strong><small>{deposit.payment_type?.toUpperCase() || 'PAYMENT'} · {deposit.order_id}</small></span><b className={`status-${deposit.status}`}>{statusText(deposit.status)}</b>
          </button>) : <p className="midtrans-empty">{copy.none}</p>}
        </div>
      </section>
    </div>
  )
}
