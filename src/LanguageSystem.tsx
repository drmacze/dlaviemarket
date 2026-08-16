import { useEffect } from 'react'

const LANGUAGE_KEY = 'dlavie-language'

const exact: Record<string, string> = {
  'Beranda': 'Home',
  'Cara kerja': 'How it works',
  'Keamanan': 'Security',
  'Aktivitas': 'Activity',
  'Navigasi': 'Navigation',
  'Ringkasan layanan': 'Service overview',
  'Cari nomor & cek harga': 'Find numbers & check prices',
  'Langkah pembelian': 'Purchase steps',
  'Perlindungan sistem': 'System protection',
  'Saldo & riwayat': 'Balance & history',
  'Platform nomor virtual': 'Virtual number platform',
  'Nomor virtual,': 'Virtual numbers,',
  'lebih mudah dicari.': 'made easier to find.',
  'Pilih layanan dan negara, cek harga serta stok, lalu lanjutkan pembelian dari satu tempat.': 'Choose a service and country, check price and availability, then complete your purchase in one place.',
  'Lihat layanan →': 'Browse services →',
  'Stok tersedia': 'Availability',
  'Cek sebelum membeli': 'Check before buying',
  'Transaksi tertata': 'Organized transactions',
  'Harga transparan': 'Transparent pricing',
  'Terlihat sejak awal': 'Visible from the start',
  'Layanan tersedia': 'Services available',
  'Saldo tersedia': 'Available balance',
  'mulai dari': 'from',
  'Pesanan selesai': 'Order complete',
  'Kode diterima': 'Code received',
  'Deposit minimum': 'Minimum deposit',
  'Layanan': 'Services',
  'Pilih layanan dan negara.': 'Choose a service and country.',
  'Gunakan pencarian atau filter negara untuk melihat layanan, harga, dan stok yang tersedia.': 'Use search or country filters to view available services, prices, and stock.',
  'Pesan': 'Messaging',
  'Akun': 'Account',
  'Komunitas': 'Community',
  'Sosial': 'Social',
  'Pembelian dalam tiga langkah.': 'Purchase in three steps.',
  'Isi saldo': 'Add balance',
  'Tambahkan saldo mulai Rp1.000 sebelum melakukan pembelian.': 'Add at least Rp1,000 before making a purchase.',
  'Pilih layanan': 'Choose a service',
  'Pilih layanan dan negara sesuai kebutuhan, lalu periksa harga dan stok.': 'Choose the service and country you need, then check price and availability.',
  'Pantau pesanan': 'Track your order',
  'Status pesanan dan kode yang masuk ditampilkan dalam satu halaman.': 'Order status and incoming codes are shown in one place.',
  'Data sensitif tetap berada di server.': 'Sensitive data stays on the server.',
  'Kredensial pembayaran dan supplier tidak disimpan di browser. Integrasi penting diproses melalui backend.': 'Payment and supplier credentials are never stored in the browser. Sensitive integrations are handled by the backend.',
  'Kredensial terlindungi': 'Protected credentials',
  'Kunci API dan data sensitif tidak dikirim ke browser.': 'API keys and sensitive data are never sent to the browser.',
  'Supplier fleksibel': 'Flexible suppliers',
  'Provider dapat dipilih berdasarkan harga dan ketersediaan.': 'Providers can be selected based on price and availability.',
  'Antarmuka ringan': 'Lightweight interface',
  'Animasi dibuat halus tanpa mengganggu proses transaksi.': 'Motion stays smooth without getting in the way of transactions.',
  'Arsitektur sistem': 'System architecture',
  'Siap terhubung ke backend': 'Ready for backend integration',
  'Frontend': 'Frontend',
  'API aman': 'Secure API',
  'Integrasi': 'Integrations',
  'Pembayaran · supplier': 'Payments · suppliers',
  'Riwayat transaksi': 'Transaction history',
  'Belum ada transaksi': 'No transactions yet',
  'Deposit dan pembelian akan tampil di sini.': 'Deposits and purchases will appear here.',
  'Temukan layanan yang sesuai kebutuhanmu.': 'Find the service that fits your needs.',
  'Lihat harga dan ketersediaan sebelum melakukan pembelian.': 'Check price and availability before purchasing.',
  'Buka market →': 'Open market →',
  'DLavie Market · Layanan nomor virtual': 'DLavie Market · Virtual number services',
  'Saldo': 'Balance',
  'Deposit minimum Rp1.000. Pilih nominal untuk melanjutkan.': 'Minimum deposit is Rp1,000. Choose an amount to continue.',
  'Lanjutkan →': 'Continue →',
  'Jumlah minimum deposit adalah Rp1.000.': 'The minimum deposit is Rp1,000.',
  'Konfirmasi pesanan': 'Confirm order',
  'Periksa layanan, negara, dan harga sebelum membeli.': 'Review the service, country, and price before purchasing.',
  'Pembelian belum terhubung ke supplier pada versi ini.': 'Purchases are not connected to a live supplier in this version.',
  'Tema': 'Theme',
  'Pilih mode dan warna': 'Choose mode and color',
  'Mode tampilan': 'Display mode',
  'Warna aksen': 'Accent color',
  'Hitam & putih': 'Black & white',
  'Tanpa warna aksen': 'No accent color',
  'Tampilan': 'Appearance',
  'Atur mode & aksen': 'Adjust mode & accent',
  'Tanpa warna tambahan': 'No extra color',
  'Langkah 1 dari 5': 'Step 1 of 5',
  'Langkah 2 dari 5': 'Step 2 of 5',
  'Langkah 3 dari 5': 'Step 3 of 5',
  'Langkah 4 dari 5': 'Step 4 of 5',
  'Langkah 5 dari 5': 'Step 5 of 5',
  'Pilih negara': 'Choose country',
  'Pilih provider': 'Choose provider',
  'Konfirmasi': 'Confirm',
  'OTP': 'OTP',
  'Kembali': 'Back',
  'Ubah': 'Change',
  'Termurah': 'Lowest price',
  'Stok tinggi': 'High stock',
  'Prioritas': 'Priority',
  'Harga': 'Price',
  'stok': 'stock',
  'Provider': 'Provider',
  'Nomor aktif · demo': 'Active number · demo',
  'Salin': 'Copy',
  'Tersalin': 'Copied',
  'Menunggu SMS': 'Waiting for SMS',
  'OTP diterima': 'OTP received',
  'Dibatalkan': 'Cancelled',
  'Sesi berakhir': 'Session expired',
  'Kedaluwarsa': 'Expired',
  'Selesai': 'Complete',
  'Menunggu kode verifikasi': 'Waiting for verification code',
  'Kode akan tampil di sini begitu SMS diterima.': 'The code will appear here as soon as the SMS arrives.',
  'Kode OTP': 'OTP code',
  'Salin OTP': 'Copy OTP',
  'Simulasikan OTP masuk': 'Simulate incoming OTP',
  'Batalkan & refund': 'Cancel & refund',
  'Pesanan aktif': 'Active orders',
  'Belum ada pesanan aktif': 'No active orders',
  'Beli nomor': 'Buy number',
  'Pesanan & OTP': 'Orders & OTP',
  'Pantau nomor aktif, kode masuk, sisa waktu sesi, refund, dan riwayat transaksi dari satu tempat.': 'Track active numbers, incoming codes, session time, refunds, and transactions in one place.',
  'Mode demo aktif.': 'Demo mode is active.',
  'OTP di bawah bisa disimulasikan untuk menguji flow. Saat backend supplier tersambung, status dan kode akan diperbarui otomatis.': 'OTP can be simulated below to test the flow. Once a supplier backend is connected, status and codes will update automatically.',
  'Belum ada nomor yang menunggu SMS.': 'No numbers are waiting for SMS.',
  'Beli nomor dari Market. Setelah checkout, sesi akan muncul otomatis di sini.': 'Buy a number from Market. The session will appear here automatically after checkout.',
  'Riwayat': 'History',
  'Transaksi terbaru': 'Recent transactions',
  'Tambah saldo': 'Add balance',
  'Deposit saldo': 'Balance deposit',
  'Baru saja': 'Just now',
  'Profil': 'Profile',
  'Masuk': 'Sign in',
  'Masuk ke akun': 'Sign in to your account',
  'Buat akun': 'Create account',
  'Nama pengguna': 'Username',
  'Kata sandi': 'Password',
  'Konfirmasi kata sandi': 'Confirm password',
  'Saya bukan robot': 'I am not a robot',
  'Selamat datang': 'Welcome',
  'Lanjut ke Market': 'Continue to Market',
  'Akun Saya': 'My Account',
  'Ubah avatar': 'Change avatar',
  'Keluar': 'Sign out',
  'Bahasa': 'Language',
  'Pagi Cerah': 'Bright Morning',
  'Jalan Malam': 'Night Drive',
  'Akhir Pekan': 'Weekend',
  'Kota Setelah Hujan': 'After the Rain',
  'Santai Sore': 'Easy Afternoon',
  'Sedang diputar': 'Now playing',
  'Siap diputar': 'Ready to play',
  'Volume': 'Volume',
}

function translateDynamic(text: string) {
  const sessions = text.match(/^(\d+) sesi sedang dipantau$/)
  if (sessions) return `${sessions[1]} active session${sessions[1] === '1' ? '' : 's'}`
  const step = text.match(/^Langkah (\d+) dari (\d+)$/)
  if (step) return `Step ${step[1]} of ${step[2]}`
  const stock = text.match(/^(\d+) stok$/)
  if (stock) return `${stock[1]} in stock`
  return exact[text] || text
}

function applyEnglish(root: ParentNode = document) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  let node = walker.nextNode()
  while (node) {
    if (node.parentElement && !['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(node.parentElement.tagName)) nodes.push(node as Text)
    node = walker.nextNode()
  }

  nodes.forEach((textNode) => {
    const value = textNode.textContent || ''
    const trimmed = value.trim()
    if (!trimmed) return
    const translated = translateDynamic(trimmed)
    if (translated === trimmed) return
    const leading = value.match(/^\s*/)?.[0] || ''
    const trailing = value.match(/\s*$/)?.[0] || ''
    textNode.textContent = `${leading}${translated}${trailing}`
  })

  root.querySelectorAll?.<HTMLInputElement>('input[placeholder]').forEach((input) => {
    const placeholder = input.placeholder.trim()
    const map: Record<string, string> = {
      'Cari layanan...': 'Search services...',
      'Cari WhatsApp, Telegram, Google...': 'Search WhatsApp, Telegram, Google...',
      'nama@email.com': 'name@email.com',
    }
    if (map[placeholder]) input.placeholder = map[placeholder]
  })
}

export default function LanguageSystem() {
  useEffect(() => {
    const language = localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'id'
    document.documentElement.dataset.language = language
    document.documentElement.lang = language === 'en' ? 'en' : 'id'
    if (language !== 'en') return

    let queued = false
    const run = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        applyEnglish(document)
      })
    }

    run()
    const observer = new MutationObserver(run)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    window.addEventListener('hashchange', run)
    return () => {
      observer.disconnect()
      window.removeEventListener('hashchange', run)
    }
  }, [])
  return null
}
