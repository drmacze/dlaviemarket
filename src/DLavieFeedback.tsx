import { FormEvent, useEffect, useState } from 'react'
import './dlavie-feedback.css'

const API='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-feedback'
const SESSION_KEY='dlavie-account-session-v1'
const PROFILE_KEY='dlavie-account-profile-v1'
const FEEDBACK_KEY='dlavie-feedback-v1'
const SNOOZE_KEY='dlavie-feedback-snooze-v1'
const topics=['Kemudahan penggunaan','Tampilan & navigasi','Katalog produk','Proses transaksi','Kecepatan website','Bantuan & dukungan']

type Profile={id?:string;username?:string}
type Stage='prompt'|'form'

function StarMark(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.3 2.55 5.17 5.7.83-4.12 4.02.97 5.68L12 16.32 6.9 19l.97-5.68L3.75 9.3l5.7-.83L12 3.3Z"/></svg>}

export default function DLavieFeedback(){
 const [open,setOpen]=useState(false),[stage,setStage]=useState<Stage>('prompt'),[rating,setRating]=useState(0),[hover,setHover]=useState(0),[topic,setTopic]=useState(''),[message,setMessage]=useState(''),[submitted,setSubmitted]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
 useEffect(()=>{
  const eligible=()=>{
   const signedIn=sessionStorage.getItem(SESSION_KEY)==='active'
   const route=location.hash.replace(/^#\/?/,'').toLowerCase()
   const mainMenu=!route||route==='home'||route==='beranda'
   const snooze=Number(localStorage.getItem(SNOOZE_KEY)||0)
   const last=Number(localStorage.getItem(`${FEEDBACK_KEY}:last`)||0)
   return signedIn&&mainMenu&&Date.now()>snooze&&Date.now()-last>1000*60*60*24*30
  }
  let timer=0
  const check=()=>{window.clearTimeout(timer);if(eligible())timer=window.setTimeout(()=>{setStage('prompt');setOpen(true)},1600)}
  check();addEventListener('hashchange',check)
  return()=>{window.clearTimeout(timer);removeEventListener('hashchange',check)}
 },[])
 const close=()=>{if(busy)return;setOpen(false);setStage('prompt');localStorage.setItem(SNOOZE_KEY,String(Date.now()+1000*60*60*24*7))}
 const submit=async(e:FormEvent)=>{
  e.preventDefault();if(!rating||busy)return
  let profile:Profile={};try{profile=JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')}catch{}
  if(!profile.id){setError('Sesi akun tidak terbaca. Coba login ulang terlebih dahulu.');return}
  setBusy(true);setError('')
  try{
   const response=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'submit',user_id:profile.id,username:profile.username||null,rating,topic:topic||null,message:message.trim()||null,route:location.hash||'#home'})})
   const data=await response.json().catch(()=>({}))
   if(!response.ok||!data.ok)throw new Error(data.message||data.error||'Feedback belum dapat dikirim.')
   localStorage.setItem(`${FEEDBACK_KEY}:last`,String(Date.now()));localStorage.removeItem(SNOOZE_KEY);setSubmitted(true)
   window.setTimeout(()=>setOpen(false),1800)
  }catch(err){setError(err instanceof Error?err.message:'Feedback belum dapat dikirim. Coba lagi sebentar.')}
  finally{setBusy(false)}
 }
 if(!open)return null
 return <div className="dlv-feedback-layer" role="dialog" aria-modal="true" aria-labelledby="dlv-feedback-title">
  <button className="dlv-feedback-backdrop" aria-label="Tutup feedback" onClick={close}/>
  <section className={`dlv-feedback-card is-${stage}`}>
   <button className="dlv-feedback-close" onClick={close} aria-label="Tutup">×</button>
   {submitted?<div className="dlv-feedback-thanks"><span>✓</span><small>FEEDBACK TERKIRIM</small><h2>Terima kasih.</h2><p>Masukanmu membantu kami menentukan bagian DLavie yang perlu dibuat lebih baik.</p></div>:stage==='prompt'?<div className="dlv-feedback-prompt">
    <div className="dlv-feedback-prompt-top"><span className="dlv-feedback-mark"><StarMark/></span><span className="dlv-feedback-badge">DLAVIE FEEDBACK</span></div>
    <h2 id="dlv-feedback-title">Bagaimana pengalamanmu di DLavie?</h2>
    <p>Feedback singkat darimu membantu kami membuat Market lebih nyaman, jelas, dan mudah digunakan.</p>
    <div className="dlv-feedback-preview-stars" aria-hidden="true">{[1,2,3,4,5].map(n=><span key={n}>★</span>)}</div>
    <button className="dlv-feedback-start" type="button" onClick={()=>setStage('form')}>Beri feedback <span>→</span></button>
    <button className="dlv-feedback-later" type="button" onClick={close}>Nanti saja</button>
   </div>:<form onSubmit={submit}>
    <button type="button" className="dlv-feedback-back" onClick={()=>setStage('prompt')} disabled={busy}>← Kembali</button>
    <small className="dlv-feedback-eyebrow">PENGALAMAN DLAVIE</small><h2 id="dlv-feedback-title">Ceritakan pengalamanmu.</h2><p className="dlv-feedback-lead">Nilai pengalamanmu dan pilih bagian yang paling ingin kamu beri masukan.</p>
    <fieldset className="dlv-feedback-stars"><legend>Nilai pengalamanmu</legend><div>{[1,2,3,4,5].map(n=><button key={n} type="button" className={n<=(hover||rating)?'active':''} onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)} onClick={()=>setRating(n)} aria-label={`${n} dari 5 bintang`}>★</button>)}</div><span>{rating?['','Kurang baik','Perlu diperbaiki','Cukup baik','Baik','Sangat baik'][rating]:'Pilih 1–5 bintang'}</span></fieldset>
    <label className="dlv-feedback-label">Bagian yang ingin kamu nilai<select value={topic} onChange={e=>setTopic(e.target.value)}><option value="">Pilih bagian (opsional)</option>{topics.map(x=><option key={x}>{x}</option>)}</select></label>
    <label className="dlv-feedback-label">Masukanmu<textarea value={message} onChange={e=>setMessage(e.target.value.slice(0,700))} placeholder="Apa yang bisa kami buat lebih nyaman, jelas, atau cepat?" rows={4}/><span className="dlv-feedback-count">{message.length}/700</span></label>
    {error&&<div className="dlv-feedback-error">{error}</div>}
    <div className="dlv-feedback-actions"><button type="button" className="secondary" onClick={close} disabled={busy}>Nanti saja</button><button type="submit" className="primary" disabled={!rating||busy}>{busy?'Mengirim…':'Kirim feedback'} {!busy&&<span>→</span>}</button></div>
    <p className="dlv-feedback-note">Jangan sertakan PIN, password, OTP, atau informasi pembayaran.</p>
   </form>}
  </section>
 </div>
}