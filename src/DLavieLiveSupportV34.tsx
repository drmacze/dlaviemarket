import { useEffect } from 'react'

function isEnglish(){return localStorage.getItem('dlavie-language')==='en'}
function routeLabel(){
 const r=(location.hash||'#/home').toLowerCase()
 if(r.includes('market'))return 'Digital Market'
 if(r.includes('activity'))return isEnglish()?'Activity':'Aktivitas'
 if(r.includes('legal'))return 'Legal Center'
 if(r.includes('help')||r.includes('docs'))return isEnglish()?'Help Center':'Pusat Bantuan'
 return isEnglish()?'Home':'Beranda'
}
function sendHumanRequest(root:HTMLElement){
 const text=isEnglish()?'Please connect this session to a human DLavie Admin.':'Tolong lanjutkan sesi ini ke admin manusia DLavie.'
 const fast=document.querySelector<HTMLTextAreaElement>('.dlv-fast-composer-input')
 if(fast&&!fast.disabled){
  const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set
  setter?.call(fast,text);fast.dispatchEvent(new Event('input',{bubbles:true}))
  requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>('.dlv-fast-composer-send:not(:disabled)')?.click())
  return
 }
 const native=root.querySelector<HTMLTextAreaElement>('.dlv-assistant-composer textarea')
 const form=native?.closest<HTMLFormElement>('form')
 if(native&&form&&!native.disabled){
  const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set
  setter?.call(native,text);native.dispatchEvent(new Event('input',{bubbles:true}))
  requestAnimationFrame(()=>form.requestSubmit())
 }
}
function make<K extends keyof HTMLElementTagNameMap>(tag:K,className:string){const n=document.createElement(tag);n.className=className;return n}

export default function DLavieLiveSupportV34(){
 useEffect(()=>{
  const root=document.querySelector<HTMLElement>('.dlv-assistant')
  if(!root)return
  root.dataset.liveSupport='v34'
  let frame=0
  const patch=()=>{
   frame=0
   const panel=root.querySelector<HTMLElement>('.dlv-assistant-panel')
   if(!panel)return
   const en=isEnglish(),admin=root.classList.contains('mode-admin'),pending=root.classList.contains('mode-admin_pending')
   const header=panel.querySelector<HTMLElement>('.dlv-assistant-header')
   const identity=panel.querySelector<HTMLElement>('.dlv-assistant-identity')
   const title=identity?.querySelector<HTMLElement>('strong')
   if(title)title.textContent=en?'DLavie Support':'Bantuan DLavie'
   const headerStatus=identity?.querySelector<HTMLElement>('small')
   if(headerStatus){
    const current=headerStatus.textContent||''
    if(admin)headerStatus.innerHTML=`<i></i> ${en?'Human support connected':'Terhubung ke admin'}${current.includes('·')?` · ${current.split('·').at(-1)?.trim()||''}`:''}`
    else if(pending)headerStatus.innerHTML=`<i></i> ${en?'Waiting for human support':'Menunggu admin'}`
    else headerStatus.innerHTML=`<i></i> ${en?'Instant help available':'Bantuan instan tersedia'}`
   }
   const ready=panel.querySelector<HTMLElement>('.dlv-assistant-ready')
   if(ready){
    const eyebrow=ready.querySelector<HTMLElement>(':scope > span')
    const heading=ready.querySelector<HTMLElement>('h3')
    const intro=ready.querySelector<HTMLElement>(':scope > p')
    const start=ready.querySelector<HTMLButtonElement>('.dlv-assistant-start')
    const startText=start?.querySelector<HTMLElement>('span')
    const trust=ready.querySelector<HTMLElement>('.dlv-ui-trustline span')
    if(eyebrow)eyebrow.textContent=en?'PRIVATE SUPPORT':'BANTUAN PRIVAT'
    if(heading)heading.textContent=en?'How can we help?':'Ada yang bisa kami bantu?'
    if(intro)intro.textContent=en?'Ask about payments, wallet, orders, OTP, policies, or a problem you are experiencing.':'Tanyakan pembayaran, wallet, order, OTP, kebijakan, atau kendala yang sedang kamu alami.'
    if(startText&&!start?.disabled)startText.textContent=en?'Start support':'Mulai sesi'
    if(trust)trust.textContent=en?'Private to this account · session protected':'Khusus akun ini · sesi terlindungi'
   }
   if(header&&!panel.querySelector('.dlv34-support-state')){
    const state=make('div','dlv34-support-state')
    header.insertAdjacentElement('afterend',state)
   }
   const state=panel.querySelector<HTMLElement>('.dlv34-support-state')
   if(state){
    state.dataset.mode=admin?'admin':pending?'pending':'ai'
    state.innerHTML=admin
      ?`<span><i></i><b>${en?'Admin connected':'Admin terhubung'}</b></span><small>${en?'AI replies are paused while a human handles this session.':'Balasan otomatis dijeda selama admin menangani sesi ini.'}</small>`
      :pending
       ?`<span><i></i><b>${en?'In the support queue':'Masuk antrean bantuan'}</b></span><small>${en?'You can keep adding useful details while waiting.':'Kamu tetap bisa menambahkan detail penting sambil menunggu.'}</small>`
       :`<span><i></i><b>${en?'Instant support':'Bantuan instan'}</b></span><small>${en?'Ask normally, or switch to a human admin at any time.':'Tanyakan seperti biasa, atau pindah ke admin manusia kapan saja.'}</small>`
   }
   const wrap=panel.querySelector<HTMLElement>('.dlv-assistant-composer-wrap')
   if(wrap){
    let utility=wrap.querySelector<HTMLElement>('.dlv34-chat-utility')
    if(!utility){utility=make('div','dlv34-chat-utility');wrap.prepend(utility)}
    utility.innerHTML=`<span><i></i>${en?'Viewing':'Halaman'} <b>${routeLabel()}</b></span>${!admin&&!pending?`<button type="button" data-dlv34-human>${en?'Talk to admin':'Hubungi admin'} <b>↗</b></button>`:`<em>${admin?(en?'Human chat active':'Live chat admin aktif'):(en?'Waiting for admin':'Menunggu admin')}</em>`}`
   }
   const handoff=panel.querySelector<HTMLElement>('.dlv-assistant-handoff-banner')
   if(handoff){
    const small=handoff.querySelector<HTMLElement>('small')
    if(small)small.textContent=admin
      ?(en?'You are now chatting with DLavie Admin. Your previous conversation stays visible for context.':'Sekarang kamu chat langsung dengan DLavie Admin. Percakapan sebelumnya tetap terlihat sebagai konteks.')
      :(en?'Your request is already in the admin queue. You may close this panel and return later; the session stays available.':'Permintaanmu sudah masuk antrean admin. Panel boleh ditutup dan dibuka lagi nanti; sesi tetap tersimpan.')
   }
   const sessionBar=panel.querySelector<HTMLElement>('.dlv-assistant-sessionbar')
   if(sessionBar){
    const cells=sessionBar.querySelectorAll<HTMLElement>(':scope > div')
    const third=cells[2]
    if(third){const sm=third.querySelector('small'),st=third.querySelector('strong');if(sm)sm.textContent=en?'SUPPORT':'BANTUAN';if(st&&!admin)st.textContent=en?'Private session':'Sesi akun ini'}
   }
   panel.querySelectorAll<HTMLElement>('.dlv-ui-prompt-strip button').forEach(btn=>{
    const t=(btn.textContent||'').toLowerCase();btn.classList.toggle('is-human',t.includes('admin'))
   })
   const receipt=panel.querySelector<HTMLElement>('.dlv-assistant-receipt')
   if(receipt&&!receipt.querySelector('.dlv34-resolution-note')){
    const note=make('div','dlv34-resolution-note')
    note.innerHTML=`<i>✓</i><span><b>${en?'Conversation saved':'Percakapan tersimpan'}</b><small>${en?'Start a new session anytime if you need more help.':'Mulai sesi baru kapan saja jika masih membutuhkan bantuan.'}</small></span>`
    receipt.querySelector('button')?.insertAdjacentElement('beforebegin',note)
   }
  }
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(patch)}
  const observer=new MutationObserver(schedule);observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
  const click=(e:Event)=>{const t=e.target as HTMLElement|null;if(t?.closest('[data-dlv34-human]')){e.preventDefault();sendHumanRequest(root)}}
  root.addEventListener('click',click);window.addEventListener('hashchange',schedule);schedule()
  return()=>{if(frame)cancelAnimationFrame(frame);observer.disconnect();root.removeEventListener('click',click);window.removeEventListener('hashchange',schedule);delete root.dataset.liveSupport}
 },[])
 return null
}
