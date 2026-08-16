import { useEffect, useMemo, useState } from 'react'
import { gsap } from 'gsap'

type CountryCode = 'ID' | 'MY' | 'SG' | 'US' | 'GB'
type ServiceId = 'whatsapp' | 'telegram' | 'google' | 'discord' | 'instagram' | 'microsoft'
type Step = 1 | 2 | 3 | 4 | 5
type OrderStatus = 'waiting' | 'received' | 'cancelled' | 'expired'

type Service = {
  id: ServiceId
  name: string
  description: string
  logo: string
  factor: number
}

type Country = {
  code: CountryCode
  name: string
  flag: string
  dial: string
}

type Carrier = {
  id: string
  name: string
  country: CountryCode
  basePrice: number
  stock: number
  speed: string
  logo: string
  logoFit?: 'contain' | 'cover'
}

type Offer = Carrier & {
  price: number
  stockNow: number
  badge?: string
}

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

const ORDER_KEY = 'dlavie-orders-v1'
const STATE_EVENT = 'dlavie:state-changed'

const services: Service[] = [
  { id: 'whatsapp', name: 'WhatsApp', description: 'Verifikasi SMS untuk WhatsApp', logo: 'whatsapp.svg', factor: 1 },
  { id: 'telegram', name: 'Telegram', description: 'Verifikasi SMS untuk Telegram', logo: 'telegram.svg', factor: .82 },
  { id: 'google', name: 'Google', description: 'Nomor untuk verifikasi akun Google', logo: 'google.svg', factor: 1.12 },
  { id: 'discord', name: 'Discord', description: 'Verifikasi nomor untuk Discord', logo: 'discord.svg', factor: .94 },
  { id: 'instagram', name: 'Instagram', description: 'Verifikasi SMS untuk Instagram', logo: 'instagram.svg', factor: 1.18 },
  { id: 'microsoft', name: 'Microsoft', description: 'Nomor untuk verifikasi Microsoft', logo: 'microsoft.svg', factor: 1.24 },
]

const countries: Country[] = [
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dial: '+62' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dial: '+60' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dial: '+65' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dial: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dial: '+44' },
]

const favicon = (domain: string) => `https://www.google.com/s2/favicons?sz=128&domain_url=https://${domain}`

const carriers: Carrier[] = [
  { id: 'id-telkomsel', name: 'Telkomsel', country: 'ID', basePrice: 1120, stock: 128, speed: '30–90 dtk', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Telkomsel_%282021%29.svg' },
  { id: 'id-indosat', name: 'Indosat', country: 'ID', basePrice: 890, stock: 94, speed: '45–120 dtk', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Indosat_Ooredoo_Hutchison.svg' },
  { id: 'id-xl', name: 'XL', country: 'ID', basePrice: 960, stock: 76, speed: '45–120 dtk', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/27/XL_Axiata_2014.svg' },
  { id: 'id-tri', name: 'Tri', country: 'ID', basePrice: 790, stock: 153, speed: '60–150 dtk', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Three_logo.svg' },
  { id: 'id-smartfren', name: 'Smartfren', country: 'ID', basePrice: 740, stock: 61, speed: '60–180 dtk', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Smartfren_logo.svg' },
  { id: 'my-celcomdigi', name: 'CelcomDigi', country: 'MY', basePrice: 1510, stock: 71, speed: '45–120 dtk', logo: favicon('celcomdigi.com') },
  { id: 'my-maxis', name: 'Maxis', country: 'MY', basePrice: 1660, stock: 48, speed: '30–90 dtk', logo: favicon('maxis.com.my') },
  { id: 'my-umobile', name: 'U Mobile', country: 'MY', basePrice: 1390, stock: 84, speed: '60–150 dtk', logo: favicon('u.com.my') },
  { id: 'sg-singtel', name: 'Singtel', country: 'SG', basePrice: 2240, stock: 38, speed: '30–90 dtk', logo: favicon('singtel.com') },
  { id: 'sg-starhub', name: 'StarHub', country: 'SG', basePrice: 2050, stock: 46, speed: '45–120 dtk', logo: favicon('starhub.com') },
  { id: 'sg-m1', name: 'M1', country: 'SG', basePrice: 1920, stock: 33, speed: '60–150 dtk', logo: favicon('m1.com.sg') },
  { id: 'us-tmobile', name: 'T-Mobile', country: 'US', basePrice: 2980, stock: 57, speed: '30–90 dtk', logo: favicon('t-mobile.com') },
  { id: 'us-att', name: 'AT&T', country: 'US', basePrice: 3190, stock: 42, speed: '45–120 dtk', logo: favicon('att.com') },
  { id: 'us-verizon', name: 'Verizon', country: 'US', basePrice: 3350, stock: 35, speed: '45–120 dtk', logo: favicon('verizon.com') },
  { id: 'gb-ee', name: 'EE', country: 'GB', basePrice: 2480, stock: 39, speed: '30–90 dtk', logo: favicon('ee.co.uk') },
  { id: 'gb-o2', name: 'O2', country: 'GB', basePrice: 2260, stock: 51, speed: '45–120 dtk', logo: favicon('o2.co.uk') },
  { id: 'gb-vodafone', name: 'Vodafone', country: 'GB', basePrice: 2390, stock: 44, speed: '45–120 dtk', logo: favicon('vodafone.co.uk') },
  { id: 'gb-three', name: 'Three', country: 'GB', basePrice: 2110, stock: 62, speed: '60–150 dtk', logo: favicon('three.co.uk') },
]

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const round50 = (value: number) => Math.max(500, Math.round(value / 50) * 50)
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

function readOrders(): StoredOrder[] {
  try { return JSON.parse(localStorage.getItem(ORDER_KEY) || '[]') as StoredOrder[] } catch { return [] }
}

function writeOrders(orders: StoredOrder[]) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(orders.slice(0, 12)))
  window.dispatchEvent(new CustomEvent(STATE_EVENT))
}

function broadcastState() {
  window.dispatchEvent(new CustomEvent(STATE_EVENT))
}

function randomDigits(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => String(byte % 10)).join('')
}

function makeDemoNumber(country: Country) {
  const tail = randomDigits(4)
  if (country.code === 'ID') return `${country.dial} 8•• •••• ${tail}`
  if (country.code === 'MY') return `${country.dial} 1• •••• ${tail}`
  if (country.code === 'SG') return `${country.dial} •••• ${tail}`
  if (country.code === 'US') return `${country.dial} ••• ••• ${tail}`
  return `${country.dial} 7••• ••• ${tail}`
}

function Arrow({ back = false }: { back?: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={back ? 'M19 12H5' : 'M5 12h14'} /><path d={back ? 'm11 18-6-6 6-6' : 'm13 6 6 6-6 6'} /></svg>
}

function Check() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
}

function CopyIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>
}

function ProviderLogo({ offer, small = false }: { offer: Carrier; small?: boolean }) {
  const initials = offer.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className={`provider-logo${small ? ' small' : ''}`} title={offer.name}>
      <b>{initials}</b>
      <img src={offer.logo} alt={`${offer.name} logo`} referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.display = 'none' }} />
    </span>
  )
}

export default function MarketFlow() {
  const [step, setStep] = useState<Step>(1)
  const [serviceId, setServiceId] = useState<ServiceId | null>(null)
  const [countryCode, setCountryCode] = useState<CountryCode | null>(null)
  const [offerId, setOfferId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [balance, setBalance] = useState(() => Number(localStorage.getItem('dlavie-balance') || 0))
  const [activeOrder, setActiveOrder] = useState<StoredOrder | null>(null)
  const [copied, setCopied] = useState<'phone' | 'otp' | null>(null)
  const [now, setNow] = useState(Date.now())

  const selectedService = services.find((item) => item.id === serviceId) ?? null
  const selectedCountry = countries.find((item) => item.code === countryCode) ?? null

  const offers = useMemo<Offer[]>(() => {
    if (!selectedService || !countryCode) return []
    const rows = carriers
      .filter((carrier) => carrier.country === countryCode)
      .map((carrier, index) => ({
        ...carrier,
        price: round50(carrier.basePrice * selectedService.factor * (1 + index * .018)),
        stockNow: Math.max(8, carrier.stock - ((selectedService.id.length * 7 + index * 11) % 29)),
      }))
      .sort((a, b) => a.price - b.price)
    return rows.map((row, index) => ({ ...row, badge: index === 0 ? 'Termurah' : row.stockNow >= 100 ? 'Stok tinggi' : index === rows.length - 1 ? 'Prioritas' : undefined }))
  }, [countryCode, selectedService])

  const selectedOffer = offers.find((item) => item.id === offerId) ?? null
  const visibleServices = services.filter((item) => !query.trim() || `${item.name} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    const syncState = () => setBalance(Number(localStorage.getItem('dlavie-balance') || 0))
    window.addEventListener('focus', syncState)
    window.addEventListener('storage', syncState)
    window.addEventListener(STATE_EVENT, syncState)
    return () => {
      window.removeEventListener('focus', syncState)
      window.removeEventListener('storage', syncState)
      window.removeEventListener(STATE_EVENT, syncState)
    }
  }, [])

  useEffect(() => {
    if (step !== 5 || !activeOrder || activeOrder.status !== 'waiting') return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [step, activeOrder])

  useEffect(() => {
    const target = document.querySelector('.market-flow-stage')
    if (!target || !document.documentElement.matches('[data-page="market"]')) return
    gsap.fromTo(target, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .34, ease: 'power3.out', clearProps: 'transform' })
  }, [step])

  const chooseService = (id: ServiceId) => {
    setServiceId(id)
    setCountryCode(null)
    setOfferId(null)
    setActiveOrder(null)
    setStep(2)
  }

  const chooseCountry = (code: CountryCode) => {
    setCountryCode(code)
    setOfferId(null)
    setStep(3)
  }

  const chooseOffer = (id: string) => {
    setOfferId(id)
    setStep(4)
  }

  const back = () => {
    if (step === 2) setStep(1)
    if (step === 3) setStep(2)
    if (step === 4) setStep(3)
    if (step === 5) setStep(1)
  }

  const openDeposit = () => document.querySelector<HTMLButtonElement>('.balance-pill')?.click()

  const confirm = () => {
    if (!selectedService || !selectedCountry || !selectedOffer) return
    const current = Number(localStorage.getItem('dlavie-balance') || balance)
    if (current < selectedOffer.price) {
      openDeposit()
      return
    }

    const next = current - selectedOffer.price
    const order: StoredOrder = {
      id: `DLV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceLogo: selectedService.logo,
      countryCode: selectedCountry.code,
      countryName: selectedCountry.name,
      flag: selectedCountry.flag,
      providerId: selectedOffer.id,
      providerName: selectedOffer.name,
      providerLogo: selectedOffer.logo,
      price: selectedOffer.price,
      phone: makeDemoNumber(selectedCountry),
      createdAt: Date.now(),
      expiresAt: Date.now() + (20 * 60 * 1000),
      status: 'waiting',
    }

    localStorage.setItem('dlavie-balance', String(next))
    setBalance(next)
    writeOrders([order, ...readOrders()])

    try {
      const old = JSON.parse(localStorage.getItem('dlavie-history') || '[]') as Array<Record<string, unknown>>
      const nextHistory = [{
        id: order.id,
        orderId: order.id,
        type: 'order',
        label: `${selectedService.name} · ${selectedOffer.name}`,
        detail: `${selectedCountry.flag} ${selectedCountry.name}`,
        amount: -selectedOffer.price,
        time: 'Baru saja',
      }, ...old].slice(0, 12)
      localStorage.setItem('dlavie-history', JSON.stringify(nextHistory))
    } catch { /* local demo only */ }

    broadcastState()
    setActiveOrder(order)
    setNow(Date.now())
    setStep(5)
  }

  const updateOrder = (nextOrder: StoredOrder) => {
    const orders = readOrders().map((order) => order.id === nextOrder.id ? nextOrder : order)
    writeOrders(orders)
    setActiveOrder(nextOrder)
  }

  const simulateOtp = () => {
    if (!activeOrder || activeOrder.status !== 'waiting') return
    const nextOrder = { ...activeOrder, status: 'received' as const, otp: randomDigits(6) }
    updateOrder(nextOrder)
  }

  const copyText = async (kind: 'phone' | 'otp', value: string) => {
    await navigator.clipboard?.writeText(value)
    setCopied(kind)
    window.setTimeout(() => setCopied(null), 1300)
  }

  const remaining = activeOrder ? Math.max(0, activeOrder.expiresAt - now) : 0
  const remainingMinutes = String(Math.floor(remaining / 60000)).padStart(2, '0')
  const remainingSeconds = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')

  return (
    <section className="market-flow-page" aria-label="Market DLavie">
      <div className="market-flow-shell">
        <header className="market-flow-head">
          <div>
            <span className="market-flow-eyebrow">Market</span>
            <h1>Pilih nomor dengan langkah yang jelas.</h1>
            <p>Pilih layanan, negara, lalu bandingkan provider berdasarkan harga dan stok.</p>
          </div>
          <div className="market-balance-card">
            <span>Saldo</span>
            <strong>{rupiah.format(balance)}</strong>
            <button type="button" onClick={openDeposit}>Tambah saldo</button>
          </div>
        </header>

        <div className="market-demo-note"><span>●</span><p><strong>Harga, stok, nomor dan OTP masih simulasi.</strong> Flow ini sudah disiapkan untuk data supplier/API production.</p></div>

        <nav className="market-stepper" aria-label="Tahapan pembelian">
          {[['1','Layanan'],['2','Negara'],['3','Provider'],['4','Konfirmasi'],['5','OTP']].map(([number, label], index) => {
            const value = (index + 1) as Step
            const done = step > value
            const active = step === value
            return <div key={number} className={`${active ? 'active ' : ''}${done ? 'done' : ''}`}><i>{done ? <Check /> : number}</i><span>{label}</span></div>
          })}
        </nav>

        <div className="market-flow-layout">
          <div className="market-flow-stage">
            {step === 1 && (
              <div className="market-step-panel">
                <div className="market-panel-title"><span>Langkah 1 dari 5</span><h2>Pilih layanan</h2><p>Pilih aplikasi yang ingin menerima kode verifikasi.</p></div>
                <label className="market-service-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari layanan..." /></label>
                <div className="market-service-grid">
                  {visibleServices.map((service) => (
                    <button type="button" key={service.id} onClick={() => chooseService(service.id)}>
                      <img src={asset(`brands/${service.logo}`)} alt="" />
                      <span><strong>{service.name}</strong><small>{service.description}</small></span>
                      <Arrow />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && selectedService && (
              <div className="market-step-panel">
                <button className="market-back" type="button" onClick={back}><Arrow back /> Kembali</button>
                <div className="market-panel-title"><span>Langkah 2 dari 5</span><h2>Pilih negara</h2><p>Harga dan provider berbeda untuk setiap negara.</p></div>
                <div className="market-selected-inline"><img src={asset(`brands/${selectedService.logo}`)} alt="" /><span><small>Layanan</small><strong>{selectedService.name}</strong></span><button type="button" onClick={() => setStep(1)}>Ubah</button></div>
                <div className="market-country-grid">
                  {countries.map((item) => {
                    const available = carriers.filter((carrier) => carrier.country === item.code)
                    const firstCarrier = [...available].sort((a,b) => a.basePrice-b.basePrice)[0]
                    const from = round50(firstCarrier.basePrice * selectedService.factor)
                    return <button type="button" key={item.code} onClick={() => chooseCountry(item.code)}><span className="country-flag">{item.flag}</span><span><strong>{item.name}</strong><small>{item.dial} · {available.length} provider</small></span><b>mulai {rupiah.format(from)}</b><Arrow /></button>
                  })}
                </div>
              </div>
            )}

            {step === 3 && selectedService && selectedCountry && (
              <div className="market-step-panel">
                <button className="market-back" type="button" onClick={back}><Arrow back /> Kembali</button>
                <div className="market-panel-title"><span>Langkah 3 dari 5</span><h2>Pilih provider</h2><p>Bandingkan harga, stok, dan estimasi penerimaan SMS.</p></div>
                <div className="market-context-row">
                  <div><img src={asset(`brands/${selectedService.logo}`)} alt="" /><span><small>Layanan</small><strong>{selectedService.name}</strong></span></div>
                  <div><b>{selectedCountry.flag}</b><span><small>Negara</small><strong>{selectedCountry.name}</strong></span></div>
                </div>
                <div className="market-provider-list">
                  {offers.map((offer) => (
                    <button type="button" key={offer.id} onClick={() => chooseOffer(offer.id)}>
                      <ProviderLogo offer={offer} />
                      <span className="provider-main"><span><strong>{offer.name}</strong>{offer.badge && <em>{offer.badge}</em>}</span><small>SMS OTP · sesi 20 menit · estimasi {offer.speed}</small><span className="provider-stock"><i /> {offer.stockNow} stok</span></span>
                      <span className="provider-price"><small>Harga</small><strong>{rupiah.format(offer.price)}</strong></span>
                      <Arrow />
                    </button>
                  ))}
                </div>
                <p className="provider-note">Logo provider ditampilkan agar pilihan lebih mudah dikenali. Harga dan availability saat ini tetap data demo.</p>
              </div>
            )}

            {step === 4 && selectedService && selectedCountry && selectedOffer && (
              <div className="market-step-panel market-confirm-panel">
                <button className="market-back" type="button" onClick={back}><Arrow back /> Kembali</button>
                <div className="market-panel-title"><span>Langkah 4 dari 5</span><h2>Periksa pesanan</h2><p>Pastikan layanan, negara, dan provider sudah benar sebelum saldo dipotong.</p></div>
                <div className="confirm-hero">
                  <img src={asset(`brands/${selectedService.logo}`)} alt="" />
                  <div><small>Layanan</small><strong>{selectedService.name}</strong><span>{selectedCountry.flag} {selectedCountry.name}</span></div>
                  <ProviderLogo offer={selectedOffer} />
                </div>
                <div className="market-confirm-grid">
                  <div><span>Provider</span><strong>{selectedOffer.name}</strong></div>
                  <div><span>Estimasi SMS</span><strong>{selectedOffer.speed}</strong></div>
                  <div><span>Durasi sesi</span><strong>20 menit</strong></div>
                  <div><span>Stok saat ini</span><strong>{selectedOffer.stockNow} nomor</strong></div>
                </div>
                <div className="market-total"><span><small>Total</small><strong>{rupiah.format(selectedOffer.price)}</strong></span><span><small>Saldo setelah order</small><strong>{rupiah.format(Math.max(0, balance - selectedOffer.price))}</strong></span></div>
                <button className="market-confirm-button" type="button" onClick={confirm}>{balance >= selectedOffer.price ? 'Beli dan aktifkan nomor' : 'Saldo kurang — tambah saldo'} <Arrow /></button>
                <small className="confirm-footnote">Nomor pada demo tidak dapat digunakan untuk verifikasi nyata. Supplier production nantinya akan mengganti data simulasi ini.</small>
              </div>
            )}

            {step === 5 && activeOrder && (
              <div className="market-step-panel market-otp-panel">
                <div className="market-panel-title"><span>Langkah 5 dari 5</span><h2>{activeOrder.status === 'received' ? 'Kode OTP diterima.' : 'Nomor aktif. Menunggu SMS.'}</h2><p>Pesanan juga tersimpan di halaman Aktivitas, jadi kamu bisa kembali kapan saja selama sesi masih aktif.</p></div>
                <div className="live-order-card">
                  <div className="live-order-head">
                    <div className="live-order-brand"><img src={asset(`brands/${activeOrder.serviceLogo}`)} alt=""/><span><small>{activeOrder.flag} {activeOrder.countryName}</small><strong>{activeOrder.serviceName}</strong></span></div>
                    <span className={`order-status ${activeOrder.status}`}><i />{activeOrder.status === 'received' ? 'OTP diterima' : 'Menunggu SMS'}</span>
                  </div>
                  <div className="live-order-provider"><ProviderLogo offer={{ id: activeOrder.providerId, name: activeOrder.providerName, country: activeOrder.countryCode, basePrice: activeOrder.price, stock: 0, speed: '', logo: activeOrder.providerLogo }} small /><span><small>Provider</small><strong>{activeOrder.providerName}</strong></span><b>{remainingMinutes}:{remainingSeconds}</b></div>
                  <div className="live-number-row"><span><small>Nomor aktif · demo</small><strong>{activeOrder.phone}</strong></span><button type="button" onClick={() => copyText('phone', activeOrder.phone)}><CopyIcon />{copied === 'phone' ? 'Tersalin' : 'Salin'}</button></div>

                  {activeOrder.status === 'waiting' ? (
                    <div className="otp-waiting-box"><span className="otp-radar"><i/><i/><b>SMS</b></span><div><strong>Menunggu kode dari {activeOrder.serviceName}</strong><small>Di production, kode akan muncul otomatis setelah supplier mengirim callback SMS.</small></div></div>
                  ) : (
                    <div className="otp-code-box"><span><small>Kode OTP</small><strong>{activeOrder.otp}</strong></span><button type="button" onClick={() => activeOrder.otp && copyText('otp', activeOrder.otp)}><CopyIcon />{copied === 'otp' ? 'Tersalin' : 'Salin kode'}</button></div>
                  )}

                  <div className="live-order-actions">
                    {activeOrder.status === 'waiting' && <button className="simulate-otp" type="button" onClick={simulateOtp}>Simulasikan OTP masuk</button>}
                    <button type="button" onClick={() => { window.location.hash = '/activity' }}>Buka Aktivitas <Arrow /></button>
                  </div>
                </div>
                <div className="otp-demo-note"><b>Mode demo</b><span>Tombol simulasi hanya untuk menguji UI. Saat supplier aktif, OTP akan datang dari API/callback, bukan dibuat browser.</span></div>
              </div>
            )}
          </div>

          <aside className="market-flow-summary">
            <span className="summary-title">Ringkasan pilihan</span>
            <div className={selectedService ? 'filled' : ''}><small>01 · Layanan</small>{selectedService ? <span><img src={asset(`brands/${selectedService.logo}`)} alt=""/><strong>{selectedService.name}</strong></span> : <em>Belum dipilih</em>}</div>
            <div className={selectedCountry ? 'filled' : ''}><small>02 · Negara</small>{selectedCountry ? <strong>{selectedCountry.flag} {selectedCountry.name}</strong> : <em>Belum dipilih</em>}</div>
            <div className={selectedOffer ? 'filled' : ''}><small>03 · Provider</small>{selectedOffer ? <span><ProviderLogo offer={selectedOffer} small/><strong>{selectedOffer.name}</strong></span> : <em>Belum dipilih</em>}</div>
            <div className={selectedOffer ? 'filled summary-price' : ''}><small>Harga</small>{selectedOffer ? <strong>{rupiah.format(selectedOffer.price)}</strong> : <em>—</em>}</div>
            {step < 5 && <p>Pilih satu per satu. Kamu masih bisa kembali dan mengubah pilihan sebelum membeli.</p>}
            {step === 5 && activeOrder && <p>Order <strong>{activeOrder.id}</strong> sudah tersimpan dan dapat dipantau dari Aktivitas.</p>}
          </aside>
        </div>
      </div>
    </section>
  )
}
