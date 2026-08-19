import { useEffect } from 'react'
import DLavieContributorSiteBridge from './DLavieContributorSiteBridge'
import DLavieContributorGuestBridge from './DLavieContributorGuestBridge'
import './dlavie-contributor-rail.css'

const replacements:Record<string,string>={
 'Marketplace nomor virtual yang lebih terstruktur.':'Marketplace produk digital yang lebih terstruktur.',
 'Pelajari cara DLavie bekerja, bagaimana transaksi dicatat, dan apa yang perlu diketahui sebelum membuat akun.':'DLavie menyatukan kebutuhan digital, wallet, transaksi, bantuan, dan riwayat dalam satu pengalaman yang dapat ditelusuri.',
 'Satu alur dari wallet sampai OTP':'Satu wallet untuk berbagai kebutuhan digital',
 'DLavie menyatukan pemilihan layanan, negara, provider, pembayaran, sesi nomor, OTP, serta histori transaksi dalam satu antarmuka.':'DLavie menggabungkan pulsa, data, listrik, e-wallet, game, voucher, Nomor Virtual, pembayaran, serta histori transaksi dalam satu antarmuka.',
 'Pilih layanan, negara, operator/provider, harga, dan stok dalam flow bertahap agar keputusan tidak terasa seperti katalog yang penuh.':'Pilih kategori, brand, produk, harga, dan tujuan dalam flow yang ringkas. Nomor Virtual tetap tersedia sebagai salah satu kategori.',
 'Order & OTP':'Digital order & Nomor Virtual',
 'Sesi aktif mempunyai waktu kedaluwarsa, status provider, nomor, kode OTP, dan histori yang dapat ditinjau kembali.':'Pesanan digital memiliki reference ID, status supplier, tujuan, SN/token bila tersedia, serta histori. Nomor Virtual tetap memiliki sesi, nomor, timer, dan OTP.',
 '03 · Pilih kebutuhan':'03 · Pilih produk digital',
 'Pilih layanan, negara, provider, lalu tinjau ringkasan sebelum order dikonfirmasi.':'Pilih kategori dan produk digital, masukkan tujuan dengan teliti, lalu tinjau harga sebelum transaksi dikonfirmasi. Untuk Nomor Virtual, pilih layanan dan provider.',
 '04 · Pantau sesi':'04 · Pantau pesanan',
 'Nomor aktif, timer, status provider, dan event OTP muncul pada halaman Aktivitas.':'Status pesanan digital, reference, waktu, dan SN/token ditampilkan pada Aktivitas. Sesi Nomor Virtual tetap menampilkan timer dan OTP.',
 'A more structured virtual-number marketplace.':'A more structured digital-products marketplace.',
 'Learn how DLavie works, how transactions are referenced, and what to know before creating an account.':'DLavie brings digital products, wallet, transaction references, support and history into one traceable experience.',
 'One flow from wallet to OTP':'One wallet for digital needs',
 'DLavie combines service, country, provider, payment, number session, OTP status and transaction history in one interface.':'DLavie combines prepaid credit, data, electricity, e-wallet, games, vouchers, Virtual Numbers, payments and transaction history in one interface.',
 'A staged service, country and provider selection flow.':'A staged category, brand, product and destination flow. Virtual Number remains available as one category.',
 'Order & OTP':'Digital orders & Virtual Number',
 'Active number sessions, expiry, provider status and OTP events.':'Digital orders include references, supplier status and serial/token output when available; Virtual Number keeps session and OTP states.'
}
function docsRoute(){const r=location.hash.replace(/^#\/?/,'').split('?')[0].toLowerCase();return r.startsWith('docs/')||['help','faq','legal','terms','privacy'].includes(r)}
function apply(){if(!docsRoute())return;const root=document.querySelector<HTMLElement>('.access-experience')||document.body;root.querySelectorAll<HTMLElement>('h1,h2,h3,p,span,strong').forEach(el=>{const t=(el.textContent||'').trim();const next=replacements[t];if(next&&el.children.length===0)el.textContent=next})}
export default function DigitalPositioningEnhancer(){useEffect(()=>{let raf=0,t=0;const run=()=>{cancelAnimationFrame(raf);clearTimeout(t);raf=requestAnimationFrame(()=>{apply();t=window.setTimeout(apply,180)})};run();window.addEventListener('hashchange',run);return()=>{cancelAnimationFrame(raf);clearTimeout(t);window.removeEventListener('hashchange',run)}},[]);return <><DLavieContributorSiteBridge/><DLavieContributorGuestBridge/></>}
