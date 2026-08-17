import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type LegalTab = 'terms' | 'privacy' | 'refund' | 'acceptable' | 'disclosure'
type FAQ = { q: string; a: string; tags: string[] }

type LegalSection = { title: string; paragraphs?: string[]; bullets?: string[] }

type Profile = { id?: string; username?: string; email?: string }

const UPDATED_ID = '18 Agustus 2026'
const UPDATED_EN = '18 August 2026'

function isEnglish() { return localStorage.getItem('dlavie-language') === 'en' }
function profile(): Profile | null { try { return JSON.parse(localStorage.getItem('dlavie-account-profile-v1') || 'null') as Profile | null } catch { return null } }
function currentRoute() { return window.location.hash.replace(/^#\/?/, '').split(/[?&]/)[0].toLowerCase() }

const faqId: FAQ[] = [
  { q: 'Apa itu DLavie?', a: 'DLavie adalah marketplace nomor virtual yang dirancang untuk memilih layanan, negara, provider, memantau sesi nomor, menerima OTP, serta mengelola wallet dan histori transaksi dari satu antarmuka.', tags: ['dasar','market'] },
  { q: 'Berapa minimum deposit?', a: 'Minimum deposit yang disiapkan di DLavie adalah Rp1.000. Nominal, metode pembayaran, dan ketersediaan channel mengikuti konfigurasi payment gateway yang aktif.', tags: ['deposit','payment'] },
  { q: 'Apa perbedaan User ID, Wallet ID, dan Order ID?', a: 'User ID mengidentifikasi akun DLavie. Wallet ID mengidentifikasi wallet server untuk saldo dan deposit. Order ID mengidentifikasi satu transaksi deposit atau satu sesi pembelian nomor. Simpan ID tersebut saat meminta bantuan.', tags: ['id','account','wallet'] },
  { q: 'Mengapa beberapa pembayaran belum bisa dibuat?', a: 'Metode pembayaran hanya dapat dipakai jika channel tersebut aktif pada merchant/payment gateway. Selama integrasi masih Sandbox atau channel Core API belum diaktifkan, DLavie akan menampilkan status yang sebenarnya dan tidak membuat transaksi palsu.', tags: ['payment','sandbox'] },
  { q: 'Kapan saldo bertambah?', a: 'Saldo server hanya boleh dikreditkan setelah backend menerima dan memverifikasi status pembayaran yang valid. Tampilan sukses di browser saja tidak dianggap sebagai bukti pembayaran.', tags: ['deposit','security'] },
  { q: 'Berapa lama sesi nomor aktif?', a: 'Durasi sesi ditampilkan pada order. Jika sesi menunggu berakhir sebelum OTP diterima, status berubah menjadi kedaluwarsa dan refund mengikuti status supplier serta kebijakan refund yang berlaku.', tags: ['otp','order','refund'] },
  { q: 'Apakah OTP selalu dijamin masuk?', a: 'Tidak. Pengiriman OTP bergantung pada aplikasi tujuan, operator, supplier, ketersediaan nomor, filtering SMS, dan kondisi jaringan. DLavie menampilkan status sesi agar kegagalan dapat ditangani secara transparan.', tags: ['otp','supplier'] },
  { q: 'Kapan order dapat direfund?', a: 'Secara umum, order yang gagal sebelum layanan berhasil diberikan, sesi yang kedaluwarsa tanpa OTP, atau pembayaran ganda yang terverifikasi dapat memenuhi syarat refund. Order yang sudah berhasil menerima OTP biasanya tidak dapat direfund.', tags: ['refund','order'] },
  { q: 'Apakah saldo wallet bisa ditarik menjadi uang tunai?', a: 'Fitur penarikan saldo tidak otomatis tersedia. Saldo wallet digunakan untuk pembelian layanan dan perlakuan terhadap saldo mengikuti Payment & Refund Policy yang berlaku pada saat transaksi.', tags: ['wallet','refund'] },
  { q: 'Apakah DLavie menyimpan password saya?', a: 'Versi akun saat ini adalah sistem demo browser. Password tidak disimpan sebagai teks biasa; autentikasi production tetap perlu dipindahkan ke backend sebelum layanan publik diluncurkan.', tags: ['account','security'] },
  { q: 'Data apa yang digunakan DLavie?', a: 'Data yang relevan dapat mencakup identitas akun, User ID, metadata wallet dan transaksi, status order, serta log teknis yang diperlukan untuk keamanan dan operasional. Rinciannya ada di Kebijakan Privasi.', tags: ['privacy','data'] },
  { q: 'Apa arti Sandbox?', a: 'Sandbox adalah lingkungan pengujian payment gateway. Transaksi Sandbox tidak boleh dianggap sebagai pembayaran uang sungguhan atau layanan production.', tags: ['sandbox','payment'] },
  { q: 'Bagaimana jika saya salah memilih layanan atau negara?', a: 'Periksa ringkasan order sebelum konfirmasi. Setelah nomor dialokasikan atau OTP diterima, pembatalan dapat dibatasi karena resource supplier sudah digunakan.', tags: ['order','refund'] },
  { q: 'Apakah nomor boleh digunakan untuk aktivitas apa saja?', a: 'Tidak. Penggunaan harus sah dan sesuai kebijakan layanan tujuan. Fraud, spam, harassment, account takeover, penyalahgunaan massal, atau upaya menghindari penegakan kebijakan platform dilarang.', tags: ['acceptable','security'] },
  { q: 'Bagaimana menyiapkan informasi saat meminta bantuan?', a: 'Sertakan User ID, Order ID, waktu kejadian, layanan/provider, status yang terlihat, dan screenshot jika relevan. Jangan pernah mengirim password, Server Key, kode OTP sensitif, atau credential rahasia.', tags: ['support','security'] },
]

const faqEn: FAQ[] = [
  { q: 'What is DLavie?', a: 'DLavie is a virtual-number marketplace designed to let users choose a service, country and provider, monitor number sessions, receive OTP status, and manage wallet activity from one interface.', tags: ['basics','market'] },
  { q: 'What is the minimum deposit?', a: 'DLavie is currently designed around a Rp1,000 minimum deposit. Available amounts and payment methods depend on enabled payment-gateway channels.', tags: ['deposit','payment'] },
  { q: 'What is the difference between User ID, Wallet ID and Order ID?', a: 'User ID identifies the DLavie account, Wallet ID identifies the server-backed balance wallet, and Order ID identifies an individual deposit or number-order transaction.', tags: ['id','account'] },
  { q: 'Why can a payment method be unavailable?', a: 'A payment method can only be used when its channel is enabled for the merchant and environment. DLavie reports the real state instead of simulating a successful charge.', tags: ['payment','sandbox'] },
  { q: 'When is wallet balance credited?', a: 'Server balance should only be credited after the backend receives and verifies a valid payment status. A browser success callback alone is not treated as proof of payment.', tags: ['deposit','security'] },
  { q: 'Is OTP delivery guaranteed?', a: 'No. OTP delivery depends on the destination service, carrier, supplier, number availability, SMS filtering and network conditions.', tags: ['otp','supplier'] },
  { q: 'When can an order be refunded?', a: 'Orders that fail before delivery, expire without OTP, or involve a verified duplicate payment may qualify. Orders that successfully received OTP are generally non-refundable.', tags: ['refund'] },
  { q: 'Can wallet balance be withdrawn as cash?', a: 'Cash withdrawal is not automatically available. Wallet balance is intended for service purchases and is governed by the Payment & Refund Policy.', tags: ['wallet'] },
  { q: 'Does DLavie store my password?', a: 'The current account system is a browser demo. Passwords are not stored as plain text; production authentication still needs to move server-side before public launch.', tags: ['security'] },
  { q: 'What data does DLavie use?', a: 'Relevant data can include account identity, User ID, wallet and transaction metadata, order status and technical logs needed for security and operations.', tags: ['privacy'] },
  { q: 'What does Sandbox mean?', a: 'Sandbox is a payment-gateway testing environment. Sandbox transactions must not be treated as real-money production payments.', tags: ['sandbox'] },
  { q: 'What if I choose the wrong service or country?', a: 'Review the order summary before confirming. Once a number is allocated or an OTP is delivered, cancellation may be restricted because supplier resources have already been consumed.', tags: ['order'] },
  { q: 'Can virtual numbers be used for anything?', a: 'No. Use must be lawful and permitted by the destination service. Fraud, spam, harassment, account takeover, mass abuse, or bypassing platform enforcement is prohibited.', tags: ['acceptable'] },
  { q: 'What should I include in a support request?', a: 'Include User ID, Order ID, incident time, service/provider, visible status, and a screenshot when useful. Never send passwords, Server Keys, sensitive OTPs, or secret credentials.', tags: ['support'] },
]

const legalId: Record<LegalTab, { title: string; intro: string; sections: LegalSection[] }> = {
  terms: {
    title: 'Ketentuan Layanan', intro: 'Aturan utama penggunaan akun, wallet, marketplace nomor virtual, pembayaran, dan order DLavie.', sections: [
      { title: '1. Persetujuan dan kelayakan', paragraphs: ['Dengan membuat akun, melakukan deposit, atau menggunakan layanan DLavie, pengguna menyetujui Ketentuan Layanan ini dan kebijakan terkait. Pengguna bertanggung jawab memastikan penggunaan DLavie sah di yurisdiksinya dan sesuai ketentuan platform tujuan.'], bullets: ['Pengguna harus memiliki kapasitas hukum untuk melakukan transaksi.', 'Informasi akun harus akurat dan dijaga keamanannya.', 'Satu pengguna bertanggung jawab atas aktivitas dari akun dan perangkatnya.'] },
      { title: '2. Sifat layanan', paragraphs: ['DLavie menyediakan antarmuka marketplace untuk memperoleh akses sementara ke nomor virtual dari provider/supplier pihak ketiga. Ketersediaan nomor, operator, negara, harga, waktu pengiriman SMS, dan kompatibilitas dapat berubah.'], bullets: ['Tidak ada jaminan OTP selalu dikirim oleh layanan tujuan.', 'Nomor dapat bersifat sementara dan dapat dialokasikan ulang setelah sesi selesai sesuai sistem supplier.', 'Status demo, Sandbox, atau production harus dibaca sesuai label yang tampil di aplikasi.'] },
      { title: '3. Akun, wallet, dan pembayaran', paragraphs: ['Deposit yang telah diverifikasi akan dikreditkan ke wallet server. Pengguna wajib memeriksa nominal dan metode pembayaran sebelum menyelesaikan transaksi.'], bullets: ['Saldo tidak boleh dikreditkan hanya berdasarkan callback browser.', 'Order dan deposit memiliki reference ID untuk audit dan dukungan.', 'Biaya pihak ketiga atau perubahan harga dapat diberlakukan sebelum konfirmasi order.'] },
      { title: '4. Order dan penyelesaian layanan', paragraphs: ['Order dianggap diproses ketika nomor dialokasikan. Layanan dianggap diberikan ketika OTP/SMS yang diminta diterima atau status supplier menyatakan layanan berhasil sesuai flow produk.'], bullets: ['Order yang sudah menerima OTP umumnya final.', 'Sesi memiliki batas waktu dan dapat kedaluwarsa.', 'Refund mengikuti Payment & Refund Policy.'] },
      { title: '5. Penggunaan yang dilarang', paragraphs: ['DLavie tidak boleh digunakan untuk tindakan ilegal, menipu, merugikan, mengganggu sistem, atau melanggar hak pihak lain. Detail larangan dijelaskan dalam Acceptable Use Policy.'] },
      { title: '6. Penangguhan dan penghentian', paragraphs: ['DLavie dapat membatasi atau menangguhkan akses apabila terdapat indikasi penyalahgunaan, fraud, risiko keamanan, chargeback abuse, pelanggaran kebijakan, atau kewajiban hukum. Jika memungkinkan, keputusan akan didasarkan pada catatan transaksi dan risiko yang relevan.'] },
      { title: '7. Pihak ketiga dan ketersediaan', paragraphs: ['Pembayaran, operator, supplier nomor, dan layanan tujuan adalah sistem pihak ketiga. Gangguan mereka dapat memengaruhi layanan DLavie. DLavie akan berupaya menampilkan status secara transparan tetapi tidak mengendalikan infrastruktur pihak ketiga tersebut.'] },
      { title: '8. Perubahan kebijakan', paragraphs: ['Ketentuan dapat diperbarui untuk perubahan produk, provider, payment gateway, keamanan, atau regulasi. Tanggal pembaruan akan ditampilkan pada Legal Center. Perubahan material sebaiknya diberitahukan sebelum diberlakukan bila memungkinkan.'] },
      { title: '9. Hukum yang berlaku', paragraphs: ['Untuk operasional yang berbasis di Indonesia, ketentuan ini dimaksudkan untuk dibaca bersama hukum Indonesia yang berlaku dan tidak menghapus hak konsumen yang wajib diberikan oleh hukum. Draft ini harus ditinjau secara hukum sebelum peluncuran production.'] },
    ],
  },
  privacy: {
    title: 'Kebijakan Privasi', intro: 'Penjelasan tentang data yang dapat diproses DLavie, tujuan penggunaannya, penyimpanan, pihak ketiga, dan kontrol pengguna.', sections: [
      { title: '1. Data yang dapat diproses', bullets: ['Data akun seperti username, email, User ID dan waktu akun dibuat.', 'Metadata wallet dan transaksi seperti Wallet ID, Order ID, nominal, metode pembayaran, status, dan timestamp.', 'Data order seperti layanan, negara, provider, status sesi, dan event OTP.', 'Data teknis dan keamanan yang diperlukan untuk mendeteksi error, fraud, abuse, dan menjaga layanan.'] },
      { title: '2. Tujuan pemrosesan', bullets: ['Menyediakan akun, wallet, pembayaran, order dan dukungan.', 'Memverifikasi pembayaran dan mencegah kredit saldo palsu.', 'Mengelola refund, sengketa, error, keamanan dan pencegahan abuse.', 'Memenuhi kewajiban hukum dan meningkatkan reliabilitas produk.'] },
      { title: '3. Penyimpanan browser dan server', paragraphs: ['Versi saat ini masih menggunakan beberapa localStorage/sessionStorage untuk state UI dan akun demo, sedangkan wallet/payment tertentu sudah menggunakan backend. Sebelum production, autentikasi dan data sensitif yang relevan harus dipindahkan ke arsitektur server-side yang sesuai.'] },
      { title: '4. Pihak ketiga', paragraphs: ['Data transaksi dapat diproses oleh payment gateway dan data order dapat diproses oleh supplier/provider yang diperlukan untuk memenuhi layanan. Informasi hanya seharusnya dibagikan sejauh diperlukan untuk transaksi, keamanan, dukungan, atau kewajiban hukum.'] },
      { title: '5. Retensi dan penghapusan', paragraphs: ['Data disimpan selama diperlukan untuk layanan, audit transaksi, pencegahan fraud, penyelesaian sengketa, dan kewajiban hukum. Jadwal retensi production perlu ditetapkan secara formal sebelum peluncuran publik.'] },
      { title: '6. Hak pengguna', paragraphs: ['Pengguna dapat meminta informasi, koreksi, akses, atau penghapusan data sesuai hak yang tersedia berdasarkan hukum yang berlaku, dengan memperhatikan kewajiban retensi transaksi dan keamanan.'] },
      { title: '7. Keamanan', paragraphs: ['DLavie menggunakan pemisahan frontend/backend untuk secret pembayaran, wallet token acak, verifikasi status pembayaran server-side, dan kontrol lain yang terus dikembangkan. Tidak ada sistem yang dapat menjamin keamanan absolut.'] },
      { title: '8. Anak dan penggunaan berisiko', paragraphs: ['DLavie tidak dirancang untuk penggunaan oleh anak tanpa dasar hukum/persetujuan yang diperlukan. Penggunaan yang melibatkan penipuan, account takeover, atau aktivitas ilegal dilarang.'] },
    ],
  },
  refund: {
    title: 'Kebijakan Pembayaran & Refund', intro: 'Aturan tentang deposit, saldo, kegagalan order, pembatalan, duplicate payment, dan refund.', sections: [
      { title: '1. Deposit dan saldo', paragraphs: ['Saldo dikreditkan setelah pembayaran diverifikasi oleh backend/payment gateway. Deposit pending belum dianggap sebagai saldo tersedia.'], bullets: ['Nominal minimum mengikuti UI saat transaksi.', 'Status Sandbox tidak mewakili uang sungguhan.', 'Biaya payment gateway dapat berubah sesuai channel production.'] },
      { title: '2. Kondisi yang dapat memenuhi syarat refund', bullets: ['Order gagal sebelum nomor/layanan berhasil diberikan.', 'Sesi kedaluwarsa tanpa OTP ketika supplier mengonfirmasi layanan tidak terpakai.', 'Pembayaran ganda yang dapat diverifikasi.', 'Kesalahan sistem DLavie yang menyebabkan saldo terpotong tanpa order yang valid.'] },
      { title: '3. Kondisi yang umumnya tidak direfund', bullets: ['OTP/SMS telah berhasil diterima.', 'Nomor telah digunakan atau resource supplier telah dikonsumsi.', 'Pengguna salah memilih layanan/negara/provider setelah order tidak lagi dapat dibatalkan.', 'Akun dibatasi karena abuse/fraud dan transaksi terkait sedang dalam investigasi.', 'Kegagalan akibat pelanggaran ketentuan platform tujuan oleh pengguna.'] },
      { title: '4. Bentuk refund', paragraphs: ['Refund order dapat dikembalikan ke saldo wallet atau ke metode pembayaran asal apabila sistem production mendukung dan diwajibkan. Bentuk refund akan mengikuti karakter transaksi serta aturan payment gateway/supplier.'] },
      { title: '5. Waktu penyelesaian', paragraphs: ['Refund wallet dapat diproses setelah status supplier tervalidasi. Refund ke metode pembayaran eksternal dapat memerlukan waktu tambahan sesuai payment gateway dan institusi keuangan. Jangan menjanjikan waktu tetap sebelum SLA production ditetapkan.'] },
      { title: '6. Sengketa', paragraphs: ['Untuk sengketa, pengguna sebaiknya menyertakan User ID, Order ID, waktu transaksi, nominal, metode pembayaran, dan bukti relevan. Jangan membagikan password atau credential rahasia.'] },
    ],
  },
  acceptable: {
    title: 'Acceptable Use Policy', intro: 'Batas penggunaan yang diperbolehkan agar marketplace tetap aman, legal, dan tidak merugikan platform maupun pihak lain.', sections: [
      { title: 'Penggunaan yang diperbolehkan', bullets: ['Pengujian atau verifikasi akun yang dimiliki/dikuasai pengguna secara sah.', 'Penggunaan bisnis yang memiliki otorisasi dan mematuhi aturan platform tujuan.', 'QA/testing produk dengan izin dan tanpa merugikan pihak lain.'] },
      { title: 'Penggunaan yang dilarang', bullets: ['Fraud, phishing, scam, identity theft, account takeover, atau impersonation yang merugikan.', 'Spam, harassment, stalking, ancaman, atau penyebaran konten ilegal.', 'Membuat akun massal untuk menghindari limit, ban, enforcement, atau kontrol keamanan platform.', 'Mengakali verifikasi untuk memperoleh akses yang tidak berhak.', 'Menjual ulang akses secara menipu atau mengoperasikan bot abuse.', 'Menggunakan layanan untuk transaksi ilegal, pencucian uang, atau aktivitas yang melanggar hukum.', 'Mencoba mengeksploitasi, mengganggu, scraping berlebihan, atau menyerang DLavie/supplier/payment infrastructure.'] },
      { title: 'Penegakan', paragraphs: ['DLavie dapat menolak order, menahan transaksi untuk review, membatasi akun, atau menghentikan layanan ketika terdapat sinyal risiko yang kredibel. Penegakan harus proporsional dan didokumentasikan melalui reference ID bila relevan.'] },
    ],
  },
  disclosure: {
    title: 'Service & Risk Disclosure', intro: 'Keterangan penting tentang status produk, ketergantungan pihak ketiga, OTP, saldo, dan lingkungan Sandbox.', sections: [
      { title: 'Status pre-production', paragraphs: ['DLavie masih dalam tahap pengembangan. Beberapa fitur menggunakan data demo/simulasi dan payment gateway Sandbox. Label di UI adalah sumber utama untuk membedakan status tersebut.'] },
      { title: 'Nomor virtual dan OTP', paragraphs: ['Nomor virtual bersifat resource sementara. Layanan tujuan dapat menolak nomor tertentu, menunda SMS, menerapkan rate limit, atau mengubah kebijakan tanpa pemberitahuan kepada DLavie.'] },
      { title: 'Provider dan supplier', paragraphs: ['Stok, operator, harga, dan delivery bergantung pada supplier. Ketika supplier production belum tersambung, data yang tampil harus dianggap simulasi.'] },
      { title: 'Payment gateway', paragraphs: ['Midtrans memproses pembayaran pada integrasi yang sedang dikembangkan. Metode yang tersedia berbeda antara Sandbox/Production dan bergantung pada channel merchant yang diaktifkan.'] },
      { title: 'Tidak ada jaminan hasil pada layanan tujuan', paragraphs: ['Pembelian nomor atau penerimaan OTP tidak menjamin akun pada layanan tujuan akan diterima, tetap aktif, atau bebas dari review platform. Pengguna wajib mematuhi aturan layanan tujuan.'] },
    ],
  },
}

const legalEn: Record<LegalTab, { title: string; intro: string; sections: LegalSection[] }> = {
  terms: { title: 'Terms of Service', intro: 'Core rules for accounts, wallet, virtual-number marketplace activity, payments and orders.', sections: [
    { title: '1. Agreement and eligibility', paragraphs: ['By creating an account, depositing funds, or using DLavie, you agree to these Terms and related policies. You are responsible for ensuring your use is lawful and permitted by the destination service.'], bullets: ['You must have legal capacity to transact.', 'Account information must be accurate and protected.', 'You are responsible for activity from your account and device.'] },
    { title: '2. Nature of the service', paragraphs: ['DLavie provides a marketplace interface for temporary access to virtual numbers supplied by third parties. Availability, carrier, country, price, SMS timing and compatibility may change.'], bullets: ['OTP delivery is not guaranteed.', 'Numbers may be temporary and later reallocated according to supplier systems.', 'Demo, Sandbox and Production labels must be read as shown in the app.'] },
    { title: '3. Wallet and payments', paragraphs: ['Verified deposits are credited to the server wallet. Users must review amount and payment method before completing a transaction.'], bullets: ['Browser callbacks alone must not credit balance.', 'Orders and deposits use reference IDs for audit/support.', 'Third-party fees and pricing may change before confirmation.'] },
    { title: '4. Orders and service completion', paragraphs: ['An order begins when a number is allocated. Service is generally considered delivered when the requested OTP/SMS is received or supplier status confirms successful delivery.'] },
    { title: '5. Prohibited use', paragraphs: ['DLavie may not be used for unlawful, deceptive, harmful, abusive, or rights-infringing activity. See the Acceptable Use Policy.'] },
    { title: '6. Suspension', paragraphs: ['Access may be limited for abuse, fraud, security risk, chargeback abuse, policy violations, or legal obligations.'] },
    { title: '7. Third parties', paragraphs: ['Payment processors, carriers, suppliers and destination services are third parties. Their outages or policy changes may affect DLavie.'] },
    { title: '8. Policy changes', paragraphs: ['Policies may be updated for product, provider, payment, security, or regulatory changes. Material changes should be communicated when practical.'] },
    { title: '9. Applicable law', paragraphs: ['For Indonesia-based operations, these terms are intended to operate alongside applicable Indonesian law and mandatory consumer rights. Legal review is required before Production launch.'] },
  ] },
  privacy: { title: 'Privacy Policy', intro: 'How DLavie may process account, wallet, transaction, order and technical data.', sections: [
    { title: '1. Data categories', bullets: ['Account data such as username, email, User ID and creation time.', 'Wallet and transaction metadata including Wallet ID, Order ID, amount, method, status and timestamps.', 'Order data including service, country, provider and session status.', 'Technical/security logs required for reliability, fraud prevention and abuse prevention.'] },
    { title: '2. Purposes', bullets: ['Provide accounts, wallet, payments, orders and support.', 'Verify payments and prevent false balance credits.', 'Manage refunds, disputes, errors, security and abuse.', 'Meet legal obligations and improve reliability.'] },
    { title: '3. Browser and server storage', paragraphs: ['The current build still uses localStorage/sessionStorage for some UI state and demo account authentication, while wallet/payment data is partly server-backed. Production authentication should be moved server-side before public launch.'] },
    { title: '4. Third parties', paragraphs: ['Transaction data may be processed by payment providers and order data by suppliers/providers as necessary to provide the service.'] },
    { title: '5. Retention', paragraphs: ['Data should be retained only as needed for service delivery, transaction audit, fraud prevention, disputes and legal obligations. A formal Production retention schedule must be defined.'] },
    { title: '6. User rights', paragraphs: ['Users may request access, correction, information or deletion where available under applicable law, subject to transaction-retention and security obligations.'] },
    { title: '7. Security', paragraphs: ['DLavie uses frontend/backend separation for payment secrets, random wallet tokens and server-side payment verification, with additional controls planned for Production.'] },
  ] },
  refund: { title: 'Payment & Refund Policy', intro: 'Rules for deposits, failed orders, cancellations, duplicate payments and refunds.', sections: [
    { title: '1. Deposits', paragraphs: ['Balance is credited only after verified payment status. Pending deposits are not available balance.'] },
    { title: '2. Potentially refundable cases', bullets: ['Order fails before service delivery.', 'Session expires without OTP and supplier confirms the resource was unused.', 'Verified duplicate payment.', 'DLavie system error deducts balance without a valid order.'] },
    { title: '3. Generally non-refundable cases', bullets: ['OTP/SMS was successfully delivered.', 'Number or supplier resource was consumed.', 'Wrong service/country/provider was chosen after cancellation is no longer possible.', 'Transactions under fraud/abuse investigation.', 'Failure caused by a user violation of destination-platform rules.'] },
    { title: '4. Refund method', paragraphs: ['Refunds may return to wallet balance or original payment method where Production systems support or require it.'] },
    { title: '5. Timing', paragraphs: ['External refunds may take additional time based on payment provider and financial institution processing. A fixed SLA should not be promised until Production rules are finalized.'] },
  ] },
  acceptable: { title: 'Acceptable Use Policy', intro: 'Rules designed to keep the marketplace lawful, safe and non-abusive.', sections: [
    { title: 'Permitted examples', bullets: ['Verification for accounts you lawfully own or control.', 'Authorized business use that follows destination-platform rules.', 'QA/testing with permission and without harming others.'] },
    { title: 'Prohibited activity', bullets: ['Fraud, phishing, scams, identity theft, account takeover or harmful impersonation.', 'Spam, harassment, stalking, threats or illegal content.', 'Mass-account creation to evade limits, bans or security enforcement.', 'Bypassing verification to gain unauthorized access.', 'Abusive resale, bot abuse, illegal transactions or money laundering.', 'Attacking, exploiting or excessively scraping DLavie or third-party infrastructure.'] },
    { title: 'Enforcement', paragraphs: ['DLavie may reject orders, hold transactions for review, restrict accounts, or terminate access when credible risk signals exist.'] },
  ] },
  disclosure: { title: 'Service & Risk Disclosure', intro: 'Important information about pre-production status, suppliers, OTP delivery and payment environments.', sections: [
    { title: 'Pre-production status', paragraphs: ['DLavie is still under development. Some features use demo/simulated data and payment-gateway Sandbox environments.'] },
    { title: 'Virtual numbers and OTP', paragraphs: ['Virtual numbers are temporary resources. Destination services may reject specific numbers, delay SMS, rate-limit, or change policy independently.'] },
    { title: 'Providers and suppliers', paragraphs: ['Stock, carriers, pricing and delivery depend on suppliers. Until a Production supplier is connected, displayed supplier data must be treated as simulated.'] },
    { title: 'Payment gateway', paragraphs: ['Midtrans is used for the payment integration under development. Available methods vary by environment and merchant channel activation.'] },
    { title: 'No destination-platform guarantee', paragraphs: ['Receiving a number or OTP does not guarantee that a destination account will be accepted, remain active, or avoid platform review.'] },
  ] },
}

function LegalDocument({ tab, english }: { tab: LegalTab; english: boolean }) {
  const doc = (english ? legalEn : legalId)[tab]
  return <article className="legal-document">
    <header><span>{english ? 'DLAVIE LEGAL' : 'DLAVIE LEGAL'}</span><h2>{doc.title}</h2><p>{doc.intro}</p><div><b>{english ? 'Last updated' : 'Diperbarui'} · {english ? UPDATED_EN : UPDATED_ID}</b><em>PRE-PRODUCTION</em></div></header>
    {doc.sections.map(section => <section key={section.title}><h3>{section.title}</h3>{section.paragraphs?.map((p,i)=><p key={i}>{p}</p>)}{section.bullets && <ul>{section.bullets.map((b,i)=><li key={i}>{b}</li>)}</ul>}</section>)}
    <aside>{english ? 'Operational draft for product transparency. Obtain qualified legal review before Production launch and before relying on this text as final legal documentation.' : 'Draft operasional untuk transparansi produk. Lakukan review oleh penasihat hukum yang kompeten sebelum peluncuran Production dan sebelum menjadikan teks ini dokumen hukum final.'}</aside>
  </article>
}

function FooterLinks({ footer, english }: { footer: HTMLElement; english: boolean }) {
  const go = (path: string) => { window.location.hash = `/${path}`; window.scrollTo({ top: 0, behavior: 'auto' }) }
  return createPortal(<nav className="footer-policy-links" aria-label={english ? 'Help and legal links' : 'Tautan bantuan dan legal'}>
    <button onClick={()=>go('help')}>{english?'FAQ & Help':'FAQ & Bantuan'}</button>
    <button onClick={()=>go('legal')}>{english?'Terms':'Ketentuan'}</button>
    <button onClick={()=>go('legal?tab=privacy')}>{english?'Privacy':'Privasi'}</button>
    <button onClick={()=>go('legal?tab=refund')}>{english?'Refunds':'Refund'}</button>
    <button onClick={()=>go('legal?tab=acceptable')}>Acceptable Use</button>
  </nav>, footer)
}

export default function MarketPolicies() {
  const [english,setEnglish]=useState(()=>isEnglish())
  const [query,setQuery]=useState('')
  const [openFaq,setOpenFaq]=useState<number|null>(0)
  const [legalTab,setLegalTab]=useState<LegalTab>('terms')
  const [footer,setFooter]=useState<HTMLElement|null>(null)
  const [revision,setRevision]=useState(0)
  const faqs=english?faqEn:faqId

  useEffect(()=>{
    const sync=()=>{setEnglish(isEnglish());setRevision(v=>v+1)}
    const route=()=>{
      const hash=window.location.hash
      const raw=hash.split('?')[1]||''
      const params=new URLSearchParams(raw)
      const tab=params.get('tab') as LegalTab|null
      if(tab&&['terms','privacy','refund','acceptable','disclosure'].includes(tab)) setLegalTab(tab)
      setOpenFaq(0)
    }
    sync();route();window.addEventListener('storage',sync);window.addEventListener('dlavie:state-changed',sync);window.addEventListener('hashchange',route)
    const find=()=>setFooter(document.querySelector<HTMLElement>('.footer'))
    find();const observer=new MutationObserver(find);observer.observe(document.body,{childList:true,subtree:true})
    return()=>{observer.disconnect();window.removeEventListener('storage',sync);window.removeEventListener('dlavie:state-changed',sync);window.removeEventListener('hashchange',route)}
  },[])

  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();if(!q)return faqs
    return faqs.filter(item=>`${item.q} ${item.a} ${item.tags.join(' ')}`.toLowerCase().includes(q))
  },[faqs,query])
  const p=useMemo(()=>profile(),[revision])

  const tabs:Array<{id:LegalTab;idLabel:string;enLabel:string}>=[
    {id:'terms',idLabel:'Ketentuan Layanan',enLabel:'Terms of Service'},
    {id:'privacy',idLabel:'Kebijakan Privasi',enLabel:'Privacy Policy'},
    {id:'refund',idLabel:'Pembayaran & Refund',enLabel:'Payment & Refund'},
    {id:'acceptable',idLabel:'Acceptable Use',enLabel:'Acceptable Use'},
    {id:'disclosure',idLabel:'Service Disclosure',enLabel:'Service Disclosure'},
  ]

  return <>
    <section className="help-center-page market-info-page" aria-label={english?'DLavie Help Center':'Pusat Bantuan DLavie'}>
      <div className="market-info-shell">
        <header className="info-hero"><span>DLAVIE SUPPORT</span><h1>{english?'Answers without the runaround.':'Jawaban yang jelas, tanpa muter-muter.'}</h1><p>{english?'Find payment, wallet, order, OTP, refund and account guidance from one place.':'Cari panduan pembayaran, wallet, order, OTP, refund, dan akun dari satu tempat.'}</p><div className="info-hero-meta"><b>{p?.id|| (english?'Guest user':'Pengguna tamu')}</b><i/> <span>{english?'Pre-production knowledge base':'Knowledge base pre-production'}</span></div></header>
        <label className="faq-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={english?'Search payment, OTP, refund, account…':'Cari pembayaran, OTP, refund, akun…'}/><kbd>{filtered.length}</kbd></label>
        <div className="support-quick-grid">
          <article><span>01</span><strong>{english?'Keep your references':'Simpan reference ID'}</strong><p>{english?'User ID, Wallet ID and Order ID speed up troubleshooting.':'User ID, Wallet ID, dan Order ID mempercepat pengecekan masalah.'}</p></article>
          <article><span>02</span><strong>{english?'Never share secrets':'Jangan kirim credential rahasia'}</strong><p>{english?'Do not send passwords, Server Keys or sensitive OTPs in support messages.':'Jangan kirim password, Server Key, atau OTP sensitif dalam pesan bantuan.'}</p></article>
          <article><span>03</span><strong>{english?'Read the environment':'Periksa environment'}</strong><p>{english?'Sandbox, demo supplier data and Production have different meanings.':'Sandbox, data supplier demo, dan Production memiliki arti yang berbeda.'}</p></article>
        </div>
        <div className="faq-layout">
          <aside className="support-reference"><span>{english?'SUPPORT CHECKLIST':'CHECKLIST BANTUAN'}</span><h2>{english?'Before reporting a problem':'Sebelum melaporkan masalah'}</h2><p>{english?'Prepare the information that lets an operator trace the event without exposing secrets.':'Siapkan informasi yang membantu operator melacak kejadian tanpa membocorkan rahasia.'}</p><dl><div><dt>User ID</dt><dd>{p?.id||'—'}</dd></div><div><dt>{english?'Order / Deposit ID':'Order / Deposit ID'}</dt><dd>{english?'From Activity or Wallet history':'Dari Aktivitas atau riwayat Wallet'}</dd></div><div><dt>{english?'Incident time':'Waktu kejadian'}</dt><dd>{english?'Include timezone when possible':'Sertakan zona waktu jika memungkinkan'}</dd></div><div><dt>{english?'Screenshot':'Screenshot'}</dt><dd>{english?'Hide passwords and secret credentials':'Sensor password dan credential rahasia'}</dd></div></dl></aside>
          <div className="faq-list">{filtered.length?filtered.map((item,index)=><article className={openFaq===index?'open':''} key={item.q}><button type="button" onClick={()=>setOpenFaq(openFaq===index?null:index)} aria-expanded={openFaq===index}><span><small>{String(index+1).padStart(2,'0')}</small><strong>{item.q}</strong></span><b>{openFaq===index?'−':'+'}</b></button>{openFaq===index&&<p>{item.a}</p>}</article>):<div className="faq-empty">{english?'No answer matches that search yet.':'Belum ada jawaban yang cocok dengan pencarian itu.'}</div>}</div>
        </div>
        <section className="support-policy-callout"><div><span>{english?'NEED THE RULES?':'BUTUH KEBIJAKANNYA?'}</span><h2>{english?'Read how DLavie handles payments, privacy, refunds and acceptable use.':'Lihat aturan pembayaran, privasi, refund, dan penggunaan yang diperbolehkan.'}</h2></div><button onClick={()=>{window.location.hash='/legal'}}>{english?'Open Legal Center':'Buka Legal Center'} <b>→</b></button></section>
      </div>
    </section>

    <section className="legal-center-page market-info-page" aria-label={english?'DLavie Legal Center':'Legal Center DLavie'}>
      <div className="market-info-shell legal-shell">
        <header className="info-hero legal-hero"><span>DLAVIE LEGAL CENTER</span><h1>{english?'Clear rules for a serious marketplace.':'Aturan yang jelas untuk marketplace yang serius.'}</h1><p>{english?'Terms, privacy, payments, refunds, acceptable use and product-risk disclosures in one place.':'Ketentuan, privasi, pembayaran, refund, acceptable use, dan disclosure risiko produk dalam satu tempat.'}</p><div className="info-hero-meta"><b>{english?'Updated':'Diperbarui'} · {english?UPDATED_EN:UPDATED_ID}</b><i/><span>PRE-PRODUCTION</span></div></header>
        <div className="legal-layout"><nav className="legal-tabs" aria-label="Legal documents">{tabs.map(tab=><button type="button" key={tab.id} className={legalTab===tab.id?'active':''} onClick={()=>{setLegalTab(tab.id);history.replaceState(null,'',`${window.location.pathname}${window.location.search}#/legal?tab=${tab.id}`)}}><span>{english?tab.enLabel:tab.idLabel}</span><b>→</b></button>)}</nav><LegalDocument tab={legalTab} english={english}/></div>
      </div>
    </section>
    {footer&&<FooterLinks footer={footer} english={english}/>} 
  </>
}
