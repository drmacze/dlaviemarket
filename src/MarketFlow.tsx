import { useEffect, useMemo, useState } from 'react'
import { gsap } from 'gsap'

type CountryCode = 'ID' | 'MY' | 'SG' | 'US' | 'GB'
type ServiceId = 'whatsapp' | 'telegram' | 'google' | 'discord' | 'instagram' | 'microsoft'
type Step = 1 | 2 | 3 | 4 | 5

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
}

type Offer = Carrier & {
  price: number
  stockNow: number
  badge?: string
}

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

const carriers: Carrier[] = [
  { id: 'id-telkomsel', name: 'Telkomsel', country: 'ID', basePrice: 1120, stock: 128, speed: '30–90 dtk' },
  { id: 'id-indosat', name: 'Indosat', country: 'ID', basePrice: 890, stock: 94, speed: '45–120 dtk' },
  { id: 'id-xl', name: 'XL', country: 'ID', basePrice: 960, stock: 76, speed: '45–120 dtk' },
  { id: 'id-tri', name: 'Tri', country: 'ID', basePrice: 790, stock: 153, speed: '60–150 dtk' },
  { id: 'id-smartfren', name: 'Smartfren', country: 'ID', basePrice: 740, stock: 61, speed: '60–180 dtk' },
  { id: 'my-celcomdigi', name: 'CelcomDigi', country: 'MY', basePrice: 1510, stock: 71, speed: '45–120 dtk' },
  { id: 'my-maxis', name: 'Maxis', country: 'MY', basePrice: 1660, stock: 48, speed: '30–90 dtk' },
  { id: 'my-umobile', name: 'U Mobile', country: 'MY', basePrice: 1390, stock: 84, speed: '60–150 dtk' },
  { id: 'sg-singtel', name: 'Singtel', country: 'SG', basePrice: 2240, stock: 38, speed: '30–90 dtk' },
  { id: 'sg-starhub', name: 'StarHub', country: 'SG', basePrice: 2050, stock: 46, speed: '45–120 dtk' },
  { id: 'sg-m1', name: 'M1', country: 'SG', basePrice: 1920, stock: 33, speed: '60–150 dtk' },
  { id: 'us-tmobile', name: 'T-Mobile', country: 'US', basePrice: 2980, stock: 57, speed: '30–90 dtk' },
  { id: 'us-att', name: 'AT&T', country: 'US', basePrice: 3190, stock: 42, speed: '45–120 dtk' },
  { id: 'us-verizon', name: 'Verizon', country: 'US', basePrice: 3350, stock: 35, speed: '45–120 dtk' },
  { id: 'gb-ee', name: 'EE', country: 'GB', basePrice: 2480, stock: 39, speed: '30–90 dtk' },
  { id: 'gb-o2', name: 'O2', country: 'GB', basePrice: 2260, stock: 51, speed: '45–120 dtk' },
  { id: 'gb-vodafone', name: 'Vodafone', country: 'GB', basePrice: 2390, stock: 44, speed: '45–120 dtk' },
  { id: 'gb-three', name: 'Three', country: 'GB', basePrice: 2110, stock: 62, speed: '60–150 dtk' },
]

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const round50 = (value: number) => Math.max(500, Math.round(value / 50) * 50)
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

function Arrow({ back = false }: { back?: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={back ? 'M19 12H5' : 'M5 12h14'} /><path d={back ? 'm11 18-6-6 6-6' : 'm13 6 6 6-6 6'} /></svg>
}

function Check() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
}

function MarketFlow() {
  const [step, setStep] = useState<Step>(1)
  const [serviceId, setServiceId] = useState<ServiceId | null>(null)
  const [countryCode, setCountryCode] = useState<CountryCode | null>(null)
  const [offerId, setOfferId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [balance, setBalance] = useState(() => Number(localStorage.getItem('dlavie-balance') || 0))

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
    const syncBalance = () => setBalance(Number(localStorage.getItem('dlavie-balance') || 0))
    window.addEventListener('focus', syncBalance)
    window.addEventListener('storage', syncBalance)
    return () => {
      window.removeEventListener('focus', syncBalance)
      window.removeEventListener('storage', syncBalance)
    }
  }, [])

  useEffect(() => {
    const target = document.querySelector('.market-flow-stage')
    if (!target || !document.documentElement.matches('[data-page="market"]')) return
    gsap.fromTo(target, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .34, ease: 'power3.out', clearProps: 'transform' })
  }, [step])

  const chooseService = (id: ServiceId) => {
    setServiceId(id)
    setCountryCode(null)
    setOfferId(null)
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

  const openDeposit = () => {
    document.querySelector<HTMLButtonElement>('.balance-pill')?.click()
  }

  const confirm = () => {
    if (!selectedService || !selectedCountry || !selectedOffer) return
    const current = Number(localStorage.getItem('dlavie-balance') || balance)
    if (current < selectedOffer.price) {
      openDeposit()
      return
    }
    const next = current - selectedOffer.price
    localStorage.setItem('dlavie-balance', String(next))
    setBalance(next)
    try {
      const old = JSON.parse(localStorage.getItem('dlavie-history') || '[]') as Array<Record<string, unknown>>
      const nextHistory = [{
        id: crypto.randomUUID(),
        type: 'order',
        label: `${selectedService.name} · ${selectedOffer.name}`,
        amount: -selectedOffer.price,
        time: 'Baru saja',
      }, ...old].slice(0, 8)
      localStorage.setItem('dlavie-history', JSON.stringify(nextHistory))
    } catch { /* demo history only */ }
    const balanceNode = document.querySelector<HTMLElement>('.balance-pill span')
    if (balanceNode) balanceNode.textContent = rupiah.format(next)
    setStep(5)
  }

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

        <div className="market-demo-note"><span>●</span><p><strong>Harga & stok masih data demo.</strong> Saat API supplier diaktifkan, daftar provider akan diperbarui otomatis.</p></div>

        <nav className="market-stepper" aria-label="Tahapan pembelian">
          {[['1','Layanan'],['2','Negara'],['3','Provider'],['4','Konfirmasi']].map(([number, label], index) => {
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
                <div className="market-panel-title"><span>Langkah 1 dari 4</span><h2>Pilih layanan</h2><p>Pilih aplikasi yang ingin kamu gunakan.</p></div>
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
                <div className="market-panel-title"><span>Langkah 2 dari 4</span><h2>Pilih negara</h2><p>Harga dan provider berbeda untuk setiap negara.</p></div>
                <div className="market-selected-inline"><img src={asset(`brands/${selectedService.logo}`)} alt="" /><span><small>Layanan</small><strong>{selectedService.name}</strong></span><button type="button" onClick={() => setStep(1)}>Ubah</button></div>
                <div className="market-country-grid">
                  {countries.map((item) => {
                    const count = carriers.filter((carrier) => carrier.country === item.code).length
                    const firstCarrier = carriers.filter((carrier) => carrier.country === item.code).sort((a,b) => a.basePrice-b.basePrice)[0]
                    const from = round50(firstCarrier.basePrice * selectedService.factor)
                    return <button type="button" key={item.code} onClick={() => chooseCountry(item.code)}><span className="country-flag">{item.flag}</span><span><strong>{item.name}</strong><small>{item.dial} · {count} provider</small></span><b>mulai {rupiah.format(from)}</b><Arrow /></button>
                  })}
                </div>
              </div>
            )}

            {step === 3 && selectedService && selectedCountry && (
              <div className="market-step-panel">
                <button className="market-back" type="button" onClick={back}><Arrow back /> Kembali</button>
                <div className="market-panel-title"><span>Langkah 3 dari 4</span><h2>Pilih provider</h2><p>Bandingkan harga, stok, dan estimasi penerimaan SMS.</p></div>
                <div className="market-context-row">
                  <div><img src={asset(`brands/${selectedService.logo}`)} alt="" /><span><small>Layanan</small><strong>{selectedService.name}</strong></span></div>
                  <div><b>{selectedCountry.flag}</b><span><small>Negara</small><strong>{selectedCountry.name}</strong></span></div>
                </div>
                <div className="market-offer-list">
                  {offers.map((offer) => (
                    <button type="button" key={offer.id} onClick={() => chooseOffer(offer.id)}>
                      <div className="offer-radio"><i /></div>
                      <div className="offer-main"><span><strong>{offer.name}</strong>{offer.badge && <em>{offer.badge}</em>}</span><small>SMS OTP · sesi 20 menit · estimasi {offer.speed}</small></div>
                      <div className="offer-stock"><span className={offer.stockNow > 50 ? 'good' : ''}>●</span>{offer.stockNow} stok</div>
                      <div className="offer-price"><small>Harga</small><strong>{rupiah.format(offer.price)}</strong></div>
                      <Arrow />
                    </button>
                  ))}
                </div>
                <p className="market-provider-note">Provider di atas adalah contoh tampilan katalog. Availability sebenarnya nanti mengikuti data supplier.</p>
              </div>
            )}

            {step === 4 && selectedService && selectedCountry && selectedOffer && (
              <div className="market-step-panel">
                <button className="market-back" type="button" onClick={back}><Arrow back /> Kembali</button>
                <div className="market-panel-title"><span>Langkah 4 dari 4</span><h2>Periksa pesanan</h2><p>Pastikan semua pilihan sudah sesuai sebelum membeli.</p></div>
                <div className="market-review-card">
                  <div className="review-service"><img src={asset(`brands/${selectedService.logo}`)} alt="" /><span><small>Layanan</small><strong>{selectedService.name}</strong></span></div>
                  <dl>
                    <div><dt>Negara</dt><dd>{selectedCountry.flag} {selectedCountry.name} ({selectedCountry.dial})</dd></div>
                    <div><dt>Provider</dt><dd>{selectedOffer.name}</dd></div>
                    <div><dt>Tipe</dt><dd>SMS OTP · 20 menit</dd></div>
                    <div><dt>Estimasi</dt><dd>{selectedOffer.speed}</dd></div>
                    <div><dt>Stok saat ini</dt><dd>{selectedOffer.stockNow}</dd></div>
                  </dl>
                  <div className="review-total"><span><small>Total</small><strong>{rupiah.format(selectedOffer.price)}</strong></span><span><small>Saldo</small><strong>{rupiah.format(balance)}</strong></span></div>
                </div>
                <button className="market-confirm" type="button" onClick={confirm}>{balance >= selectedOffer.price ? <>Beli sekarang <Arrow /></> : <>Saldo tidak cukup · deposit <Arrow /></>}</button>
                <p className="market-confirm-note">Belum ada nomor sungguhan yang dipesan. Tombol ini hanya menjalankan simulasi sampai backend supplier aktif.</p>
              </div>
            )}

            {step === 5 && selectedService && selectedCountry && selectedOffer && (
              <div className="market-step-panel market-success-panel">
                <div className="success-ring"><Check /></div>
                <span className="market-flow-eyebrow">Pesanan demo dibuat</span>
                <h2>Pesanan masuk ke aktivitas.</h2>
                <p>Simulasi untuk {selectedService.name} · {selectedCountry.flag} {selectedCountry.name} · {selectedOffer.name} sudah tercatat.</p>
                <div className="success-summary"><span><small>Total</small><strong>{rupiah.format(selectedOffer.price)}</strong></span><span><small>Sisa saldo</small><strong>{rupiah.format(balance)}</strong></span></div>
                <button className="market-confirm" type="button" onClick={() => { setServiceId(null); setCountryCode(null); setOfferId(null); setQuery(''); setStep(1) }}>Cari nomor lain <Arrow /></button>
                <button className="market-activity-link" type="button" onClick={() => { window.location.hash = '/activity' }}>Lihat aktivitas</button>
              </div>
            )}
          </div>

          <aside className="market-selection-summary">
            <div className="summary-head"><span>Ringkasan pilihan</span><small>{step === 5 ? 'Selesai' : `${Math.min(step,4)} / 4`}</small></div>
            <div className={selectedService ? 'filled' : ''}><i>1</i><span><small>Layanan</small><strong>{selectedService?.name ?? 'Belum dipilih'}</strong></span>{selectedService && step < 5 && <button type="button" onClick={() => setStep(1)}>Ubah</button>}</div>
            <div className={selectedCountry ? 'filled' : ''}><i>2</i><span><small>Negara</small><strong>{selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'Belum dipilih'}</strong></span>{selectedCountry && step < 5 && <button type="button" onClick={() => setStep(2)}>Ubah</button>}</div>
            <div className={selectedOffer ? 'filled' : ''}><i>3</i><span><small>Provider</small><strong>{selectedOffer?.name ?? 'Belum dipilih'}</strong></span>{selectedOffer && step < 5 && <button type="button" onClick={() => setStep(3)}>Ubah</button>}</div>
            <div className={selectedOffer ? 'filled price' : ''}><i>4</i><span><small>Harga</small><strong>{selectedOffer ? rupiah.format(selectedOffer.price) : '—'}</strong></span></div>
            <div className="summary-help"><span>?</span><p><strong>Bingung pilih provider?</strong><small>Mulai dari opsi “Termurah”, lalu periksa stok dan estimasi SMS.</small></p></div>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default MarketFlow
