import { useEffect, useMemo, useState } from 'react'
import './dlavie-feedback-admin.css'

const API='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-feedback'
const TOKEN='dlavie-admin-support-session-v1'

type Feedback={id:string;user_id:string;username?:string|null;rating:number;topic?:string|null;message?:string|null;route?:string|null;created_at:string}
type Dashboard={total:number;average:number;ratings:{star:number;count:number}[];topics:{name:string;count:number;average:number}[];recent:Feedback[]}

const date=(value:string)=>new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(value))

export default function DLavieFeedbackAdmin(){
 const enabled=new URLSearchParams(location.search).get('support-admin')==='1'
 const [authed,setAuthed]=useState(()=>!!sessionStorage.getItem(TOKEN)),[open,setOpen]=useState(false),[data,setData]=useState<Dashboard|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[filter,setFilter]=useState('all')
 useEffect(()=>{if(!enabled)return;const t=setInterval(()=>setAuthed(!!sessionStorage.getItem(TOKEN)),600);return()=>clearInterval(t)},[enabled])
 const load=async()=>{const token=sessionStorage.getItem(TOKEN)||'';if(!token)return;setBusy(true);setError('');try{const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'dashboard',admin_token:token})});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.error||'Feedback belum dapat dimuat.');setData(d)}catch(e){setError(e instanceof Error?e.message:'Feedback belum dapat dimuat.')}finally{setBusy(false)}}
 useEffect(()=>{if(open&&authed)void load()},[open,authed])
 const rows=useMemo(()=>{const all=data?.recent||[];if(filter==='all')return all;if(filter==='low')return all.filter(x=>x.rating<=2);return all.filter(x=>x.topic===filter)},[data,filter])
 if(!enabled||!authed)return null
 const maxRating=Math.max(1,...(data?.ratings||[]).map(x=>x.count))
 return <div className={`dlv-feedback-admin${open?' is-open':''}`}>
  <button className="dlv-feedback-admin-toggle" onClick={()=>setOpen(v=>!v)}>Feedback <b>{data?.total??'—'}</b></button>
  {open&&<aside>
   <header><div><small>DLAVIE EXPERIENCE</small><h2>Feedback Insights</h2><p>Ringkasan pengalaman user dan masukan terbaru.</p></div><button onClick={()=>setOpen(false)} aria-label="Tutup">×</button></header>
   <div className="dlv-feedback-admin-body">
    {error&&<div className="dlv-feedback-admin-error">{error}</div>}
    <section className="dlv-feedback-kpis"><article><small>RATA-RATA</small><strong>{data?data.average.toFixed(1):'—'} <span>★</span></strong><p>dari 5 bintang</p></article><article><small>TOTAL FEEDBACK</small><strong>{data?.total??'—'}</strong><p>250 respons terbaru</p></article><article><small>PERLU PERHATIAN</small><strong>{data?.ratings.filter(x=>x.star<=2).reduce((a,b)=>a+b.count,0)??'—'}</strong><p>rating 1–2 bintang</p></article></section>
    <section className="dlv-feedback-chart"><div className="section-head"><div><small>DISTRIBUSI RATING</small><h3>Bagaimana user menilai DLavie</h3></div><button disabled={busy} onClick={()=>void load()}>{busy?'Memuat…':'↻ Refresh'}</button></div>{[5,4,3,2,1].map(star=>{const item=data?.ratings.find(x=>x.star===star);const count=item?.count||0;return <div className="rating-row" key={star}><span>{star} ★</span><i><b style={{width:`${count/maxRating*100}%`}}/></i><strong>{count}</strong></div>})}</section>
    <section className="dlv-feedback-topics"><small>AREA PENGALAMAN</small><h3>Bagian yang paling sering dinilai</h3><div>{(data?.topics||[]).map(x=><button key={x.name} onClick={()=>setFilter(filter===x.name?'all':x.name)} className={filter===x.name?'active':''}><span>{x.name}</span><b>{x.count}</b><small>{x.count?`${x.average.toFixed(1)} ★`:'Belum ada'}</small></button>)}</div></section>
    <section className="dlv-feedback-comments"><div className="section-head"><div><small>MASUKAN TERBARU</small><h3>Suara pengguna</h3></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Semua</option><option value="low">Rating rendah</option>{(data?.topics||[]).map(x=><option value={x.name} key={x.name}>{x.name}</option>)}</select></div><div className="feedback-list">{rows.length?rows.map(row=><article key={row.id}><div className="feedback-meta"><span className={`stars is-${row.rating}`}>{'★'.repeat(row.rating)}{'☆'.repeat(5-row.rating)}</span><time>{date(row.created_at)}</time></div><h4>{row.topic||'Pengalaman umum'}</h4><p>{row.message||'User memberikan rating tanpa komentar tertulis.'}</p><footer><span>{row.username||'User DLavie'}</span><code>{row.user_id}</code></footer></article>):<div className="empty">Belum ada feedback untuk filter ini.</div>}</div></section>
   </div>
  </aside>}
 </div>
}