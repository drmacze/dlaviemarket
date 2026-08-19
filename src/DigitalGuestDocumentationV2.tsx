import { useEffect, useMemo, useState } from 'react'

type DocPage='overview'|'market'|'how'|'payments'|'security'|'activity'|'help'|'legal'
type Section={title:string;text:string;bullets?:string[]}
type Doc={eyebrow:string;title:string;intro:string;sections:Section[]}

function isEnglish(){return localStorage.getItem('dlavie-language')==='en'}
function pageFromHash():DocPage|null{
  const route=window.location.hash.replace(/^#\/?/,'').split('?')[0].toLowerCase()
  if(route==='docs/overview')return'overview'
  if(route==='docs/market'||route==='docs/product')return'market'
  if(route==='docs/how')return'how'
  if(route==='docs/payments')return'payments'
  if(route==='docs/security')return'security'
  if(route==='docs/activity')return'activity'
  if(route==='docs/help'||route==='docs/faq'||route==='help'||route==='faq')return'help'
  if(route==='docs/legal'||route==='legal'||route==='terms'||route==='privacy')return'legal'
  return route.startsWith('docs/')?'overview':null
}
function go(page:DocPage){window.location.hash=`/docs/${page}`;window.scrollTo({top:0,behavior:'auto'})}
function openAuth(){document.querySelector<HTMLButtonElement>('.avatar-button')?.click()}

const id:Record<DocPage,Doc>={
 overview:{eyebrow:'DLAVIE DOCUMENTATION',title:'Satu marketplace untuk kebutuhan digital.',intro:'Dokumentasi publik DLavie mengikuti struktur produk utama: Digital Market, Wallet, transaksi, keamanan, aktivitas, bantuan, dan kebijakan.',sections:[
  {title:'Digital Market sebagai pusat layanan',text:'DLavie dirancang untuk Pulsa, Paket Data, PLN, E-Wallet, Voucher & Game, pembayaran tagihan, serta Nomor Virtual sebagai layanan tambahan.'},
  {title:'Satu Wallet, banyak jenis transaksi',text:'Deposit, pembelian prabayar, pembayaran pascabayar, refund, dan histori transaksi menggunakan konteks Wallet dan reference yang dapat ditelusuri.'},
  {title:'Status supplier ditampilkan apa adanya',text:'Katalog, SKU, harga, status pending/sukses/gagal, environment Testing/Production, dan proses sinkronisasi ditampilkan berdasarkan keadaan backend—bukan data palsu.'},
 ]},
 market:{eyebrow:'DIGITAL MARKET',title:'Pulsa, data, PLN, e-wallet, voucher, tagihan, dan lainnya.',intro:'Market utama DLavie adalah marketplace produk digital. Nomor Virtual tetap tersedia, tetapi bukan lagi wajah utama produk.',sections:[
  {title:'Produk prabayar',text:'Pulsa, Paket Data, token PLN, top up e-wallet, voucher dan game dibeli dengan memilih kategori, brand/SKU, tujuan, lalu membayar menggunakan Wallet.',bullets:['Harga dan SKU mengikuti katalog supplier yang tersinkron.','Tujuan seperti nomor HP atau ID pelanggan harus diperiksa sebelum konfirmasi.','SN/token/message supplier disimpan pada receipt dan riwayat jika tersedia.']},
  {title:'Produk pascabayar',text:'Tagihan menggunakan flow inquiry terlebih dahulu. Detail pelanggan, periode, dan total harus diperiksa sebelum pembayaran dilakukan.'},
  {title:'Nomor Virtual',text:'Nomor Virtual tetap tersedia sebagai layanan tambahan dengan lifecycle sesi/OTP tersendiri karena karakteristiknya berbeda dari pulsa atau tagihan.'},
  {title:'SYNC dan 0 SKU',text:'Jika kategori menampilkan SYNC atau 0 SKU, UI kategori sudah siap tetapi katalog supplier belum tersedia atau belum disinkronkan. DLavie tidak mengarang harga atau produk aktif.'},
 ]},
 how:{eyebrow:'CARA KERJA',title:'Flow mengikuti jenis produk yang dibeli.',intro:'Prabayar, pascabayar, dan Nomor Virtual tidak dipaksa memakai alur yang sama.',sections:[
  {title:'01 · Isi Wallet',text:'Tambahkan saldo mulai Rp1.000 melalui channel pembayaran yang aktif. Saldo dianggap sah setelah diverifikasi backend.'},
  {title:'02 · Pilih produk',text:'Pilih kategori, brand/SKU, dan tujuan. Katalog aktual berasal dari backend/supplier saat integrasi aktif.'},
  {title:'03 · Prabayar: checkout → supplier',text:'Backend memverifikasi Wallet, membuat reference, mencegah duplikasi request, lalu meneruskan transaksi ke supplier jika environment mengizinkan.'},
  {title:'04 · Pascabayar: inquiry → review → bayar',text:'Detail tagihan diperiksa dahulu. Wallet baru didebit pada tahap pembayaran, bukan saat inquiry.'},
  {title:'05 · Pantau hasil',text:'Status supplier, receipt, SN/token, refund, atau reconciliation dapat ditinjau dari Aktivitas dan riwayat transaksi.'},
 ]},
 payments:{eyebrow:'WALLET & PEMBAYARAN',title:'Saldo dan transaksi diputuskan oleh backend.',intro:'Browser hanya menampilkan state; sumber kebenaran pembayaran dan perubahan saldo berada pada backend/ledger.',sections:[
  {title:'Deposit Wallet',text:'Minimum deposit DLavie tetap Rp1.000. Saldo tidak boleh bertambah hanya karena callback browser menampilkan sukses.'},
  {title:'Debit transaksi',text:'Sebelum debit, backend memeriksa identitas Wallet, SKU, harga, request, dan kondisi transaksi. Idempotency digunakan untuk mengurangi double checkout dan double debit.'},
  {title:'Pending dan reconciliation',text:'Pending belum final. Status dapat diperiksa kembali secara terkontrol agar callback terlambat atau supplier yang belum final tidak menghasilkan transaksi baru sembarangan.'},
  {title:'Refund',text:'Transaksi gagal yang sudah mendebit Wallet harus dipulihkan sesuai ledger secara idempotent. Transaksi sukses yang sudah memenuhi produk ke tujuan pengguna umumnya final.'},
 ]},
 security:{eyebrow:'KEAMANAN',title:'Credential sensitif tidak berada di frontend.',intro:'DLavie memisahkan UI publik dari operasi supplier, payment, Wallet, webhook, dan reconciliation.',sections:[
  {title:'Supplier dan payment secrets',text:'Credential supplier, Server Key payment gateway, webhook secret, dan konfigurasi sensitif disimpan di backend/Vault atau secret environment.'},
  {title:'Wallet ledger & idempotency',text:'Debit/refund menggunakan reference dan kontrol idempotency untuk mengurangi risiko perubahan saldo ganda.'},
  {title:'Webhook dan status final',text:'Callback supplier diproses server-side dan status final dilindungi agar callback terlambat tidak mengembalikan transaksi sukses/gagal ke state sebelumnya.'},
  {title:'Pre-production',text:'Autentikasi akun dan beberapa komponen masih dalam tahap penguatan sebelum layanan publik Production penuh.'},
 ]},
 activity:{eyebrow:'AKTIVITAS',title:'Satu timeline untuk transaksi digital dan Wallet.',intro:'Aktivitas memprioritaskan order produk digital, lalu menampilkan pergerakan Wallet, refund, dan sesi Nomor Virtual dalam konteks yang sama.',sections:[
  {title:'Order digital',text:'Pulsa, data, PLN, e-wallet, voucher/game, dan tagihan dapat memiliki reference, tujuan, harga, status supplier, SN/token, dan pesan hasil.'},
  {title:'Wallet',text:'Deposit, debit pembelian, refund, dan status pembayaran dapat ditinjau untuk membantu audit dan dukungan.'},
  {title:'Order yang perlu perhatian',text:'Reserved/pending/inquired dapat memerlukan status check atau reconciliation sampai hasil final diterima.'},
  {title:'Nomor Virtual',text:'Sesi nomor dan OTP tetap muncul sebagai aktivitas tambahan dengan status dan timer tersendiri.'},
 ]},
 help:{eyebrow:'PUSAT BANTUAN',title:'Panduan transaksi tanpa konteks yang tertinggal.',intro:'Bantuan DLavie sekarang berfokus pada Digital Market, supplier, Wallet, status order, tagihan, refund, dan Nomor Virtual sebagai layanan tambahan.',sections:[
  {title:'Saat kategori masih SYNC',text:'Artinya katalog supplier belum tersinkron atau belum diaktifkan. Tunggu katalog tersedia sebelum menganggap produk tersebut siap transaksi.'},
  {title:'Saat order Pending',text:'Jangan langsung membuat order pengganti berkali-kali. Gunakan Cek status/reconciliation agar status transaksi pertama diketahui.'},
  {title:'Saat meminta bantuan',text:'Sertakan User ID, reference/order ID, kategori/produk, waktu kejadian, status terakhir, dan screenshot bila perlu. Jangan pernah mengirim password, Wallet token, credential supplier, Server Key, atau OTP sensitif.'},
  {title:'Kesalahan tujuan',text:'Untuk produk digital yang sudah sukses dikirim supplier, salah nomor/ID tujuan biasanya tidak dapat dibatalkan. Periksa tujuan sebelum bayar.'},
 ]},
 legal:{eyebrow:'LEGAL CENTER',title:'Kebijakan mengikuti Digital Market yang sebenarnya.',intro:'Ketentuan mencakup produk prabayar, pascabayar, Wallet, supplier pihak ketiga, refund, keamanan, dan Nomor Virtual.',sections:[
  {title:'Terms of Service',text:'Mengatur akun, Wallet, pembelian produk digital, inquiry/tagihan, supplier pihak ketiga, finalitas transaksi, Nomor Virtual, dan tanggung jawab pengguna.'},
  {title:'Privacy Policy',text:'Mencakup metadata akun/Wallet, SKU, tujuan transaksi, status, inquiry tagihan, SN/token, event Nomor Virtual, log keamanan, dan pihak ketiga yang relevan.'},
  {title:'Payment & Refund',text:'Menjelaskan verifikasi deposit, debit Wallet, pending, gagal, reconciliation, refund, transaksi sukses, serta perbedaan aturan Nomor Virtual.'},
  {title:'Acceptable Use & Disclosure',text:'Melarang fraud, spam, account takeover, manipulasi pembayaran, abuse massal, dan menjelaskan ketergantungan pada supplier, biller, operator, serta payment gateway.'},
 ]},
}

const enDocs:Record<DocPage,Doc>={
 overview:{eyebrow:'DLAVIE DOCUMENTATION',title:'One marketplace for digital needs.',intro:'DLavie public documentation now mirrors the real product structure: Digital Market, Wallet, transactions, security, activity, help and legal.',sections:[{title:'Digital Market is the product hub',text:'DLavie is built for mobile credit, data packages, PLN, e-wallet top ups, vouchers & games, bills, plus Virtual Number as an additional service.'},{title:'One Wallet across product types',text:'Deposits, prepaid purchases, postpaid payments and refunds are tied to traceable references.'},{title:'Supplier state is shown honestly',text:'Catalog, SKU, price and transaction status reflect backend state instead of invented live data.'}]},
 market:{eyebrow:'DIGITAL MARKET',title:'Credit, data, electricity, wallet, vouchers, bills and more.',intro:'DLavie is a digital-products marketplace; Virtual Number remains an additional service.',sections:[{title:'Prepaid products',text:'Choose category, brand/SKU and destination, then pay with Wallet.'},{title:'Postpaid products',text:'Bills use inquiry first so customer details and totals can be reviewed before payment.'},{title:'Virtual Number',text:'Virtual Number keeps a separate OTP/session lifecycle.'},{title:'SYNC / 0 SKU',text:'The UI is ready but supplier catalog is not available yet; DLavie does not invent live catalog entries.'}]},
 how:{eyebrow:'HOW IT WORKS',title:'Each product uses the right transaction flow.',intro:'Prepaid, postpaid and Virtual Number are handled differently.',sections:[{title:'01 · Fund Wallet',text:'Add balance through an enabled payment channel and wait for backend verification.'},{title:'02 · Choose a product',text:'Select category, brand/SKU and destination.'},{title:'03 · Prepaid checkout',text:'Backend verifies Wallet and request state before supplier submission.'},{title:'04 · Postpaid inquiry and pay',text:'Review bill details before Wallet is charged.'},{title:'05 · Track the result',text:'Activity stores supplier state, receipt, token/SN, refunds and reconciliation outcomes.'}]},
 payments:{eyebrow:'WALLET & PAYMENTS',title:'Backend decides balance and transaction truth.',intro:'Browser UI never becomes the source of truth for Wallet changes.',sections:[{title:'Wallet deposits',text:'DLavie keeps the Rp1,000 minimum deposit and credits balance only after server verification.'},{title:'Transaction debit',text:'Request validation and idempotency reduce duplicate checkout and debit risk.'},{title:'Pending & reconciliation',text:'Pending orders can be checked in a controlled manner until a final state is known.'},{title:'Refunds',text:'Failed debited transactions are restored through ledger-backed idempotent refund handling.'}]},
 security:{eyebrow:'SECURITY',title:'Sensitive credentials stay off the frontend.',intro:'Supplier, payment, Wallet, webhook and reconciliation operations are separated from the public UI.',sections:[{title:'Supplier/payment secrets',text:'Sensitive credentials belong in backend secrets or Vault.'},{title:'Wallet ledger',text:'References and idempotency protect debit/refund operations.'},{title:'Webhook finality',text:'Late callbacks must not roll final transactions backward.'},{title:'Pre-production',text:'Account authentication and remaining controls still require production hardening.'}]},
 activity:{eyebrow:'ACTIVITY',title:'One timeline for digital orders and Wallet.',intro:'Digital purchases are primary, with Wallet movements, refunds and Virtual Number sessions alongside them.',sections:[{title:'Digital orders',text:'Orders can include reference, destination, supplier state and token/SN output.'},{title:'Wallet activity',text:'Deposits, purchase debits and refunds are traceable.'},{title:'Needs attention',text:'Reserved/pending/inquired transactions may need status checks or reconciliation.'},{title:'Virtual Number',text:'OTP sessions remain visible as an additional activity type.'}]},
 help:{eyebrow:'HELP CENTER',title:'Support content that matches Digital Market.',intro:'Help now covers catalog sync, supplier state, Wallet, bills, refunds and Virtual Number as an additional service.',sections:[{title:'SYNC categories',text:'Catalog is not yet synchronized or enabled.'},{title:'Pending orders',text:'Avoid repeated replacement orders before checking the original transaction status.'},{title:'Support references',text:'Keep User ID, order/reference, time, last status and screenshots; never send secrets.'},{title:'Wrong destination',text:'A supplier-successful product sent to the entered destination is generally final.'}]},
 legal:{eyebrow:'LEGAL CENTER',title:'Policies aligned with the real Digital Market.',intro:'Terms cover prepaid/postpaid products, Wallet, suppliers, refunds, security and Virtual Number.',sections:[{title:'Terms of Service',text:'Account, Wallet, digital purchases, bills, suppliers and user responsibility.'},{title:'Privacy Policy',text:'Account, Wallet, transaction, bill inquiry and supplier-output metadata.'},{title:'Payment & Refund',text:'Deposit verification, debit, pending state, failure, reconciliation and refund.'},{title:'Acceptable Use & Disclosure',text:'Prohibited abuse and third-party service dependencies.'}]},
}

export default function DigitalGuestDocumentationV2(){
 const [page,setPage]=useState<DocPage|null>(pageFromHash)
 const [menu,setMenu]=useState(false)
 const [english,setEnglish]=useState(isEnglish)
 useEffect(()=>{const route=()=>{setPage(pageFromHash());setMenu(false);setEnglish(isEnglish());window.scrollTo({top:0,behavior:'auto'})};route();window.addEventListener('hashchange',route);window.addEventListener('storage',route);return()=>{window.removeEventListener('hashchange',route);window.removeEventListener('storage',route)}},[])
 const docs=english?enDocs:id
 const doc=page?docs[page]:null
 const nav=useMemo(()=>english?[
  ['overview','Overview'],['market','Digital Market'],['how','How it works'],['payments','Wallet & Payments'],['security','Security'],['activity','Activity'],['help','Help'],['legal','Legal'],
 ]:[['overview','Ringkasan'],['market','Digital Market'],['how','Cara kerja'],['payments','Wallet & Pembayaran'],['security','Keamanan'],['activity','Aktivitas'],['help','Bantuan'],['legal','Legal']],[english])
 if(!page||!doc)return null
 const toggleLanguage=()=>{const next=!english;localStorage.setItem('dlavie-language',next?'en':'id');setEnglish(next);window.dispatchEvent(new Event('dlavie:language-change'))}
 return <div className="dlv-guest-doc-v2">
  <header className="dlv-doc-topbar"><button className="dlv-doc-brand" onClick={()=>go('overview')}><b>D</b><span><strong>DLavie</strong><small>Digital Market Docs</small></span></button><div><button onClick={toggleLanguage}>{english?'ID':'EN'}</button><button className="is-login" onClick={openAuth}>{english?'Sign in':'Masuk'}</button><button className="is-menu" onClick={()=>setMenu(v=>!v)} aria-label="Menu">☰</button></div></header>
  <aside className={`dlv-doc-sidebar${menu?' open':''}`}><div className="dlv-doc-sidebar-head"><span>{english?'DOCUMENTATION':'DOKUMENTASI'}</span><small>Digital Market · Public access</small></div><nav>{nav.map(([key,label],index)=><button key={key} className={page===key?'active':''} onClick={()=>go(key as DocPage)}><i>{String(index+1).padStart(2,'0')}</i><span>{label}</span><b>→</b></button>)}</nav><div className="dlv-doc-sidebar-foot"><strong>DLavie Market</strong><p>{english?'Transactions require an account, Wallet and accepted policies.':'Transaksi membutuhkan akun, Wallet, dan persetujuan kebijakan.'}</p></div></aside>
  {menu&&<button className="dlv-doc-scrim" onClick={()=>setMenu(false)} aria-label="Tutup menu"/>}
  <main className="dlv-doc-main"><section className="dlv-doc-hero"><span>{doc.eyebrow}</span><h1>{doc.title}</h1><p>{doc.intro}</p><div className="dlv-doc-actions"><button onClick={openAuth}>{english?'Sign in to DLavie':'Masuk ke DLavie'} <b>→</b></button><button onClick={()=>go('market')}>{english?'Explore Digital Market docs':'Lihat dokumentasi Market'}</button></div></section>
   {page==='overview'&&<section className="dlv-doc-status"><div><small>01</small><strong>{english?'Public documentation':'Dokumentasi publik'}</strong><span>{english?'No login required':'Tanpa login'}</span></div><div><small>02</small><strong>Digital Market & Wallet</strong><span>{english?'Account required to transact':'Akun diperlukan untuk transaksi'}</span></div><div><small>03</small><strong>{english?'Supplier-backed states':'Status berbasis supplier'}</strong><span>SKU · price · status · reference</span></div></section>}
   <section className="dlv-doc-sections">{doc.sections.map((section,index)=><article key={section.title}><div className="dlv-doc-index">{String(index+1).padStart(2,'0')}</div><div><h2>{section.title}</h2><p>{section.text}</p>{section.bullets&&<ul>{section.bullets.map(item=><li key={item}>{item}</li>)}</ul>}</div></article>)}</section>
   <footer className="dlv-doc-footer"><div><b>D</b><span><strong>DLavie</strong><small>Digital Market documentation</small></span></div><p>{english?'Virtual Number is an additional service, not the primary product positioning.':'Nomor Virtual adalah layanan tambahan, bukan positioning utama produk.'}</p></footer>
  </main>
 </div>
}
