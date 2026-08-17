import { useEffect } from 'react'

type Order={id:string;createdAt:number;expiresAt:number;status:string}
type History={id:string;orderId?:string;time?:string;createdAt?:number}
type Profile={id?:string}
const orders=():Order[]=>{try{return JSON.parse(localStorage.getItem('dlavie-orders-v1')||'[]')}catch{return[]}}
const history=():History[]=>{try{return JSON.parse(localStorage.getItem('dlavie-history')||'[]')}catch{return[]}}
const profile=():Profile|null=>{try{return JSON.parse(localStorage.getItem('dlavie-account-profile-v1')||'null')}catch{return null}}
const fmt=(v?:number)=>v?new Intl.DateTimeFormat(localStorage.getItem('dlavie-language')==='en'?'en-US':'id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v)):'—'

export default function ActivityMetadataEnhancer(){
 useEffect(()=>{let raf=0
  const apply=()=>{const all=orders(),active=all.filter(x=>x.status==='waiting'||x.status==='received'),uid=profile()?.id||'Guest'
   const head=document.querySelector<HTMLElement>('.order-center-head>div:first-child');if(head){let chip=head.querySelector<HTMLElement>('.activity-user-reference');if(!chip){chip=document.createElement('div');chip.className='activity-user-reference';head.appendChild(chip)}const text=`User ID ${uid} · ${all.length} order tersimpan`;if(chip.textContent!==text)chip.textContent=text}
   document.querySelectorAll<HTMLElement>('.activity-order-card').forEach((card,i)=>{const order=active[i];if(!order)return;let meta=card.querySelector<HTMLElement>('.activity-order-detail-strip');if(!meta){meta=document.createElement('div');meta.className='activity-order-detail-strip';card.querySelector('.activity-order-meta')?.insertAdjacentElement('afterend',meta)}const html=`<span><small>Dibuat</small><b>${fmt(order.createdAt)}</b></span><span><small>Sesi berakhir</small><b>${fmt(order.expiresAt)}</b></span><span><small>User ID</small><b>${uid}</b></span>`;if(meta.innerHTML!==html)meta.innerHTML=html})
   const h=history();document.querySelectorAll<HTMLElement>('.transaction-row').forEach((row,i)=>{const item=h[i];if(!item)return;const order=all.find(x=>x.id===(item.orderId||item.id));const timestamp=item.createdAt||order?.createdAt;let extra=row.querySelector<HTMLElement>('.activity-history-reference');if(!extra){extra=document.createElement('em');extra.className='activity-history-reference';row.querySelector('div')?.appendChild(extra)}const ref=item.orderId||item.id;const text=`${timestamp?fmt(timestamp):(item.time||'Waktu lama tidak tersimpan')} · ${ref}`;if(extra.textContent!==text)extra.textContent=text})
  }
  const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(apply)};schedule();const o=new MutationObserver(schedule);o.observe(document.body,{childList:true,subtree:true});window.addEventListener('dlavie:state-changed',schedule);window.addEventListener('hashchange',schedule);return()=>{o.disconnect();cancelAnimationFrame(raf);window.removeEventListener('dlavie:state-changed',schedule);window.removeEventListener('hashchange',schedule)}
 },[]);return null
}
