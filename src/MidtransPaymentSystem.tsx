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

function createWalletToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return `dlv_${btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')}`
}

function getLocalWalletToken() {
  let token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    token = createWalletToken()
    localStorage.setItem(TOKEN_KEY, token)
  }
  return token
}

function localBalance() {
  const value = Number(localStorage.getItem('dlavie-balance') || 0)
  return Number.isFinite(value) ? value : 0
}

export default function MidtransPaymentSystem() {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('10000')
  const [balance, setBalance] = useState<number | null>(() => localBalance())
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
    processing: 'Opening Midtrans Sandbox…',
    current: 'Server balance',
    refresh: 'Refresh status',
    recent: 'Recent deposits',
    none: 'No Midtrans Sandbox deposits yet.',
    live: 'Sandbox mode is active. Payments here are for testing and do not use real money.',
    invalid: 'Minimum deposit is Rp1,000.',
    failed: 'Could not create the Midtrans Sandbox payment. Try again in a moment.',
    failedCode: 'Payment request failed',
    walletSync: 'Balance sync is temporarily unavailable. You can still continue with the Sandbox payment.',
    syncing: 'Checking…',
    pending: 'Pending', paid: 'Paid', expired: 'Expired', cancelled: 'Cancelled', failedStatus: 'Failed', denied: 'Denied', created: 'Created',
  } : {
    title: 'Isi saldo wallet',
    eyebrow: 'MIDTRANS · SANDBOX',
    body: 'Pembayaran percobaan melalui Midtrans Sandbox. Saldo hanya ditambahkan setelah pembayaran diverifikasi oleh server.',
    amount: 'Nominal deposit',
    pay: 'Lanjut ke Midtrans Sandbox',
    processing: 'Membuka Midtrans Sandbox…',
    current: 'Saldo server',
    refresh: 'Perbarui status',
    recent: 'Deposit terbaru',
    none: 'Belum ada deposit Midtrans Sandbox.',
    live: 'Mode Sandbox aktif. Pembayaran di sini hanya untuk pengujian dan tidak menggunakan uang sungguhan.',
    invalid: 'Minimum deposit adalah Rp1.000.',
    failed: 'Pembayaran Midtrans Sandbox belum bisa dibuat. Coba lagi sebentar.',
    failedCode: 'Permintaan pembayaran gagal',
    walletSync: 'Sinkronisasi saldo sedang tidak tersedia. Pembayaran Sandbox tetap bisa dilanjutkan.',
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

  const walletRequest = useCallback(async (action: 'ensure' | 'status', token: string) => {
    const body = new URLSearchParams({ action, wallet_token: token })
    const response = await fetch(`${API_BASE}/dlavie-wallet`, { method: 'POST', body })
    const data = await response.json().catch(() => ({})) as WalletResponse
    return { response, data }
  }, [])

  const ensureWallet = useCallback(async () => {
    let token = getLocalWalletToken()
    const result = await walletRequest('ensure', token)
    if (!result.response.ok || !result.data.ok) throw new Error(result.data.error || 'wallet_error')
    if (result.data.wallet_token) {
      token = result.data.wallet_token
      localStorage.setItem(TOKEN_KEY, token)
    }
    applyWallet(result.data)
    return token
  }, [applyWallet, walletRequest])

  const syncWallet = useCallback(async () => {
    const token = getLocalWalletToken()
    setSyncing(true)
    try {
      const result = await walletRequest('status', token)
      if (result.response.status === 401) return await ensureWallet()
      if (!result.response.ok || !result.data.ok) throw new Error(result.data.error || 'wallet_status_error')
      applyWallet(result.data)
      return token
    } finally {
      setSyncing(false)
    }
  }, [applyWallet, ensureWallet, walletRequest])

  const paymentRequest = useCallback(async (token: string, numeric: number, profile: Profile | null) => {
    const body = new URLSearchParams({
      amount: String(numeric),
      wallet_token: token,
      customer_name: profile?.username || '',
      customer_email: profile?.email || '',
    })
    const response = await fetch(`${API_BASE}/dlavie-create-payment`, { method: 'POST', body })
    const data = await response.json().catch(() => ({})) as PaymentResponse
    return { response, data }
  }, [])

  const directPaymentFallback = useCallback((token: string, numeric: number, profile: Profile | null) => {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = `${API_BASE}/dlavie-create-payment`
    form.style.display = 'none'

    const fields: Record<string, string> = {
      amount: String(numeric),
      wallet_token: token,
      customer_name: profile?.username || '',
      customer_email: profile?.email || '',
      direct_redirect: '1',
    }
    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = name
      input.value = value
      form.appendChild(input)
    })
    document.body.appendChild(form)
    form.submit()
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
      void syncWallet().catch(() => setError(copy.walletSync))
    }
    document.addEventListener('click', intercept, true)
    return () => document.removeEventListener('click', intercept, true)
  }, [copy.walletSync, syncWallet])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const midtrans = params.get('midtrans')
    if (midtrans === 'error') {
      setOpen(true)
      setError(copy.failed)
      history.replaceState(null, '', `${window.location.pathname}#/home`)
      return
    }
    if (midtrans !== 'return') return
    setOpen(true)
    history.replaceState(null, '', `${window.location.pathname}#/activity`)
    const timers = [0, 2200, 6000, 12000].map((delay) => window.setTimeout(() => {
      void syncWallet().catch(() => undefined)
    }, delay))
    return () => timers.forEach(window.clearTimeout)
  }, [copy.failed, syncWallet])

  useEffect(() => {
    const onFocus = () => {
      void syncWallet().catch(() => undefined)
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
    const profile = readProfile()
    const token = getLocalWalletToken()

    try {
      const result = await paymentRequest(token, numeric, profile)
      if (!result.response.ok || !result.data.ok || !result.data.redirect_url) {
        const suffix = result.data.error ? ` · ${result.data.error}` : ` · HTTP ${result.response.status}`
        setError(`${copy.failedCode}${suffix}`)
        setBusy(false)
        return
      }
      if (result.data.order_id) localStorage.setItem('dlavie-last-midtrans-order', result.data.order_id)
      window.location.assign(result.data.redirect_url)
    } catch (cause) {
      console.warn('Midtrans fetch blocked, using direct navigation fallback', cause)
      directPaymentFallback(token, numeric, profile)
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
          <strong>{balance === null ? rupiah.format(0) : rupiah.format(balance)}</strong>
          <button type="button" onClick={() => void syncWallet().catch(() => setError(copy.walletSync))}>{syncing ? copy.syncing : copy.refresh}</button>
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
