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

function applyCopy() {
  const language: Language = localStorage.getItem('dlavie-language') === 'en' ? 'en' : 'id'
  const en = language === 'en'

  const kicker = document.querySelector('.hero-kicker')
  replaceTextNode(kicker, en ? 'Virtual number platform' : 'Platform nomor virtual')
  kicker?.querySelector('b')?.remove()

  setTextAt('.hero-word', 0, en ? 'Virtual numbers,' : 'Nomor virtual,')
  setTextAt('.hero-word', 1, en ? 'made easier to find.' : 'lebih mudah dicari.')
  document.querySelector('.hero h1')?.setAttribute('aria-label', en ? 'Virtual numbers, made easier to find.' : 'Nomor virtual, lebih mudah dicari.')
  setText('.hero-copy > p', en ? 'Choose a service and country, check price and availability, then complete your purchase in one place.' : 'Pilih layanan dan negara, cek harga serta stok, lalu lanjutkan pembelian dari satu tempat.')
  setText('.hero-actions .button-primary', en ? 'Browse services →' : 'Lihat layanan →')

  const proof = en
    ? [['Availability','Check before buying'],['Organized transactions','Balance & history'],['Transparent pricing','Visible from the start']]
    : [['Stok tersedia','Cek sebelum membeli'],['Transaksi tertata','Saldo & riwayat'],['Harga transparan','Terlihat sejak awal']]
  proof.forEach(([strong, small], index) => {
    setText(`.hero-proof > div:nth-child(${index + 1}) strong`, strong)
    setText(`.hero-proof > div:nth-child(${index + 1}) small`, small)
  })

  replaceTextNode(document.querySelector('.window-status'), en ? 'Services available' : 'Layanan tersedia')
  setText('.window-balance small', en ? 'Available balance' : 'Saldo tersedia')
  setText('.window-price small', en ? 'from' : 'mulai dari')
  setText('.float-card-a small', en ? 'Order complete' : 'Pesanan selesai')
  setText('.float-card-a strong', en ? 'Code received' : 'Kode diterima')
  setText('.float-card-b small', en ? 'Minimum deposit' : 'Deposit minimum')
  setText('.float-card-b strong', 'Rp1.000')

  setText('.catalog-section .eyebrow', en ? 'Services' : 'Layanan')
  setText('.catalog-section .section-heading h2', en ? 'Choose a service and country.' : 'Pilih layanan dan negara.')
  setText('.catalog-section .section-heading p', en ? 'Use search or country filters to view available services, prices, and stock.' : 'Gunakan pencarian atau filter negara untuk melihat layanan, harga, dan stok yang tersedia.')
  const searchInput = document.querySelector<HTMLInputElement>('.catalog-section .search-field input')
  if (searchInput) searchInput.placeholder = en ? 'Search services...' : 'Cari layanan...'

  const categoryMap: Record<string, string> = en
    ? { Messaging:'Messaging', Account:'Account', Community:'Community', Social:'Social', Pesan:'Messaging', Akun:'Account', Komunitas:'Community', Sosial:'Social' }
    : { Messaging:'Pesan', Account:'Akun', Community:'Komunitas', Social:'Sosial' }
  document.querySelectorAll<HTMLElement>('.service-copy > span').forEach((element) => {
    const next = categoryMap[element.textContent?.trim() || '']
    if (next) element.textContent = next
  })

  setText('.experience .eyebrow', en ? 'How it works' : 'Cara kerja')
  setText('.experience-head h2', en ? 'Purchase in three steps.' : 'Pembelian dalam tiga langkah.')
  setText('.experience-head p', en ? 'Add balance, choose the service you need, then track the order from your account.' : 'Isi saldo, pilih layanan yang dibutuhkan, lalu pantau status pesanan dari akunmu.')
  const steps = en
    ? [['Add balance','Add at least Rp1,000 before making a purchase.'],['Choose a service','Choose the service and country you need, then check price and availability.'],['Track your order','Order status and incoming codes are shown in one place.']]
    : [['Isi saldo','Tambahkan saldo mulai Rp1.000 sebelum melakukan pembelian.'],['Pilih layanan','Pilih layanan dan negara sesuai kebutuhan, lalu periksa harga dan stok.'],['Pantau pesanan','Status pesanan dan kode yang masuk ditampilkan dalam satu halaman.']]
  steps.forEach(([title, body], index) => {
    setText(`.steps-grid article:nth-child(${index + 1}) h3`, title)
    setText(`.steps-grid article:nth-child(${index + 1}) p`, body)
  })

  setText('.security .eyebrow', en ? 'Security' : 'Keamanan')
  setText('.security-copy h2', en ? 'Sensitive data stays on the server.' : 'Data sensitif tetap berada di server.')
  setText('.security-copy > p', en ? 'Payment and supplier credentials are never stored in the browser. Sensitive integrations are handled by the backend.' : 'Kredensial pembayaran dan supplier tidak disimpan di browser. Integrasi penting diproses melalui backend.')

  setText('.history-section .eyebrow', en ? 'Activity' : 'Aktivitas')
  setText('.history-head h2', en ? 'Transaction history' : 'Riwayat transaksi')
  setText('.history-empty strong', en ? 'No transactions yet' : 'Belum ada transaksi')
  setText('.history-empty small', en ? 'Deposits and purchases will appear here.' : 'Deposit dan pembelian akan tampil di sini.')

  setText('.cta-card h2', en ? 'Find the service that fits your needs.' : 'Temukan layanan yang sesuai kebutuhanmu.')
  setText('.cta-card > p', en ? 'Check price and availability before purchasing.' : 'Lihat harga dan ketersediaan sebelum melakukan pembelian.')
  setText('.cta-card .button-light', en ? 'Open market →' : 'Buka market →')
  setText('.footer > p', en ? 'DLavie Market · Virtual number services' : 'DLavie Market · Layanan nomor virtual')

  setText('.theme-panel-head strong', en ? 'Theme' : 'Tema')
  setText('.theme-panel-head span', en ? 'Choose mode and color' : 'Pilih mode dan warna')
  setTextAt('.theme-label', 0, en ? 'Display mode' : 'Mode tampilan')
  setTextAt('.theme-label', 1, en ? 'Accent color' : 'Warna aksen')
  setText('.mono-choice strong', en ? 'Black & white' : 'Hitam & putih')
  setText('.mono-choice small', en ? 'No accent color' : 'Tanpa warna aksen')

  const navLabels = en
    ? ['Home','Market','How it works','Security','Activity']
    : ['Beranda','Market','Cara kerja','Keamanan','Aktivitas']
  document.querySelectorAll<HTMLElement>('.page-nav-copy strong').forEach((element, index) => {
    if (navLabels[index]) element.textContent = navLabels[index]
  })
  const descriptions = en
    ? ['Service overview','Find numbers & check prices','Purchase steps','System protection','Balance & history']
    : ['Ringkasan layanan','Cari nomor & cek harga','Langkah pembelian','Perlindungan sistem','Saldo & riwayat']
  document.querySelectorAll<HTMLElement>('.page-nav-copy small').forEach((element, index) => {
    if (descriptions[index]) element.textContent = descriptions[index]
  })
  setText('.page-nav-head span', en ? 'Navigation' : 'Navigasi')
  const current = document.querySelector<HTMLElement>('.page-nav-current')
  if (current) {
    const idToEn: Record<string,string> = { Beranda:'Home', 'Cara kerja':'How it works', Keamanan:'Security', Aktivitas:'Activity' }
    const enToId: Record<string,string> = { Home:'Beranda', 'How it works':'Cara kerja', Security:'Keamanan', Activity:'Aktivitas' }
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
    run()
    const observer = new MutationObserver((mutations) => {
      if (mutations.length && mutations.every((mutation) => insideAssistant(mutation.target))) return
      run()
    })
    observer.observe(document.body, { childList:true, subtree:true })
    window.addEventListener('hashchange', run)
    return () => {
      observer.disconnect()
      window.removeEventListener('hashchange', run)
    }
  }, [])
  return null
}