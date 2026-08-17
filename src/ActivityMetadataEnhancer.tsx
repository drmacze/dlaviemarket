import { useEffect } from 'react'

type Order={id:string;createdAt:number;expiresAt:number;status:string;serviceName?:string;providerName?:string}
type History={id:string;orderId?:string;time?:string;createdAt?:number;label?:string;detail?:string;type?:string}
type Profile={id?:string}

const ORDER_KEY='dlavie-orders-v1'
const HISTORY_KEY='dlavie-history'
const STATE_EVENT='dlavie:state-changed'

const orders=():Order[]=>{try{return JSON.parse(localStorage.getItem(ORDER_KEY)||'[]')}catch{return[]}}
const history=():History[]=>{try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]')}catch{return[]}}
const profile=():Profile|null=>{try{return JSON.parse(localStorage.getItem('dlavie-account-profile-v1')||'null')}catch{return null}}
const locale=()=>localStorage.getItem('dlavie-language')==='en'?'en-US':'id-ID'
const dateFmt=(v:number)=>new Intl.DateTimeFormat(locale(),{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Jakarta'}).format(new Date(v))
const timeFmt=(v:number)=>new Intl.DateTimeFormat(locale(),{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'Asia/Jakarta'}).format(new Date(v))
const fullFmt=(v?:number)=>v?`${dateFmt(v)} · ${timeFmt(v)} WIB`:'—'

function inferOrder(item:History,all:Order[]){
 const direct=item.orderId||item.id
 const byId=all.find(x=>x.id===direct)
 if(byId)return byId
 if(item.label?.startsWith('Refund · ')){
  const service=item.label.replace('Refund · ','').trim().toLowerCase()
  const provider=(item.detail||'').split('·')[0].trim().toLowerCase()
  return all.find(x=>(x.serviceName||'').toLowerCase()===service&&(!provider||(x.providerName||'').toLowerCase()===provider))
 }
 return undefined
}

export default function ActivityMetadataEnhancer(){
 useEffect(()=>{
  let raf=0
  const seen=new Set(history().map(x=>x.id))

  const persistMissingTimestamps=()=>{
   const all=orders()
   const items=history()
   let changed=false
   const now=Date.now()
   const next=items.map(item=>{
    if(item.createdAt)return item
    const order=inferOrder(item,all)
    if(order?.createdAt){changed=true;return{...item,createdAt:order.createdAt,orderId:item.orderId||order.id}}
    if(!seen.has(item.id)){
     changed=true
     return{...item,createdAt:now}
    }
    return item
   })
   next.forEach(x=>seen.add(x.id))
   if(changed)localStorage.setItem(HISTORY_KEY,JSON.stringify(next))
  }

  const apply=()=>{
   persistMissingTimestamps()
   const all=orders(),active=all.filter(x=>x.status==='waiting'||x.status==='received'),uid=profile()?.id||'Guest'
   const head=document.querySelector<HTMLElement>('.order-center-head>div:first-child')
   if(head){
    let chip=head.querySelector<HTMLElement>('.activity-user-reference')
    if(!chip){chip=document.createElement('div');chip.className='activity-user-reference';head.appendChild(chip)}
    const text=`User ID ${uid} · ${all.length} order tersimpan`
    if(chip.textContent!==text)chip.textContent=text
   }

   document.querySelectorAll<HTMLElement>('.activity-order-card').forEach((card,i)=>{
    const order=active[i];if(!order)return
    let meta=card.querySelector<HTMLElement>('.activity-order-detail-strip')
    if(!meta){meta=document.createElement('div');meta.className='activity-order-detail-strip';card.querySelector('.activity-order-meta')?.insertAdjacentElement('afterend',meta)}
    const html=`<span><small>Dibuat</small><b>${fullFmt(order.createdAt)}</b></span><span><small>Sesi berakhir</small><b>${fullFmt(order.expiresAt)}</b></span><span><small>User ID</small><b>${uid}</b></span>`
    if(meta.innerHTML!==html)meta.innerHTML=html
   })

   const h=history()
   document.querySelectorAll<HTMLElement>('.transaction-row').forEach((row,i)=>{
    const item=h[i];if(!item)return
    const order=inferOrder(item,all)
    const timestamp=item.createdAt||order?.createdAt
    row.querySelector('.activity-history-reference')?.remove()
    let ledger=row.querySelector<HTMLElement>('.activity-history-ledger')
    if(!ledger){
     ledger=document.createElement('div');ledger.className='activity-history-ledger'
     row.querySelector('div')?.appendChild(ledger)
    }
    const ref=item.orderId||order?.id||item.id
    const html=timestamp
      ?`<time datetime="${new Date(timestamp).toISOString()}"><b>${dateFmt(timestamp)}</b><span>${timeFmt(timestamp)} WIB</span></time><code>${ref}</code>`
      :`<time class="is-legacy"><b>Riwayat lama</b><span>Waktu asli tidak tersimpan</span></time><code>${ref}</code>`
    if(ledger.innerHTML!==html)ledger.innerHTML=html
   })
  }

  const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(apply)}
  const onState=()=>{schedule()}
  schedule()
  const observer=new MutationObserver(m=>{if(m.some(x=>x.type==='childList'))schedule()})
  observer.observe(document.body,{childList:true,subtree:true})
  window.addEventListener(STATE_EVENT,onState)
  window.addEventListener('storage',onState)
  window.addEventListener('hashchange',schedule)
  return()=>{observer.disconnect();cancelAnimationFrame(raf);window.removeEventListener(STATE_EVENT,onState);window.removeEventListener('storage',onState);window.removeEventListener('hashchange',schedule)}
 },[])
 return null
}
