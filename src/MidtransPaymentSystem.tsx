import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

type PaymentDetail = {
  kind: 'qris' | 'app' | 'va' | 'bill' | 'cstore' | 'redirect'
  qr_url?: string | null
  qr_string?: string | null
  deeplink_url?: string | null
  redirect_url?: string | null
  provider?: string | null
  bank?: string | null
  va_number?: string | null
  biller_code?: string | null
  bill_key?: string | null
  store?: string | null
  payment_code?: string | null
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
type CategoryId = 'wallet' | 'bank' | 'retail' | 'paylater' | 'card'
type MethodId =
  | 'qris' | 'gopay' | 'shopeepay' | 'dana' | 'ovo'
  | 'bca' | 'bni' | 'bri' | 'permata' | 'mandiri' | 'cimb' | 'danamon' | 'bsi' | 'seabank' | 'saqu'
  | 'indomaret' | 'alfamart'
  | 'akulaku' | 'kredivo'
  | 'card'

type Method = {
  id: MethodId
  title: string
  subtitle: string
  category: CategoryId
  fallback: string
  networks?: string[]
  special?: boolean
}

const API_BASE = 'https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1'
const TOKEN_KEY = 'dlavie-wallet-token-v1'
const STATE_EVENT = 'dlavie:state-changed'
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

const methods: Method[] = [
  { id: 'qris', title: 'QRIS', subtitle: 'Scan dari aplikasi QRIS apa pun', category: 'wallet', fallback: 'QRIS' },
  { id: 'gopay', title: 'GoPay', subtitle: 'GoPay / Gojek', category: 'wallet', fallback: 'gopay' },
  { id: 'shopeepay', title: 'ShopeePay', subtitle: 'Bayar melalui ShopeePay', category: 'wallet', fallback: 'ShopeePay' },
  { id: 'dana', title: 'DANA', subtitle: 'Bayar melalui aplikasi DANA', category: 'wallet', fallback: 'DANA' },
  { id: 'ovo', title: 'OVO', subtitle: 'Tersedia di Midtrans · flow khusus', category: 'wallet', fallback: 'OVO', special: true },

  { id: 'bca', title: 'BCA Virtual Account', subtitle: 'Transfer melalui BCA', category: 'bank', fallback: 'BCA' },
  { id: 'mandiri', title: 'Mandiri Bill Payment', subtitle: 'Bill Key + Biller Code', category: 'bank', fallback: 'mandiri' },
  { id: 'bni', title: 'BNI Virtual Account', subtitle: 'Transfer melalui BNI', category: 'bank', fallback: 'BNI' },
  { id: 'bri', title: 'BRI Virtual Account', subtitle: 'Transfer melalui BRI', category: 'bank', fallback: 'BRI' },
  { id: 'permata', title: 'Permata Virtual Account', subtitle: 'Transfer melalui Permata', category: 'bank', fallback: 'Permata' },
  { id: 'cimb', title: 'CIMB Niaga Virtual Account', subtitle: 'Transfer melalui CIMB Niaga', category: 'bank', fallback: 'CIMB' },
  { id: 'danamon', title: 'Danamon Virtual Account', subtitle: 'Transfer melalui Danamon', category: 'bank', fallback: 'Danamon' },
  { id: 'bsi', title: 'BSI Virtual Account', subtitle: 'Bank Syariah Indonesia', category: 'bank', fallback: 'BSI' },
  { id: 'seabank', title: 'SeaBank Virtual Account', subtitle: 'Transfer melalui SeaBank', category: 'bank', fallback: 'SeaBank' },
  { id: 'saqu', title: 'Bank Saqu Virtual Account', subtitle: 'Transfer melalui Bank Saqu', category: 'bank', fallback: 'Saqu' },

  { id: 'indomaret', title: 'Indomaret', subtitle: 'Bayar dengan kode di gerai Indomaret', category: 'retail', fallback: 'Indomaret' },
  { id: 'alfamart', title: 'Alfamart', subtitle: 'Alfamart · Alfamidi · DAN+DAN', category: 'retail', fallback: 'Alfamart' },

  { id: 'akulaku', title: 'Akulaku PayLater', subtitle: 'Cicilan melalui Akulaku', category: 'paylater', fallback: 'Akulaku' },
  { id: 'kredivo', title: 'Kredivo', subtitle: 'Bayar nanti / cicilan Kredivo', category: 'paylater', fallback: 'Kredivo' },

  { id: 'card', title: 'Kartu Debit / Kredit', subtitle: 'Visa · Mastercard · JCB · American Express', category: 'card', fallback: 'CARD', special: true, networks: ['VISA', 'Mastercard', 'JCB', 'AMEX'] },
]

const categories: Array<{ id: CategoryId; label: string; en: string }> = [
  { id: 'wallet', label: 'E-Wallet & QR', en: 'E-Wallet & QR' },
  { id: 'bank', label: 'Bank', en: 'Bank' },
  { id: 'retail', label: 'Retail', en: 'Retail' },
  { id: 'paylater', label: 'PayLater', en: 'PayLater' },
  { id: 'card', label: 'Kartu', en: 'Cards' },
]

function BrandLogo({ method }: { method: Method }) {
  return (
    <span className="dlv-brand-logo" data-brand={method.id} aria-hidden="true">
      <b>{method.fallback}</b>
    </span>
  )
}

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
  const [category, setCategory] = useState<CategoryId>('wallet')
  const [active, setActive] = useState<Deposit | null>(null)
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const [historyOpen, setHistoryOpen] = useState(false)
  const [lang, setLang] = useState<'id' | 'en'>(() => language())

  const copy = useMemo(() => lang === 'en' ? {
    eyebrow: 'DLAVIE PAY · SANDBOX', title: 'Add wallet balance', body: 'Choose a payment method without leaving the DLavie interface. Midtrans processes the transaction in the background.',
    sandbox: 'Sandbox mode · no real money is used.', balance: 'Server balance', refresh: 'Refresh', checking: 'Checking…', amount: 'Deposit amount', method: 'Payment method', pay: 'Continue with', creating: 'Preparing…',
    availability: 'Only channels activated on this Midtrans merchant can be used.', inactive: 'This payment channel is not activated on your Midtrans merchant yet.', special: 'This method needs an additional secure flow before it can be enabled in DLavie.',
    failed: 'Payment could not be created.', min: 'Minimum deposit is Rp1,000.', back: 'Choose another method', copy: 'Copy', pending: 'Waiting for payment', paid: 'Payment received', expired: 'Expired', openProvider: 'Open payment app',
    qrisHelp: 'Scan this QR with a QRIS-compatible banking or e-wallet app.', vaHelp: 'Transfer the exact amount to this virtual account before the timer expires.', appHelp: 'Continue in the payment app or scan the QR from another device.', retailHelp: 'Show this payment code at the selected retail counter.', billHelp: 'Use the Biller Code and Bill Key in Mandiri Bill Payment.', redirectHelp: 'Continue to the provider to complete the payment.', recent: 'Recent deposits', none: 'No deposits yet.', order: 'Order ID', expires: 'Expires in', showHistory: 'Show deposit history', hideHistory: 'Hide deposit history',
  } : {
    eyebrow: 'DLAVIE PAY · SANDBOX', title: 'Isi saldo wallet', body: 'Pilih metode pembayaran tanpa keluar dari antarmuka DLavie. Midtrans hanya memproses transaksi di belakang layar.',
    sandbox: 'Mode Sandbox · tidak menggunakan uang sungguhan.', balance: 'Saldo server', refresh: 'Perbarui', checking: 'Memeriksa…', amount: 'Nominal deposit', method: 'Metode pembayaran', pay: 'Lanjut dengan', creating: 'Menyiapkan…',
    availability: 'Hanya channel yang aktif pada merchant Midtrans ini yang dapat digunakan.', inactive: 'Channel pembayaran ini belum diaktifkan pada merchant Midtrans kamu.', special: 'Metode ini membutuhkan flow keamanan tambahan sebelum bisa diaktifkan di DLavie.',
    failed: 'Pembayaran belum bisa dibuat.', min: 'Minimum deposit adalah Rp1.000.', back: 'Pilih metode lain', copy: 'Salin', pending: 'Menunggu pembayaran', paid: 'Pembayaran diterima', expired: 'Kedaluwarsa', openProvider: 'Buka aplikasi pembayaran',
    qrisHelp: 'Scan QR ini dengan aplikasi bank atau e-wallet yang mendukung QRIS.', vaHelp: 'Transfer nominal yang sama persis ke virtual account ini sebelum waktu habis.', appHelp: 'Lanjutkan lewat aplikasi pembayaran, atau scan QR dari perangkat lain.', retailHelp: 'Tunjukkan kode pembayaran ini di kasir retail yang dipilih.', billHelp: 'Gunakan Biller Code dan Bill Key pada Mandiri Bill Payment.', redirectHelp: 'Lanjutkan ke penyedia untuk menyelesaikan pembayaran.', recent: 'Deposit terbaru', none: 'Belum ada deposit.', order: 'Order ID', expires: 'Berakhir dalam', showHistory: 'Lihat riwayat deposit', hideHistory: 'Tutup riwayat deposit',
  }, [lang])

  const selectedMethod = useMemo(() => methods.find((item) => item.id === selected) || methods[0], [selected])
  const visibleMethods = useMemo(() => methods.filter((item) => item.category === category), [category])

  const switchCategory = (next: CategoryId) => {
    setCategory(next)
    const first = methods.find((item) => item.category === next)
    if (first && first.category !== selectedMethod.category) setSelected(first.id)
    setError('')
  }

  const applyWallet = useCallback((data: WalletResponse) => {
    if (typeof data.balance === 'number') {
      setBalance(data.balance)
      localStorage.setItem('dlavie-balance', String(data.balance))
      window.dispatchEvent(new CustomEvent(STATE_EVENT))
    }
    const list = Array.isArray(data.deposits) ? data.deposits : []
    setDeposits(list)
    setActive((current) => current ? (list.find((item) => item.order_id === current.order_id) || current) : current)
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
        if (data.error === 'special_flow_required') setError(`${copy.special}${data.message ? ` ${data.message}` : ''}`)
        else if (data.status === 402 || data.message?.toLowerCase().includes('not activated')) setError(copy.inactive)
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
  const statusText = (status: Deposit['status']) => status === 'paid' ? copy.paid : status === 'expired' ? copy.expired : status === 'failed' || status === 'denied' || status === 'cancelled' ? copy.failed : copy.pending

  const renderPaymentDetail = () => {
    const payment = active?.payment_detail
    if (!active || !payment) return null

    if (payment.kind === 'qris') return (
      <div className="dlv-focus-detail">
        <p>{copy.qrisHelp}</p>
        {payment.qr_url && <div className="dlv-qr-wrap"><img src={payment.qr_url} alt="QRIS" /></div>}
      </div>
    )

    if (payment.kind === 'va') return (
      <div className="dlv-focus-detail">
        <p>{copy.vaHelp}</p>
        <div className="dlv-code-line"><span>{activeMethod?.title || payment.bank}</span><strong>{payment.va_number}</strong><button type="button" onClick={() => void copyText(payment.va_number)}>{copy.copy}</button></div>
      </div>
    )

    if (payment.kind === 'bill') return (
      <div className="dlv-focus-detail">
        <p>{copy.billHelp}</p>
        <div className="dlv-dual-code"><span><small>Biller Code</small><strong>{payment.biller_code}</strong><button type="button" onClick={() => void copyText(payment.biller_code)}>{copy.copy}</button></span><span><small>Bill Key</small><strong>{payment.bill_key}</strong><button type="button" onClick={() => void copyText(payment.bill_key)}>{copy.copy}</button></span></div>
      </div>
    )

    if (payment.kind === 'cstore') return (
      <div className="dlv-focus-detail">
        <p>{copy.retailHelp}</p>
        <div className="dlv-code-line"><span>{activeMethod?.title || payment.store}</span><strong>{payment.payment_code}</strong><button type="button" onClick={() => void copyText(payment.payment_code)}>{copy.copy}</button></div>
      </div>
    )

    const url = payment.deeplink_url || payment.redirect_url
    return (
      <div className="dlv-focus-detail">
        <p>{payment.kind === 'redirect' ? copy.redirectHelp : copy.appHelp}</p>
        {payment.qr_url && <div className="dlv-qr-wrap"><img src={payment.qr_url} alt="Payment QR" /></div>}
        {url && <a className="midtrans-pay dlv-open-provider" href={url}><span>{copy.openProvider}</span><b>↗</b></a>}
      </div>
    )
  }

  return !open ? null : (
    <div className="midtrans-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <section className="midtrans-sheet dlv-pay-sheet" aria-label={copy.title}>
        <button className="midtrans-close dlv-pay-close" type="button" onClick={() => setOpen(false)} aria-label="Close">×</button>

        <div className="dlv-pay-topline">
          <div className="midtrans-head dlv-pay-head">
            <span className="midtrans-mark dlv-pay-mark">D</span>
            <div><small>{copy.eyebrow}</small><h2>{copy.title}</h2><p>{copy.body}</p></div>
          </div>
        </div>

        <div className="dlv-balance-bar">
          <span><small>{copy.balance}</small><strong>{rupiah.format(balance)}</strong></span>
          <button type="button" onClick={() => void syncWallet().catch(() => undefined)} aria-label={copy.refresh}>{syncing ? '···' : '↻'}</button>
        </div>

        <div className="dlv-sandbox-strip"><i />{copy.sandbox}<span>{copy.availability}</span></div>

        {active ? (
          <div className="dlv-payment-stage">
            <div className={`dlv-payment-status status-${active.status}`}>
              <i /><span><small>{activeMethod?.title || active.payment_type}</small><strong>{statusText(active.status)}</strong></span><b>{active.status === 'pending' ? formatTime(remaining) : active.status === 'paid' ? '✓' : '—'}</b>
            </div>
            <div className="dlv-payment-total"><span>{rupiah.format(active.amount)}</span><small>{copy.order} · {active.order_id}</small></div>
            {renderPaymentDetail()}
            <div className="dlv-expiry-row"><span>{copy.expires}</span><strong>{active.status === 'pending' ? formatTime(remaining) : statusText(active.status)}</strong></div>
            <button className="dlv-back-method" type="button" onClick={() => { setActive(null); setError('') }}>{copy.back}</button>
          </div>
        ) : (
          <form className="dlv-core-form" onSubmit={createPayment}>
            <label className="dlv-amount-minimal">
              <span>{copy.amount}</span>
              <div><b>Rp</b><input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))} /></div>
            </label>

            <div className="dlv-presets-line">
              {[1000, 5000, 10000, 25000, 50000, 100000].map((value) => <button type="button" key={value} className={Number(amount) === value ? 'active' : ''} onClick={() => setAmount(String(value))}>{rupiah.format(value)}</button>)}
            </div>

            <div className="dlv-method-heading"><span>{copy.method}</span><strong>{visibleMethods.length} opsi</strong></div>
            <div className="dlv-category-strip" role="tablist" aria-label="Payment categories">
              {categories.map((item) => <button key={item.id} type="button" className={category === item.id ? 'active' : ''} onClick={() => switchCategory(item.id)}>{lang === 'en' ? item.en : item.label}</button>)}
            </div>

            <div className="dlv-method-list">
              {visibleMethods.map((method) => (
                <button type="button" key={method.id} className={`dlv-method-row ${selected === method.id ? 'active' : ''}`} onClick={() => { setSelected(method.id); setError('') }}>
                  <BrandLogo method={method} />
                  <span className="dlv-method-copy"><strong>{method.title}</strong><small>{method.subtitle}</small></span>
                  {method.networks ? <span className="dlv-network-logos">{method.networks.map((network) => <b key={network} data-network={network.toLowerCase()}>{network}</b>)}</span> : null}
                  <span className="dlv-method-state">{selected === method.id ? '✓' : '›'}</span>
                </button>
              ))}
            </div>

            <div className="dlv-selection-summary">
              <BrandLogo method={selectedMethod} />
              <span><small>{copy.pay}</small><strong>{selectedMethod.title}</strong></span>
              <b>{rupiah.format(Number(amount || 0))}</b>
            </div>

            {error && <div className="midtrans-error dlv-core-error">{error}</div>}
            <button className="midtrans-pay dlv-main-pay" type="submit" disabled={busy}><span>{busy ? copy.creating : `${copy.pay} ${selectedMethod.title}`}</span><b>→</b></button>
          </form>
        )}

        <div className={`dlv-history-collapsible ${historyOpen ? 'open' : ''}`}>
          <button className="dlv-history-toggle" type="button" onClick={() => setHistoryOpen((value) => !value)}><span>{historyOpen ? copy.hideHistory : copy.showHistory}</span><b>{deposits.length}</b><i>{historyOpen ? '−' : '+'}</i></button>
          {historyOpen && <div className="dlv-history-list">{deposits.length ? deposits.slice(0, 8).map((deposit) => (
            <button type="button" className="dlv-history-row" key={deposit.order_id} onClick={() => deposit.payment_detail && setActive(deposit)}>
              <span><strong>{rupiah.format(deposit.amount)}</strong><small>{methods.find((method) => method.id === deposit.payment_type)?.title || deposit.payment_type || 'Payment'}</small></span>
              <b className={`status-${deposit.status}`}>{statusText(deposit.status)}</b>
            </button>
          )) : <p className="midtrans-empty">{copy.none}</p>}</div>}
        </div>
      </section>
    </div>
  )
}
