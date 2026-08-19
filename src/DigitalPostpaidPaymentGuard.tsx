import { useEffect, useState } from 'react'

const PAY_KEY='dlavie-postpaid-pay-confirm-v22'

type Pending={button:HTMLButtonElement;product:string;total:string}|null

export default function DigitalPostpaidPaymentGuard(){
 const [pending,setPending]=useState<Pending>(null)
 const [checked,setChecked]=useState(false)
 const [policy,setPolicy]=useState(false)
 useEffect(()=>{
  const intercept=(e:MouseEvent)=>{
   const t=e.target as HTMLElement|null
   const button=t?.closest<HTMLButtonElement>('.dlv22-result .dlv21-primary')
   if(!button||button.disabled||!button.textContent?.toLowerCase().includes('bayar'))return
   if(button.dataset.dlvPayApproved==='1'){delete button.dataset.dlvPayApproved;return}
   e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
   const root=button.closest('.dlv22-result')
   const product=root?.querySelector<HTMLElement>('.dlv21-receipt-product b')?.textContent?.trim()||'Tagihan digital'
   const total=root?.querySelector<HTMLElement>('.dlv21-total strong')?.textContent?.trim()||'—'
   setChecked(false);setPolicy(false);setPending({button,product,total})
  }
  document.addEventListener('click',intercept,true)
  return()=>document.removeEventListener('click',intercept,true)
 },[])
 if(!pending)return null
 const close=()=>{setPending(null);setChecked(false);setPolicy(false)}
 const proceed=()=>{
  if(!checked||!policy)return
  sessionStorage.setItem(PAY_KEY,'true')
  const btn=pending.button
  close()
  requestAnimationFrame(()=>{btn.dataset.dlvPayApproved='1';btn.click()})
 }
 return <div className="dlv22-payguard-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><section className="dlv22-payguard" role="dialog" aria-modal="true" aria-label="Konfirmasi pembayaran tagihan"><header><div><small>PEMERIKSAAN PEMBAYARAN</small><h3>Konfirmasi sebelum saldo dipotong</h3></div><button onClick={close}>×</button></header><div className="dlv22-payguard-summary"><p><span>Tagihan</span><b>{pending.product}</b></p><p><span>Total final</span><strong>{pending.total}</strong></p></div><label><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/><span><b>Saya sudah memeriksa tagihan dan total.</b> Data pelanggan dan nominal yang ditampilkan sudah sesuai.</span></label><label><input type="checkbox" checked={policy} onChange={e=>setPolicy(e.target.checked)}/><span><b>Saya menyetujui kebijakan pembayaran.</b> Setelah pembayaran berhasil dikirim ke provider, pembatalan karena kesalahan pengguna tidak dapat dijamin.</span></label><button className="dlv22-payguard-primary" disabled={!checked||!policy} onClick={proceed}>Konfirmasi & Bayar <b>→</b></button></section></div>
}
