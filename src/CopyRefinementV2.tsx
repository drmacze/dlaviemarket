import { useEffect } from 'react'

type Language = 'id' | 'en'

function setText(selector: string, text: string) {
  document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    if (element.textContent !== text) element.textContent = text
  })
}

function setTextAt(selector: string, index: number, text: string) {
  const element = document.querySelectorAll<HTMLElement>(selector)[index]
  if (element && element.textContent !== text) element.textContent = text
}

function replaceTextNode(element: Element | null, text: string) {
  if (!element) return
  const node = Array.from(element.childNodes).find((item) => item.nodeType === Node.TEXT_NODE && item.textContent?.trim())
  if (node && node.textContent?.trim() !== text) node.textContent = ` ${text} `
}

function insideAssistant(node: Node) {
  const element = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement
  return !!element?.closest('.dlv-assistant')
}

const previewId = [
  { mark:'PU', name:'Pulsa', category:'Telekomunikasi', meta:'Semua operator', price:'Mulai dari katalog supplier' },
  { mark:'DT', name:'Paket Data', category:'Internet', meta:'Kuota & paket internet', price:'Harga realtime' },
  { mark:'PL', name:'PLN', category:'Listrik', meta:'Token & tagihan listrik', price:'Prabayar & pascabayar' },
  { mark:'EW', name:'E-Wallet', category:'Saldo digital', meta:'Top up dompet digital', price:'Nominal fleksibel' },
  { mark:'GM', name:'Voucher & Game', category:'Digital voucher', meta:'Game, voucher & hiburan', price:'Banyak brand' },
  { mark:'NV', name:'Nomor Virtual', category:'Layanan tambahan', meta:'Nomor & verifikasi SMS', price:'Tetap tersedia' },
]
const previewEn = [
  { mark:'CR', name:'Mobile Credit', category:'Telecom', meta:'All supported operators', price:'Supplier catalog' },
  { mark:'DT', name:'Data Packages', category:'Internet', meta:'Quota & internet packs', price:'Realtime pricing' },
  { mark:'EL', name:'Electricity', category:'PLN', meta:'Tokens & utility bills', price:'Prepaid & postpaid' },
  { mark:'EW', name:'E-Wallet', category:'Digital balance', meta:'Wallet top ups', price:'Flexible amounts' },
  { mark:'GM', name:'Voucher & Games', category:'Digital voucher', meta:'Games, vouchers & entertainment', price:'Multiple brands' },
  { mark:'VN', name:'Virtual Number', category:'Additional service', meta:'Numbers & SMS verification', price:'Still available' },
]

function applyPreview(en: boolean) {
  const items = en ? previewEn : previewId
  const cards = Array.from(document.querySelectorAll<HTMLElement>('.catalog-section .service-card'))
  cards.forEach((card, index) => {
    if (index >= items.length) {
      card.style.display = 'none'
      return
    }
    card.style.display = ''
    const item = items[index]
    const logo = card.querySelector<HTMLElement>('.service-logo')
    const category = card.querySelector<HTMLElement>('.service-copy > span')
    const name = card.querySelector<HTMLElement>('.service-copy h3')
    const country = card.querySelector<HTMLElement>('.service-country')
    const stock = card.querySelector<HTMLElement>('.stock')
    const small = card.querySelector<HTMLElement>('.service-bottom small')
    const price = card.querySelector<HTMLElement>('.service-bottom strong')
    if (logo) logo.textContent = item.mark
    if (category) category.textContent = item.category
    if (name) name.textContent = item.name
    if (country) country.textContent = item.meta
    if (stock) stock.textContent = en ? 'Digital' : 'Digital'
    if (small) small.textContent = en ? 'Availability' : 'Ketersediaan'
    if (price) price.textContent = item.price
  })
  const panel = document.querySelector<HTMLElement>('.catalog-section .catalog-panel')
  if (panel) panel.style.display = 'none'
}

function applyCopy() {
  const language: Language = localStorage.getItem('dlavie-language') === 'en' ? 'en' : 'id'
  const en = language === 'en'

  const kicker = document.querySelector('.hero-kicker')
  replaceTextNode(kicker, en ? 'Digital products marketplace' : 'Marketplace produk digital')
  kicker?.querySelector('b')?.remove()

  setTextAt('.hero-word', 0, en ? 'Digital needs,' : 'Kebutuhan digital,')
  setTextAt('.hero-word', 1, en ? 'one wallet is enough.' : 'cukup dari satu wallet.')
  document.querySelector('.hero h1')?.setAttribute('aria-label', en ? 'Digital needs, one wallet is enough.' : 'Kebutuhan digital, cukup dari satu wallet.')
  setText('.hero-copy > p', en ? 'Mobile credit, data packages, electricity, e-wallet, game vouchers, bills, and Virtual Number in one marketplace.' : 'Pulsa, paket data, PLN, e-wallet, voucher game, tagihan, dan Nomor Virtual dalam satu marketplace.')
  setText('.hero-actions .button-primary', en ? 'Open Digital Market →' : 'Buka Digital Market →')

  const proof = en
    ? [['One wallet','Across digital products'],['Traceable orders','References & history'],['Supplier-ready','Pricing & status']]
    : [['Satu wallet','Untuk banyak produk'],['Pesanan tertata','Reference & riwayat'],['Supplier-ready','Harga & status']]
  proof.forEach(([strong, small], index) => {
    setText(`.hero-proof > div:nth-child(${index + 1}) strong`, strong)
    setText(`.hero-proof > div:nth-child(${index + 1}) small`, small)
  })

  replaceTextNode(document.querySelector('.window-status'), en ? 'Digital marketplace' : 'Digital marketplace')
  setText('.window-balance small', en ? 'Wallet balance' : 'Saldo wallet')
  setText('.window-price small', en ? 'status' : 'status')
  const windowNames = en ? ['Mobile Credit','Data Packages','PLN','E-Wallet'] : ['Pulsa','Paket Data','PLN','E-Wallet']
  document.querySelectorAll<HTMLElement>('.window-row').forEach((row, index) => {
    if (!windowNames[index]) return
    const strong = row.querySelector<HTMLElement>('.window-meta strong')
    const meta = row.querySelector<HTMLElement>('.window-meta span')
    const price = row.querySelector<HTMLElement>('.window-price strong')
    if (strong) strong.textContent = windowNames[index]
    if (meta) meta.textContent = en ? 'Digital product' : 'Produk digital'
    if (price) price.textContent = en ? 'Ready' : 'Siap'
  })
  setText('.float-card-a small', en ? 'Digital order' : 'Pesanan digital')
  setText('.float-card-a strong', en ? 'Reference created' : 'Reference dibuat')
  setText('.float-card-b small', en ? 'Minimum deposit' : 'Deposit minimum')
  setText('.float-card-b strong', 'Rp1.000')

  const marquee = en ? ['Mobile Credit','Data Packages','PLN','E-Wallet','Game Voucher','Bills'] : ['Pulsa','Paket Data','PLN','E-Wallet','Voucher Game','Tagihan']
  document.querySelectorAll<HTMLElement>('.marquee-track > span').forEach((element, index) => replaceTextNode(element, marquee[index % marquee.length]))

  setText('.catalog-section .eyebrow', en ? 'Digital categories' : 'Kategori digital')
  setText('.catalog-section .section-heading h2', en ? 'Everything starts from Digital Market.' : 'Semua kebutuhan dimulai dari Digital Market.')
  setText('.catalog-section .section-heading p', en ? 'Browse mobile credit, data, electricity, e-wallet, vouchers, bills, and Virtual Number from one place.' : 'Jelajahi pulsa, data, listrik, e-wallet, voucher, tagihan, dan Nomor Virtual dari satu tempat.')
  applyPreview(en)

  setText('.experience .eyebrow', en ? 'How it works' : 'Cara kerja')
  setText('.experience-head h2', en ? 'One wallet. Three simple steps.' : 'Satu wallet. Tiga langkah sederhana.')
  setText('.experience-head p', en ? 'Fund your wallet, choose a digital product, then track supplier status and transaction references.' : 'Isi wallet, pilih produk digital, lalu pantau status supplier dan reference transaksi.')
  const steps = en
    ? [['Fund wallet','Add balance from Rp1,000 and wait for server verification.'],['Choose a product','Pick a category, brand, product and destination.'],['Track the order','Supplier status, references and serial/token output stay in one place.']]
    : [['Isi wallet','Tambahkan saldo mulai Rp1.000 dan tunggu verifikasi server.'],['Pilih produk','Pilih kategori, brand, produk, lalu masukkan tujuan.'],['Pantau transaksi','Status supplier, reference, dan SN/token tersimpan dalam satu alur.']]
  steps.forEach(([title, body], index) => {
    setText(`.steps-grid article:nth-child(${index + 1}) h3`, title)
    setText(`.steps-grid article:nth-child(${index + 1}) p`, body)
  })

  setText('.security .eyebrow', en ? 'Security' : 'Keamanan')
  setText('.security-copy h2', en ? 'Sensitive integrations stay on the server.' : 'Integrasi sensitif tetap berada di server.')
  setText('.security-copy > p', en ? 'Wallet verification, supplier credentials and payment secrets are handled by the backend, not the browser.' : 'Verifikasi wallet, credential supplier, dan secret pembayaran diproses backend, bukan browser.')

  setText('.history-section .eyebrow', en ? 'Activity' : 'Aktivitas')
  setText('.history-head h2', en ? 'Digital transaction history' : 'Riwayat transaksi digital')
  setText('.history-empty strong', en ? 'No transactions yet' : 'Belum ada transaksi')
  setText('.history-empty small', en ? 'Deposits and digital purchases will appear here.' : 'Deposit dan pembelian digital akan tampil di sini.')

  setText('.cta-card h2', en ? 'Open one market for all your digital needs.' : 'Buka satu market untuk semua kebutuhan digital.')
  setText('.cta-card > p', en ? 'Mobile credit, data, electricity, e-wallet, vouchers, bills and Virtual Number share the same wallet.' : 'Pulsa, data, PLN, e-wallet, voucher, tagihan, dan Nomor Virtual memakai wallet yang sama.')
  setText('.cta-card .button-light', en ? 'Open Digital Market →' : 'Buka Digital Market →')
  setText('.footer > p', en ? 'DLavie Market · Digital products marketplace' : 'DLavie Market · Marketplace produk digital')

  setText('.theme-panel-head strong', en ? 'Theme' : 'Tema')
  setText('.theme-panel-head span', en ? 'Choose mode and color' : 'Pilih mode dan warna')
  setTextAt('.theme-label', 0, en ? 'Display mode' : 'Mode tampilan')
  setTextAt('.theme-label', 1, en ? 'Accent color' : 'Warna aksen')
  setText('.mono-choice strong', en ? 'Black & white' : 'Hitam & putih')
  setText('.mono-choice small', en ? 'No accent color' : 'Tanpa warna aksen')

  const navLabels = en
    ? ['Home','Market','How it works','Security','Activity','Help','Legal']
    : ['Beranda','Market','Cara kerja','Keamanan','Aktivitas','Bantuan','Legal']
  document.querySelectorAll<HTMLElement>('.page-nav-copy strong').forEach((element, index) => {
    if (navLabels[index]) element.textContent = navLabels[index]
  })
  const descriptions = en
    ? ['Wallet & digital products','Credit, data, PLN, wallet, vouchers & numbers','Wallet, purchase & supplier flow','Backend & transaction protection','Digital orders, deposits & refunds','FAQ & support','Terms, privacy & refund policy']
    : ['Wallet & produk digital','Pulsa, data, PLN, wallet, voucher & nomor','Wallet, pembelian & status supplier','Proteksi backend & transaksi','Pesanan digital, deposit & refund','FAQ & dukungan','Terms, privasi & kebijakan refund']
  document.querySelectorAll<HTMLElement>('.page-nav-copy small').forEach((element, index) => {
    if (descriptions[index]) element.textContent = descriptions[index]
  })
  setText('.page-nav-head span', en ? 'Navigation' : 'Navigasi')
  const current = document.querySelector<HTMLElement>('.page-nav-current')
  if (current) {
    const idToEn: Record<string,string> = { Beranda:'Home', 'Cara kerja':'How it works', Keamanan:'Security', Aktivitas:'Activity', Bantuan:'Help' }
    const enToId: Record<string,string> = { Home:'Beranda', 'How it works':'Cara kerja', Security:'Keamanan', Activity:'Aktivitas', Help:'Bantuan' }
    const value = current.textContent?.trim() || ''
    current.textContent = en ? (idToEn[value] || value) : (enToId[value] || value)
  }
}

export default function CopyRefinementV2() {
  useEffect(() => {
    let queued = false
    const run = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        applyCopy()
      })
    }
    const openDigitalMarket = (event: MouseEvent) => {
      const target = event.target as Element | null
      if (!target?.closest('.catalog-section .service-card')) return
      event.preventDefault()
      event.stopPropagation()
      window.location.hash = '/market'
    }
    run()
    const observer = new MutationObserver((mutations) => {
      if (mutations.length && mutations.every((mutation) => insideAssistant(mutation.target))) return
      run()
    })
    observer.observe(document.body, { childList:true, subtree:true })
    document.addEventListener('click', openDigitalMarket, true)
    window.addEventListener('hashchange', run)
    return () => {
      observer.disconnect()
      document.removeEventListener('click', openDigitalMarket, true)
      window.removeEventListener('hashchange', run)
    }
  }, [])
  return null
}
