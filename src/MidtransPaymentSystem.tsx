import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

type Deposit = {
  order_id: string
  amount: number
  status: 'created' | 'pending' | 'paid' | 'expired' | 'cancelled' | 'failed' | 'denied'
  redirect_url?: string | null
  created_at: string
  updated_at: string
  credited_at?: string | null
}

type WalletResponse = {
  ok?: boolean
  wallet_id?: string
  wallet_token?: string | null
  balance?: number
  deposits?: Deposit[]
  error?: string
}

type PaymentResponse = {
  ok?: boolean
  environment?: string
  redirect_url?: string
  order_id?: string
  error?: string
  status?: number
}

type Profile = { username?: string; email?: string }

const API_BASE = 'https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1'
const TOKEN_KEY = 'dlavie-wallet-token-v1'
const STATE_EVENT = 'dlavie:state-changed'
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

function readProfile(): Profile | null {
  try { return JSON.parse(localStorage.getItem('dlavie-account-profile-v1') || 'null') as Profile | null } catch { return null }
}

function language() {
  return localStorage.getItem('dlavie-language') === 'en' ? 'en' : 'id'
}

export default function MidtransPaymentSystem() {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('10000')
  const [balance, setBalance] = useState<number | null>(null)
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [lang, setLang] = useState<'id' | 'en'>(() => language())

  const copy = useMemo(() => lang === 'en' ? {
    title: 'Add wallet balance',
    eyebrow: 'MIDTRANS · SANDBOX',
    body: 'Test payments through Midtrans Sandbox. Your wallet is credited only after the payment is verified by the server.',
    amount: 'Deposit amount',
    pay: 'Continue to Midtrans Sandbox',
    processing: 'Creating test payment…',
    current: 'Server balance',
    refresh: 'Refresh status',
    recent: 'Recent deposits',
    none: 'No Midtrans Sandbox deposits yet.',
    live: 'Sandbox mode is active. Payments here are for testing and do not use real money.',
    invalid: 'Minimum deposit is Rp1,000.',
    failed: 'Could not create the Midtrans Sandbox payment. Try again in a moment.',
    failedCode: 'Payment request failed',
    connection: 'Could not reach the payment server. Check your connection and try again.',
    syncing: 'Checking…',
    pending: 'Pending', paid: 'Paid', expired: 'Expired', cancelled: 'Cancelled', failedStatus: 'Failed', denied: 'Denied', created: 'Created',
  } : {
    title: 'Isi saldo wallet',
    eyebrow: 'MIDTRANS · SANDBOX',
    body: 'Pembayaran percobaan melalui Midtrans Sandbox. Saldo hanya ditambahkan setelah pembayaran diverifikasi oleh server.',
    amount: 'Nominal deposit',
    pay: 'Lanjut ke Midtrans Sandbox',
    processing: 'Membuat pembayaran uji…',
    current: 'Saldo server',
    refresh: 'Perbarui status',
    recent: 'Deposit terbaru',
    none: 'Belum ada deposit Midtrans Sandbox.',
    live: 'Mode Sandbox aktif. Pembayaran di sini hanya untuk pengujian dan tidak menggunakan uang sungguhan.',
    invalid: 'Minimum deposit adalah Rp1.000.',
    failed: 'Pembayaran Midtrans Sandbox belum bisa dibuat. Coba lagi sebentar.',
    failedCode: 'Permintaan pembayaran gagal',
    connection: 'Server pembayaran tidak dapat dijangkau. Periksa koneksi lalu coba lagi.',
    syncing: 'Memeriksa…',
    pending: 'Menunggu', paid: 'Berhasil', expired: 'Kedaluwarsa', cancelled: 'Dibatalkan', failedStatus: 'Gagal', denied: 'Ditolak', created: 'Dibuat',
  }, [lang])

  const applyWallet = useCallback((data: WalletResponse) => {
    if (typeof data.balance === 'number') {
      setBalance(data.balance)
      const current = Number(localStorage.getItem('dlavie-balance') || 0)
      if (current !== data.balance) {
        localStorage.setItem('dlavie-balance', String(data.balance))
        window.dispatchEvent(new CustomEvent(STATE_EVENT))
      }
    }
    setDeposits(Array.isArray(data.deposits) ? data.deposits : [])
  }, [])

  const walletRequest = useCallback(async (action: 'ensure' | 'status', token?: string | null) => {
    const response = await fetch(`${API_BASE}/dlavie-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-dlavie-wallet-token': token } : {}),
      },
      body: JSON.stringify({ action }),
    })
    const data = await response.json().catch(() => ({})) as WalletResponse
    return { response, data }
  }, [])

  const ensureWallet = useCallback(async () => {
    let token = localStorage.getItem(TOKEN_KEY)
    let result = await walletRequest('ensure', token)
    if (result.response.status === 401 && token) {
      localStorage.removeItem(TOKEN_KEY)
      token = null
      result = await walletRequest('ensure', null)
    }
    if (!result.response.ok || !result.data.ok) throw new Error(result.data.error || 'wallet_error')
    if (result.data.wallet_token) {
      token = result.data.wallet_token
      localStorage.setItem(TOKEN_KEY, token)
    }
    if (!token) throw new Error('wallet_token_missing')
    applyWallet(result.data)
    return token
  }, [applyWallet, walletRequest])

  const syncWallet = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return ensureWallet()
    setSyncing(true)
    try {
      const result = await walletRequest('status', token)
      if (result.response.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        return await ensureWallet()
      }
      if (!result.response.ok || !result.data.ok) throw new Error(result.data.error || 'wallet_status_error')
      applyWallet(result.data)
      return token
    } finally {
      setSyncing(false)
    }
  }, [applyWallet, ensureWallet, walletRequest])

  const paymentRequest = useCallback(async (token: string, numeric: number, profile: Profile | null) => {
    const response = await fetch(`${API_BASE}/dlavie-create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-dlavie-wallet-token': token },
      body: JSON.stringify({ amount: numeric, customer: { name: profile?.username, email: profile?.email } }),
    })
    const data = await response.json().catch(() => ({})) as PaymentResponse
    return { response, data }
  }, [])

  useEffect(() => {
    const intercept = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const depositTrigger = target.closest('.balance-pill, .hero-actions .button-secondary, .window-balance button, .order-center-balance button')
      if (!depositTrigger) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      setLang(language())
      setError('')
      setOpen(true)
      void syncWallet().catch(() => setError(copy.failed))
    }
    document.addEventListener('click', intercept, true)
    return () => document.removeEventListener('click', intercept, true)
  }, [copy.failed, syncWallet])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('midtrans') !== 'return') return
    setOpen(true)
    history.replaceState(null, '', `${window.location.pathname}#/activity`)
    const timers = [0, 2200, 6000, 12000].map((delay) => window.setTimeout(() => {
      void syncWallet().catch(() => undefined)
    }, delay))
    return () => timers.forEach(window.clearTimeout)
  }, [syncWallet])

  useEffect(() => {
    const onFocus = () => {
      if (localStorage.getItem(TOKEN_KEY)) void syncWallet().catch(() => undefined)
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [syncWallet])

  useEffect(() => {
    if (!open) return
    document.documentElement.classList.add('midtrans-open')
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', close)
    return () => {
      document.documentElement.classList.remove('midtrans-open')
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const numeric = Number(amount.replace(/\D/g, ''))
    if (!Number.isInteger(numeric) || numeric < 1000) {
      setError(copy.invalid)
      return
    }

    setBusy(true)
    setError('')
    try {
      const profile = readProfile()
      let token = localStorage.getItem(TOKEN_KEY)
      if (!token) token = await ensureWallet()

      let result = await paymentRequest(token, numeric, profile)

      if (result.response.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        token = await ensureWallet()
        result = await paymentRequest(token, numeric, profile)
      }

      if (!result.response.ok || !result.data.ok || !result.data.redirect_url) {
        const suffix = result.data.error ? ` · ${result.data.error}` : ` · HTTP ${result.response.status}`
        setError(`${copy.failedCode}${suffix}`)
        setBusy(false)
        return
      }

      if (result.data.order_id) localStorage.setItem('dlavie-last-midtrans-order', result.data.order_id)
      window.location.href = result.data.redirect_url
    } catch (cause) {
      console.error('Midtrans payment', cause)
      setError(copy.connection)
      setBusy(false)
    }
  }

  const statusText = (status: Deposit['status']) => {
    if (status === 'paid') return copy.paid
    if (status === 'pending') return copy.pending
    if (status === 'expired') return copy.expired
    if (status === 'cancelled') return copy.cancelled
    if (status === 'denied') return copy.denied
    if (status === 'failed') return copy.failedStatus
    return copy.created
  }

  if (!open) return null

  return (
    <div className="midtrans-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <section className="midtrans-sheet" aria-label={copy.title}>
        <button className="midtrans-close" type="button" onClick={() => setOpen(false)} aria-label="Close">×</button>
        <div className="midtrans-head">
          <span className="midtrans-mark">M</span>
          <div><small>{copy.eyebrow}</small><h2>{copy.title}</h2><p>{copy.body}</p></div>
        </div>

        <div className="midtrans-live-note"><i />{copy.live}</div>

        <div className="midtrans-balance">
          <span>{copy.current}</span>
          <strong>{balance === null ? '—' : rupiah.format(balance)}</strong>
          <button type="button" onClick={() => void syncWallet().catch(() => setError(copy.failed))}>{syncing ? copy.syncing : copy.refresh}</button>
        </div>

        <form onSubmit={submit}>
          <label><span>{copy.amount}</span><div className="midtrans-amount"><b>Rp</b><input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))} /></div></label>
          <div className="midtrans-presets">
            {[1000, 5000, 10000, 25000, 50000, 100000].map((value) => <button type="button" key={value} className={Number(amount) === value ? 'active' : ''} onClick={() => setAmount(String(value))}>{rupiah.format(value)}</button>)}
          </div>
          {error && <div className="midtrans-error">{error}</div>}
          <button className="midtrans-pay" type="submit" disabled={busy}>{busy ? copy.processing : copy.pay}<span>→</span></button>
        </form>

        <div className="midtrans-history">
          <div className="midtrans-history-head"><strong>{copy.recent}</strong><span>{deposits.length}</span></div>
          {deposits.length ? deposits.slice(0, 4).map((deposit) => (
            <div className="midtrans-deposit" key={deposit.order_id}>
              <span><strong>{rupiah.format(deposit.amount)}</strong><small>{deposit.order_id}</small></span>
              <b className={`status-${deposit.status}`}>{statusText(deposit.status)}</b>
            </div>
          )) : <p className="midtrans-empty">{copy.none}</p>}
        </div>
      </section>
    </div>
  )
}
