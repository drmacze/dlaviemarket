import { useEffect, useMemo, useState } from 'react'

type OrderStatus = 'waiting' | 'received' | 'cancelled' | 'expired'
type CountryCode = 'ID' | 'MY' | 'SG' | 'US' | 'GB'
type ServiceId = 'whatsapp' | 'telegram' | 'google' | 'discord' | 'instagram' | 'microsoft'

type StoredOrder = {
  id: string
  serviceId: ServiceId
  serviceName: string
  serviceLogo: string
  countryCode: CountryCode
  countryName: string
  flag: string
  providerId: string
  providerName: string
  providerLogo: string
  price: number
  phone: string
  createdAt: number
  expiresAt: number
  status: OrderStatus
  otp?: string
}

type HistoryItem = {
  id: string
  type: 'deposit' | 'order' | 'refund'
  label: string
  detail?: string
  amount: number
  time: string
}

const ORDER_KEY = 'dlavie-orders-v1'
const HISTORY_KEY = 'dlavie-history'
const BALANCE_KEY = 'dlavie-balance'
const STATE_EVENT = 'dlavie:state-changed'
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

function readOrders(): StoredOrder[] {
  try { return JSON.parse(localStorage.getItem(ORDER_KEY) || '[]') as StoredOrder[] } catch { return [] }
}

function readHistory(): HistoryItem[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as HistoryItem[] } catch { return [] }
}

function broadcast() {
  window.dispatchEvent(new CustomEvent(STATE_EVENT))
}

function randomOtp() {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (byte) => String(byte % 10)).join('')
}

function CopyIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>
}

function Arrow() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
}

function ProviderLogo({ order }: { order: StoredOrder }) {
  const initials = order.providerName.split(/\s+/).map((part) => part[0]).join('').slice(0,2).toUpperCase()
  return <span className="activity-provider-logo"><b>{initials}</b><img src={order.providerLogo} alt={`${order.providerName} logo`} referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.display = 'none' }} /></span>
}

export default function OrderCenter() {
  const [orders, setOrders] = useState<StoredOrder[]>(() => readOrders())
  const [history, setHistory] = useState<HistoryItem[]>(() => readHistory())
  const [balance, setBalance] = useState(() => Number(localStorage.getItem(BALANCE_KEY) || 0))
  const [now, setNow] = useState(Date.now())
  const [copied, setCopied] = useState<string | null>(null)

  const sync = () => {
    setOrders(readOrders())
    setHistory(readHistory())
    setBalance(Number(localStorage.getItem(BALANCE_KEY) || 0))
  }

  useEffect(() => {
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
    const timer = window.setInterval(() => {
      const timestamp = Date.now()
      setNow(timestamp)
      const currentOrders = readOrders()
      const expired = currentOrders.filter((order) => order.status === 'waiting' && order.expiresAt <= timestamp)
      if (!expired.length) return

      let nextBalance = Number(localStorage.getItem(BALANCE_KEY) || 0)
      let nextHistory = readHistory()
      const nextOrders = currentOrders.map((order) => {
        if (!expired.some((item) => item.id === order.id)) return order
        nextBalance += order.price
        nextHistory = [{ id: crypto.randomUUID(), type: 'refund' as const, label: `Refund · ${order.serviceName}`, detail: `${order.providerName} · sesi berakhir`, amount: order.price, time: 'Baru saja' }, ...nextHistory]
        return { ...order, status: 'expired' as const }
      })
      localStorage.setItem(ORDER_KEY, JSON.stringify(nextOrders))
      localStorage.setItem(BALANCE_KEY, String(nextBalance))
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory.slice(0, 20)))
      sync()
      broadcast()
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const activeOrders = useMemo(() => orders.filter((order) => order.status === 'waiting' || order.status === 'received'), [orders])

  const updateOrder = (id: string, updater: (order: StoredOrder) => StoredOrder) => {
    const nextOrders = readOrders().map((order) => order.id === id ? updater(order) : order)
    localStorage.setItem(ORDER_KEY, JSON.stringify(nextOrders))
    sync()
    broadcast()
  }

  const simulateOtp = (order: StoredOrder) => {
    if (order.status !== 'waiting') return
    updateOrder(order.id, (current) => ({ ...current, status: 'received', otp: randomOtp() }))
  }

  const cancelOrder = (order: StoredOrder) => {
    if (order.status !== 'waiting') return
    const currentBalance = Number(localStorage.getItem(BALANCE_KEY) || 0)
    const nextBalance = currentBalance + order.price
    const nextHistory: HistoryItem[] = [{ id: crypto.randomUUID(), type: 'refund', label: `Refund · ${order.serviceName}`, detail: `${order.providerName} · dibatalkan`, amount: order.price, time: 'Baru saja' }, ...readHistory()].slice(0, 20)
    localStorage.setItem(BALANCE_KEY, String(nextBalance))
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory))
    updateOrder(order.id, (current) => ({ ...current, status: 'cancelled' }))
  }

  const copy = async (key: string, value: string) => {
    await navigator.clipboard?.writeText(value)
    setCopied(key)
    window.setTimeout(() => setCopied(null), 1300)
  }

  const statusLabel = (status: OrderStatus) => {
    if (status === 'waiting') return 'Menunggu SMS'
    if (status === 'received') return 'OTP diterima'
    if (status === 'cancelled') return 'Dibatalkan'
    return 'Sesi berakhir'
  }

  return (
    <section className="order-center-page" aria-label="Aktivitas dan pesanan">
      <div className="order-center-shell">
        <header className="order-center-head">
          <div><span>Aktivitas</span><h1>Pesanan & OTP</h1><p>Pantau nomor aktif, kode masuk, sisa waktu sesi, refund, dan riwayat transaksi dari satu tempat.</p></div>
          <div className="order-center-balance"><span>Saldo tersedia</span><strong>{rupiah.format(balance)}</strong><button type="button" onClick={() => document.querySelector<HTMLButtonElement>('.balance-pill')?.click()}>Tambah saldo</button></div>
        </header>

        <div className="activity-demo-note"><i /> <span><strong>Mode demo aktif.</strong> OTP di bawah bisa disimulasikan untuk menguji flow. Saat backend supplier tersambung, status dan kode akan diperbarui otomatis.</span></div>

        <section className="active-order-section">
          <div className="activity-section-title"><div><span>Pesanan aktif</span><h2>{activeOrders.length ? `${activeOrders.length} sesi sedang dipantau` : 'Belum ada pesanan aktif'}</h2></div><button type="button" onClick={() => { window.location.hash = '/market' }}>Beli nomor <Arrow /></button></div>

          {activeOrders.length ? (
            <div className="active-order-grid">
              {activeOrders.map((order) => {
                const remaining = Math.max(0, order.expiresAt - now)
                const mm = String(Math.floor(remaining / 60000)).padStart(2,'0')
                const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2,'0')
                return (
                  <article className="activity-order-card" key={order.id}>
                    <div className="activity-order-top">
                      <div className="activity-service"><img src={asset(`brands/${order.serviceLogo}`)} alt=""/><span><small>{order.flag} {order.countryName}</small><strong>{order.serviceName}</strong></span></div>
                      <span className={`activity-status ${order.status}`}><i />{statusLabel(order.status)}</span>
                    </div>

                    <div className="activity-provider-row"><ProviderLogo order={order}/><span><small>Provider</small><strong>{order.providerName}</strong></span><b>{mm}:{ss}</b></div>

                    <div className="activity-number"><span><small>Nomor aktif · demo</small><strong>{order.phone}</strong></span><button type="button" onClick={() => copy(`${order.id}-phone`, order.phone)}><CopyIcon />{copied === `${order.id}-phone` ? 'Tersalin' : 'Salin'}</button></div>

                    {order.status === 'waiting' ? (
                      <div className="activity-otp-wait"><span className="activity-radar"><i/><i/><b>SMS</b></span><div><strong>Menunggu kode verifikasi</strong><small>Kode akan tampil di sini begitu SMS diterima.</small></div></div>
                    ) : (
                      <div className="activity-otp-code"><span><small>Kode OTP</small><strong>{order.otp}</strong></span><button type="button" onClick={() => order.otp && copy(`${order.id}-otp`, order.otp)}><CopyIcon />{copied === `${order.id}-otp` ? 'Tersalin' : 'Salin OTP'}</button></div>
                    )}

                    <div className="activity-order-meta"><span>Order ID <strong>{order.id}</strong></span><span>{rupiah.format(order.price)}</span></div>
                    <div className="activity-order-actions">
                      {order.status === 'waiting' && <button className="activity-simulate" type="button" onClick={() => simulateOtp(order)}>Simulasikan OTP masuk</button>}
                      {order.status === 'waiting' && <button className="activity-cancel" type="button" onClick={() => cancelOrder(order)}>Batalkan & refund</button>}
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="activity-empty"><span>01</span><div><strong>Belum ada nomor yang menunggu SMS.</strong><small>Beli nomor dari Market. Setelah checkout, sesi akan muncul otomatis di sini.</small></div></div>
          )}
        </section>

        <section className="transaction-section">
          <div className="activity-section-title"><div><span>Riwayat</span><h2>Transaksi terbaru</h2></div><strong>{rupiah.format(balance)}</strong></div>
          <div className="transaction-card">
            {history.length ? history.map((item) => (
              <div className="transaction-row" key={item.id}>
                <span className={`transaction-icon ${item.type}`}>{item.type === 'deposit' ? '＋' : item.type === 'refund' ? '↺' : '→'}</span>
                <div><strong>{item.label}</strong><small>{item.detail || item.time}</small></div>
                <b className={item.amount > 0 ? 'positive' : 'negative'}>{item.amount > 0 ? '+' : ''}{rupiah.format(item.amount)}</b>
              </div>
            )) : <div className="transaction-empty">Belum ada transaksi.</div>}
          </div>
        </section>
      </div>
    </section>
  )
}
