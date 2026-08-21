import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './dlavie-guest-docs-v36.css'

type DocPage='overview'|'faq'|'other'

function pageFromHash():DocPage{
 const route=location.hash.replace(/^#\/?/,'').split('?')[0].toLowerCase()
 if(route==='docs/overview'||route==='docs')return'overview'
 if(route==='docs/faq'||route==='faq'||route==='help'||route==='docs/help')return'faq'
 return'other'
}
function english(){return localStorage.getItem('dlavie-language')==='en'}
function openAuth(){document.querySelector<HTMLButtonElement>('.avatar-button')?.click()}
function go(path:string){location.hash=path.replace(/^#/,'');window.scrollTo({top:0,behavior:'auto'})}

const faqId=[
 ['Apa itu DLavie?','DLavie adalah marketplace produk digital untuk pulsa, paket data, PLN, e-wallet, voucher & game, layanan hiburan, dan kebutuhan digital lain yang tersedia di katalog.'],
 ['Apakah saya harus membuat akun?','Dokumentasi dapat dibaca tanpa akun. Untuk membuka Digital Market, Wallet, deposit, transaksi, aktivitas akun, dan live support, kamu harus login dan menyelesaikan persetujuan akun.'],
 ['Bagaimana cara mulai bertransaksi?','Buat akun atau login, selesaikan onboarding, isi Wallet mulai dari minimum deposit yang berlaku, lalu pilih kategori dan produk di Digital Market.'],
 ['Kenapa sebuah produk bisa Pending?','Pending berarti hasil supplier belum final. Jangan membuat transaksi pengganti berulang sebelum status transaksi pertama diperiksa melalui Aktivitas atau bantuan DLavie.'],
 ['Apa yang harus saya periksa sebelum membayar?','Pastikan produk, nominal, nomor atau ID tujuan, dan total sudah benar. Untuk produk digital yang sudah sukses dikirim supplier, salah tujuan biasanya tidak dapat dibatalkan.'],
 ['Bagaimana jika saya membutuhkan bantuan?','Gunakan Bantuan DLavie setelah login. Simpan reference/order ID dan waktu kejadian. Jangan pernah memberikan password, PIN, OTP, atau credential pembayaran kepada siapa pun.'],
]
const faqEn=[
 ['What is DLavie?','DLavie is a digital-product marketplace for mobile credit, data packages, PLN, e-wallets, vouchers & games, entertainment services and other catalog items.'],
 ['Do I need an account?','Documentation is public. Digital Market, Wallet, deposits, transactions, account activity and live support require login and completed account consent.'],
 ['How do I start a transaction?','Create an account or sign in, finish onboarding, fund your Wallet from the active minimum deposit, then choose a category and product in Digital Market.'],
 ['Why can an order stay Pending?','Pending means the supplier result is not final. Do not repeatedly place replacements before checking the original transaction in Activity or DLavie Support.'],
 ['What should I check before paying?','Verify product, amount, destination number or ID, and total. Successful digital fulfillment to a wrong destination is generally irreversible.'],
 ['How do I get help?','Use DLavie Support after login. Keep the reference/order ID and incident time. Never share passwords, PINs, OTPs or payment credentials.'],
]

function Overview({en}:{en:boolean}){
 return <div className="dlv36-doc-page is-overview">
  <section className="dlv36-doc-hero">
   <span className="dlv36-doc-kicker">{en?'THE DLAVIE DIGITAL MARKET':'DOKUMENTASI DIGITAL MARKET DLAVIE'}</span>
   <h1>{en?<>Everything digital,<em>one marketplace.</em></>:<>Kebutuhan digital,<em>satu marketplace.</em></>}</h1>
   <p>{en?'Learn how DLavie Market, Wallet, payments, transaction status and support work before creating an account.':'Pelajari cara kerja DLavie Market, Wallet, pembayaran, status transaksi, dan bantuan sebelum membuat akun.'}</p>
   <div className="dlv36-doc-actions">
    <button type="button" className="primary" onClick={openAuth}><span>▣</span>{en?'Visit Marketplace':'Kunjungi Marketplace'}</button>
    <a href="https://t.me/DlavieOfficial" target="_blank" rel="noopener noreferrer"><span>↗</span>{en?'Join Telegram':'Join Telegram'}</a>
   </div>
  </section>

  <section className="dlv36-doc-stats" aria-label={en?'DLavie overview':'Ringkasan DLavie'}>
   <div><strong>08</strong><span>{en?'MARKET CATEGORIES':'KATEGORI MARKET'}</span></div>
   <div><strong>01</strong><span>{en?'DLAVIE WALLET':'WALLET DLAVIE'}</span></div>
   <div><strong>Rp1K</strong><span>{en?'MIN. DEPOSIT':'MIN. DEPOSIT'}</span></div>
  </section>

  <section className="dlv36-feature-card">
   <div className="dlv36-feature-icon">D</div>
   <div className="dlv36-feature-copy">
    <span>DIGITAL MARKET</span>
    <h2>{en?'One flow for everyday digital products.':'Satu alur untuk kebutuhan digital sehari-hari.'}</h2>
    <p>{en?'Browse products by category and brand, review the destination and total, then continue through your DLavie account.':'Cari produk berdasarkan kategori dan brand, periksa tujuan serta total, lalu lanjutkan melalui akun DLavie.'}</p>
    <div className="dlv36-feature-tags"><i>Pulsa</i><i>Paket Data</i><i>PLN</i><i>E-Wallet</i><i>Voucher & Game</i><i>Streaming</i></div>
    <button type="button" onClick={openAuth}>{en?'Sign in to open Market':'Masuk untuk membuka Market'} <b>→</b></button>
   </div>
  </section>

  <section className="dlv36-doc-links">
   <button onClick={()=>go('/docs/how')}><small>01</small><strong>{en?'How it works':'Cara kerja'}</strong><span>{en?'From account to completed transaction.':'Dari akun sampai transaksi selesai.'}</span><b>→</b></button>
   <button onClick={()=>go('/docs/payments')}><small>02</small><strong>Wallet & Payment</strong><span>{en?'Funding, debit, pending and refund.':'Deposit, debit, pending, dan refund.'}</span><b>→</b></button>
   <button onClick={()=>go('/docs/security')}><small>03</small><strong>{en?'Security':'Keamanan'}</strong><span>{en?'How sensitive operations are protected.':'Cara operasi sensitif dilindungi.'}</span><b>→</b></button>
   <button onClick={()=>go('/docs/faq')}><small>04</small><strong>FAQ</strong><span>{en?'Common questions before using DLavie.':'Pertanyaan umum sebelum menggunakan DLavie.'}</span><b>→</b></button>
  </section>

  <footer className="dlv36-doc-footer">
   <nav><button onClick={()=>go('/docs/overview')}>{en?'Home':'Beranda'}</button><button onClick={()=>go('/docs/market')}>Digital Market</button><button onClick={()=>go('/docs/how')}>{en?'Guide':'Panduan'}</button><button onClick={()=>go('/docs/faq')}>FAQ</button><a href="https://t.me/DlavieOfficial" target="_blank" rel="noopener noreferrer">Telegram</a></nav>
   <p>© 2026 DLavie · {en?'Public documentation':'Dokumentasi publik'}</p>
  </footer>
 </div>
}

function FAQ({en}:{en:boolean}){
 const items=en?faqEn:faqId
 return <div className="dlv36-doc-page is-faq">
  <section className="dlv36-faq-head"><span>DLAVIE FAQ</span><h1>{en?'DLavie FAQ & Marketplace Guide':'FAQ & Panduan Marketplace DLavie'}</h1><p>{en?'Quick answers before you create an account or make a transaction.':'Jawaban singkat sebelum kamu membuat akun atau mulai bertransaksi.'}</p></section>
  <section className="dlv36-faq-list">{items.map(([q,a])=><details key={q}><summary>{q}<i>⌄</i></summary><p>{a}</p></details>)}</section>
  <div className="dlv36-faq-actions"><button onClick={openAuth}>{en?'Visit Marketplace':'Kunjungi Marketplace'} <b>→</b></button><a href="https://t.me/DlavieOfficial" target="_blank" rel="noopener noreferrer">{en?'Join Telegram':'Join Telegram'} ↗</a></div>
  <footer className="dlv36-doc-footer"><nav><button onClick={()=>go('/docs/overview')}>{en?'Home':'Beranda'}</button><button onClick={()=>go('/docs/market')}>Digital Market</button><button onClick={()=>go('/docs/how')}>{en?'Guide':'Panduan'}</button><button onClick={()=>go('/docs/legal')}>Legal</button></nav><p>© 2026 DLavie · {en?'Public documentation':'Dokumentasi publik'}</p></footer>
 </div>
}

export default function DLavieGuestDocsV36(){
 const [host,setHost]=useState<HTMLElement|null>(null)
 const [page,setPage]=useState<DocPage>(pageFromHash)
 const [en,setEn]=useState(english)
 useEffect(()=>{
  let owned:HTMLElement|null=null
  const ensure=()=>{
   const main=document.querySelector<HTMLElement>('.dlv-doc-main')
   if(!main){setHost(null);return}
   let node=main.querySelector<HTMLElement>(':scope > .dlv36-doc-host')
   if(!node){node=document.createElement('div');node.className='dlv36-doc-host';main.appendChild(node);owned=node}
   setHost(node)
  }
  const sync=()=>{const next=pageFromHash();setPage(next);setEn(english());document.documentElement.dataset.guestDocsV36=next;requestAnimationFrame(ensure)}
  const ob=new MutationObserver(()=>requestAnimationFrame(ensure));ob.observe(document.body,{childList:true,subtree:true})
  window.addEventListener('hashchange',sync);window.addEventListener('storage',sync);sync()
  return()=>{ob.disconnect();window.removeEventListener('hashchange',sync);window.removeEventListener('storage',sync);delete document.documentElement.dataset.guestDocsV36;if(owned?.isConnected)owned.remove()}
 },[])
 if(!host||page==='other')return null
 return createPortal(page==='overview'?<Overview en={en}/>:<FAQ en={en}/>,host)
}
