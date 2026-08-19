import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const STATE_EVENT='dlavie:state-changed'
const rupiah=new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})
function isActivity(){const r=location.hash.replace(/^#\/?/,'').split('?')[0].toLowerCase();return r==='activity'||r==='aktivitas'}
function isEnglish(){return localStorage.getItem('dlavie-language')==='en'}

export default function DigitalActivityPageSync(){
 const [target,setTarget]=useState<HTMLElement|null>(null)
 const [balance,setBalance]=useState(()=>Number(localStorage.getItem('dlavie-balance')||0))
 const [en,setEn]=useState(isEnglish)
 useEffect(()=>{
  let timer=0
  const mount=()=>{
   clearTimeout(timer)
   if(!isActivity()){setTarget(null);return}
   const page=document.querySelector<HTMLElement>('.order-center-page')
   const shell=document.querySelector<HTMLElement>('.order-center-shell')
   if(!page||!shell){timer=window.setTimeout(mount,100);return}
   page.classList.add('dlv-activity-unified')
   const eyebrow=page.querySelector<HTMLElement>('.order-center-head>div>span')
   const title=page.querySelector<HTMLElement>('.order-center-head>div>h1')
   const desc=page.querySelector<HTMLElement>('.order-center-head>div>p')
   if(eyebrow)eyebrow.textContent=isEnglish()?'Activity Center':'Pusat Aktivitas'
   if(title)title.textContent=isEnglish()?'Digital orders & Wallet':'Transaksi digital & Wallet'
   if(desc)desc.textContent=isEnglish()?'Track prepaid products, bill payments, supplier status, Wallet movements, refunds, and Virtual Number sessions from one place.':'Pantau produk prabayar, pembayaran tagihan, status supplier, pergerakan Wallet, refund, dan sesi Nomor Virtual dari satu tempat.'
   const activeLabel=page.querySelector<HTMLElement>('.active-order-section .activity-section-title>div>span')
   if(activeLabel)activeLabel.textContent=isEnglish()?'Virtual Number':'Nomor Virtual'
   const emptyStrong=page.querySelector<HTMLElement>('.activity-empty strong')
   const emptySmall=page.querySelector<HTMLElement>('.activity-empty small')
   if(emptyStrong)emptyStrong.textContent=isEnglish()?'No active Virtual Number session.':'Belum ada sesi Nomor Virtual aktif.'
   if(emptySmall)emptySmall.textContent=isEnglish()?'Virtual Number is an additional Digital Market service. Open Market when you need a verification-number session.':'Nomor Virtual adalah layanan tambahan Digital Market. Buka Market saat membutuhkan sesi nomor verifikasi.'
   const txLabel=page.querySelector<HTMLElement>('.transaction-section .activity-section-title>div>span')
   const txTitle=page.querySelector<HTMLElement>('.transaction-section .activity-section-title>div>h2')
   if(txLabel)txLabel.textContent=isEnglish()?'Wallet activity':'Aktivitas Wallet'
   if(txTitle)txTitle.textContent=isEnglish()?'Deposits, purchases & refunds':'Deposit, pembelian & refund'
   setTarget(shell)
  }
  mount();window.addEventListener('hashchange',mount);return()=>{clearTimeout(timer);window.removeEventListener('hashchange',mount)}
 },[])
 useEffect(()=>{const sync=()=>{setBalance(Number(localStorage.getItem('dlavie-balance')||0));setEn(isEnglish())};window.addEventListener(STATE_EVENT,sync);window.addEventListener('storage',sync);return()=>{window.removeEventListener(STATE_EVENT,sync);window.removeEventListener('storage',sync)}},[])
 if(!target)return null
 return createPortal(<section className="dlv-activity-market-summary"><header><div><span>DLAVIE · DIGITAL MARKET</span><h2>{en?'One timeline for every product.':'Satu timeline untuk semua produk.'}</h2><p>{en?'Digital purchases are prioritized here; Virtual Number remains available as a separate session-based service.':'Pembelian produk digital menjadi fokus utama; Nomor Virtual tetap tersedia sebagai layanan berbasis sesi yang terpisah.'}</p></div><strong>{rupiah.format(balance)}</strong></header><div className="dlv-activity-market-links"><button onClick={()=>{location.hash='/market'}}><span>{en?'Digital Market':'Digital Market'}</span><b>{en?'Buy credit, data, PLN, wallet & vouchers':'Pulsa, data, PLN, e-wallet & voucher'}</b><i>→</i></button><button onClick={()=>{location.hash='/help'}}><span>{en?'Help Center':'Pusat Bantuan'}</span><b>{en?'Status, supplier, refund & transaction guide':'Status, supplier, refund & panduan transaksi'}</b><i>→</i></button></div></section>,target)
}
