import { useEffect } from 'react'

function setText(selector: string, text: string) {
  document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    if (element.textContent !== text) element.textContent = text
  })
}

function setTextAt(selector: string, index: number, text: string) {
  const elements = document.querySelectorAll<HTMLElement>(selector)
  const element = elements[index]
  if (element && element.textContent !== text) element.textContent = text
}

function replaceTextNode(element: Element | null, text: string) {
  if (!element) return
  const node = Array.from(element.childNodes).find((item) => item.nodeType === Node.TEXT_NODE && item.textContent?.trim())
  if (node && node.textContent?.trim() !== text) node.textContent = ` ${text} `
}

function applyCopy() {
  const kicker = document.querySelector('.hero-kicker')
  replaceTextNode(kicker, 'Platform nomor virtual')
  kicker?.querySelector('b')?.remove()

  setTextAt('.hero-word', 0, 'Nomor virtual,')
  setTextAt('.hero-word', 1, 'lebih mudah dicari.')
  document.querySelector('.hero h1')?.setAttribute('aria-label', 'Nomor virtual, lebih mudah dicari.')
  setText('.hero-copy > p', 'Pilih layanan dan negara, cek harga serta stok, lalu lanjutkan pembelian dari satu tempat.')
  setText('.hero-actions .button-primary', 'Lihat layanan →')

  setText('.hero-proof > div:nth-child(1) strong', 'Stok tersedia')
  setText('.hero-proof > div:nth-child(1) small', 'Cek sebelum membeli')
  setText('.hero-proof > div:nth-child(2) strong', 'Transaksi tertata')
  setText('.hero-proof > div:nth-child(2) small', 'Saldo & riwayat')
  setText('.hero-proof > div:nth-child(3) strong', 'Harga transparan')
  setText('.hero-proof > div:nth-child(3) small', 'Terlihat sejak awal')

  replaceTextNode(document.querySelector('.window-status'), 'Layanan tersedia')
  setText('.window-balance small', 'Saldo tersedia')
  setText('.window-price small', 'mulai dari')
  setText('.float-card-a small', 'Pesanan selesai')
  setText('.float-card-a strong', 'Kode diterima')
  setText('.float-card-b small', 'Deposit minimum')
  setText('.float-card-b strong', 'Rp1.000')

  setText('.catalog-section .eyebrow', 'Layanan')
  setText('.catalog-section .section-heading h2', 'Pilih layanan dan negara.')
  setText('.catalog-section .section-heading p', 'Gunakan pencarian atau filter negara untuk melihat layanan, harga, dan stok yang tersedia.')
  const searchInput = document.querySelector<HTMLInputElement>('.catalog-section .search-field input')
  if (searchInput) searchInput.placeholder = 'Cari layanan...'

  document.querySelectorAll<HTMLElement>('.service-copy > span').forEach((element) => {
    const map: Record<string, string> = {
      Messaging: 'Pesan',
      Account: 'Akun',
      Community: 'Komunitas',
      Social: 'Sosial',
    }
    const next = map[element.textContent?.trim() || '']
    if (next) element.textContent = next
  })

  setText('.experience .eyebrow', 'Cara kerja')
  setText('.experience-head h2', 'Pembelian dalam tiga langkah.')
  setText('.experience-head p', 'Isi saldo, pilih layanan yang dibutuhkan, lalu pantau status pesanan dari akunmu.')
  setText('.steps-grid article:nth-child(1) h3', 'Isi saldo')
  setText('.steps-grid article:nth-child(1) p', 'Tambahkan saldo mulai Rp1.000 sebelum melakukan pembelian.')
  setText('.steps-grid article:nth-child(2) h3', 'Pilih layanan')
  setText('.steps-grid article:nth-child(2) p', 'Pilih layanan dan negara sesuai kebutuhan, lalu periksa harga dan stok.')
  setText('.steps-grid article:nth-child(3) h3', 'Pantau pesanan')
  setText('.steps-grid article:nth-child(3) p', 'Status pesanan dan kode yang masuk ditampilkan dalam satu halaman.')

  setText('.security .eyebrow', 'Keamanan')
  setText('.security-copy h2', 'Data sensitif tetap berada di server.')
  setText('.security-copy > p', 'Kredensial pembayaran dan supplier tidak disimpan di browser. Integrasi penting diproses melalui backend.')
  setText('.security-list > div:nth-child(1) strong', 'Kredensial terlindungi')
  setText('.security-list > div:nth-child(1) small', 'Kunci API dan data sensitif tidak dikirim ke browser.')
  setText('.security-list > div:nth-child(2) strong', 'Supplier fleksibel')
  setText('.security-list > div:nth-child(2) small', 'Provider dapat dipilih berdasarkan harga dan ketersediaan.')
  setText('.security-list > div:nth-child(3) strong', 'Antarmuka ringan')
  setText('.security-list > div:nth-child(3) small', 'Animasi dibuat halus tanpa mengganggu proses transaksi.')
  setText('.architecture-top > span:first-child', 'Arsitektur sistem')
  setText('.status-chip', 'Siap terhubung ke backend')
  setText('.arch-node:nth-of-type(1) strong', 'Frontend')
  setText('.arch-node:nth-of-type(1) small', 'GitHub Pages')
  setText('.arch-node:nth-of-type(2) strong', 'API aman')
  setText('.arch-node:nth-of-type(2) small', 'Akun · saldo')
  setText('.arch-node:nth-of-type(3) strong', 'Integrasi')
  setText('.arch-node:nth-of-type(3) small', 'Pembayaran · supplier')

  setText('.history-section .eyebrow', 'Aktivitas')
  setText('.history-head h2', 'Riwayat transaksi')
  setText('.history-empty strong', 'Belum ada transaksi')
  setText('.history-empty small', 'Deposit dan pembelian akan tampil di sini.')

  setText('.cta-card h2', 'Temukan layanan yang sesuai kebutuhanmu.')
  setText('.cta-card > p', 'Lihat harga dan ketersediaan sebelum melakukan pembelian.')
  setText('.cta-card .button-light', 'Buka market →')

  setText('.footer > p', 'DLavie Market · Layanan nomor virtual')

  setText('.modal-shell form .eyebrow', 'Saldo')
  setText('.modal-shell form h2', 'Isi saldo')
  setText('.modal-shell form > p', 'Deposit minimum Rp1.000. Pilih nominal untuk melanjutkan.')
  setText('.modal-shell form .button-primary', 'Lanjutkan →')
  setText('.form-error', 'Jumlah minimum deposit adalah Rp1.000.')

  const orderEyebrow = document.querySelector<HTMLElement>('.modal-shell .modal-icon[style] + .eyebrow')
  if (orderEyebrow) orderEyebrow.textContent = 'Konfirmasi pesanan'
  const orderDescription = orderEyebrow?.parentElement?.querySelector<HTMLElement>('h2 + p')
  if (orderDescription) orderDescription.textContent = 'Periksa layanan, negara, dan harga sebelum membeli.'
  setText('.modal-footnote', 'Pembelian belum terhubung ke supplier pada versi ini.')

  const accountEyebrow = Array.from(document.querySelectorAll<HTMLElement>('.modal-shell .eyebrow')).find((item) => item.textContent === 'Account')
  if (accountEyebrow) accountEyebrow.textContent = 'Akun'
  setText('.modal-shell h2', document.querySelector('.modal-shell h2')?.textContent === 'Masuk ke DLavie' ? 'Masuk ke akun' : document.querySelector('.modal-shell h2')?.textContent || '')
  document.querySelectorAll<HTMLElement>('.modal-shell p').forEach((element) => {
    if (element.textContent?.includes('backend auth')) element.textContent = 'Fitur akun akan aktif setelah sistem autentikasi terhubung.'
  })

  setText('.theme-panel-head strong', 'Tema')
  setText('.theme-panel-head span', 'Pilih mode dan warna')
  setTextAt('.theme-label', 0, 'Mode tampilan')
  setTextAt('.theme-label', 1, 'Warna aksen')
  setText('.mono-choice strong', 'Hitam & putih')
  setText('.mono-choice small', 'Tanpa warna aksen')

  document.querySelectorAll<HTMLElement>('.page-nav-copy').forEach((copy) => {
    const label = copy.querySelector('strong')?.textContent?.trim()
    const description = copy.querySelector<HTMLElement>('small')
    if (!description) return
    const map: Record<string, string> = {
      Beranda: 'Ringkasan layanan',
      Market: 'Cari nomor & cek harga',
      'Cara kerja': 'Langkah pembelian',
      Keamanan: 'Perlindungan sistem',
      Aktivitas: 'Saldo & riwayat',
    }
    if (label && map[label]) description.textContent = map[label]
  })
}

export default function CopyRefinement() {
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
    const observer = new MutationObserver(run)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('hashchange', run)
    return () => {
      observer.disconnect()
      window.removeEventListener('hashchange', run)
    }
  }, [])

  return null
}
