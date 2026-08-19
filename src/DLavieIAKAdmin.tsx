import { FormEvent, useEffect, useState } from 'react'

const API='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-iak-admin'
const TOKEN='dlavie-admin-support-session-v1'

type Settings={
 environment:string
 markup_mode:string
 markup_value:number
 minimum_markup:number
 live_enabled:boolean
 prepaid_enabled:boolean
 postpaid_enabled:boolean
 catalog_count:number
 last_catalog_sync_at?:string|null
 last_catalog_sync_status?:string|null
 last_catalog_sync_message?:string|null
}
type Status={
 settings:Settings
 secrets:{username:boolean;sandbox_api_key:boolean;production_api_key:boolean}
 readiness?:{credentials:boolean;catalog:boolean;testing_safe:boolean;production_safe:boolean}
 callback_url?:string
}

async function call(action:string,extra:Record<string,string>={}){
 const token=sessionStorage.getItem(TOKEN)||''
 if(!token)throw new Error('Login admin terlebih dahulu.')
 const r=await fetch(API,{method:'POST',body:new URLSearchParams({action,admin_token:token,...extra})})
 const d=await r.json().catch(()=>({}))
 if(!r.ok||!d.ok)throw new Error(d.message||d.error||'IAK Control gagal diproses.')
 return d
}

const date=(v?:string|null)=>v?new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(v)):'Belum pernah'

export default function DLavieIAKAdmin(){
 const enabled=new URLSearchParams(location.search).get('support-admin')==='1'
 const [authed,setAuthed]=useState(()=>!!sessionStorage.getItem(TOKEN))
 const [open,setOpen]=useState(false)
 const [data,setData]=useState<Status|null>(null)
 const [username,setUsername]=useState('')
 const [sandboxKey,setSandboxKey]=useState('')
 const [productionKey,setProductionKey]=useState('')
 const [environment,setEnvironment]=useState('testing')
 const [markupMode,setMarkupMode]=useState('fixed')
 const [markupValue,setMarkupValue]=useState('500')
 const [minimum,setMinimum]=useState('300')
 const [live,setLive]=useState(false)
 const [postpaid,setPostpaid]=useState(false)
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 const [error,setError]=useState('')

 useEffect(()=>{if(!enabled)return;const t=setInterval(()=>setAuthed(!!sessionStorage.getItem(TOKEN)),600);return()=>clearInterval(t)},[enabled])
 const apply=(s:Status)=>{setData(s);setEnvironment(s.settings.environment||'testing');setMarkupMode(s.settings.markup_mode||'fixed');setMarkupValue(String(s.settings.markup_value??500));setMinimum(String(s.settings.minimum_markup??300));setLive(!!s.settings.live_enabled);setPostpaid(!!s.settings.postpaid_enabled)}
 const load=async()=>{try{apply(await call('status'))}catch(e){setError(e instanceof Error?e.message:'Status IAK gagal dimuat.')}}
 useEffect(()=>{if(authed&&enabled)void load()},[authed,enabled])
 useEffect(()=>{if(open&&authed)void load()},[open,authed])
 const run=async(fn:()=>Promise<any>,ok:string)=>{setBusy(true);setError('');setMessage('');try{const d=await fn();setMessage(ok);await load();return d}catch(e){setError(e instanceof Error?e.message:'Operasi IAK gagal.');return null}finally{setBusy(false)}}
 const saveCred=async(e:FormEvent)=>{e.preventDefault();const d=await run(()=>call('save_credentials',{username,sandbox_api_key:sandboxKey,production_api_key:productionKey}),'Credential IAK tersimpan aman di Supabase Vault.');if(d){setSandboxKey('');setProductionKey('')}}
 if(!enabled||!authed)return null
 const environmentSaved=!!data&&environment===data.settings.environment
 const testingReady=data?.readiness?.testing_safe??false
 const productionReady=data?.readiness?.production_safe??false
 const currentReady=environmentSaved&&(environment==='production'?productionReady:testingReady)
 const activeKeyReady=environment==='testing'?!!data?.secrets.sandbox_api_key:!!data?.secrets.production_api_key
 const apiActionReady=environmentSaved&&!!data?.secrets.username&&activeKeyReady
 const callback=data?.callback_url||'https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-iak-callback'

 return <div className={`dlv-digi-admin${open?' is-open':''}`}>
  <button className="dlv-digi-admin-toggle" onClick={()=>setOpen(v=>!v)}>IAK <b>{data?.settings.catalog_count||0}</b></button>
  {open&&<aside>
   <header><div><span>IAK CONTROL CENTER</span><strong>Catalog · direct API · pricing · callback</strong></div><button onClick={()=>setOpen(false)}>×</button></header>
   <div className="dlv-digi-admin-body">
    <section className="dlv-digi-health"><i className={currentReady?'is-on':''}/><div><strong>{currentReady?(environment==='production'?'IAK Production siap':'IAK Sandbox siap'):'Setup IAK belum lengkap'}</strong><span>{data?.settings.live_enabled?'Transaksi aktif':'Transaksi dikunci'} · {data?.settings.environment||'testing'} · {data?.settings.catalog_count||0} SKU · Gateway tidak diperlukan</span></div><button disabled={busy} onClick={()=>void load()}>Refresh</button></section>
    {error&&<div className="dlv-digi-error">{error}</div>}{message&&<div className="dlv-digi-success">{message}</div>}

    <section><h3>1. Credential IAK</h3><p>Username IAK dan API Key disimpan di Supabase Vault. API Key tidak pernah dikirim ke browser user.</p><form onSubmit={saveCred}><input value={username} onChange={e=>setUsername(e.target.value)} placeholder={data?.secrets.username?'Username tersimpan · isi username IAK':'Username / nomor terdaftar IAK'} autoComplete="off"/><input type="password" value={sandboxKey} onChange={e=>setSandboxKey(e.target.value)} placeholder={data?.secrets.sandbox_api_key?'Sandbox API Key tersimpan · kosongkan bila tidak diganti':'Sandbox API Key'} autoComplete="new-password"/><input type="password" value={productionKey} onChange={e=>setProductionKey(e.target.value)} placeholder={data?.secrets.production_api_key?'Production API Key tersimpan · kosongkan bila tidak diganti':'Production API Key · boleh dikosongkan dulu'} autoComplete="new-password"/><button disabled={busy||username.trim().length<4}>Simpan credential</button></form><small>Untuk mulai, Sandbox API Key saja sudah cukup. Production Key bisa diisi nanti.</small></section>

    <section><h3>2. Koneksi langsung IAK</h3><p>Supabase memanggil IAK langsung. Tidak ada Static Egress Gateway. Pada Sandbox kamu bisa langsung test; untuk Production, aktifkan opsi <b>Allow transactions from any IP</b> di pengaturan keamanan IAK bila ingin tetap tanpa gateway.</p><div className="dlv-digi-row"><button className="is-secondary" disabled={busy||!apiActionReady} onClick={()=>void run(()=>call('test_connection'),`Koneksi IAK ${environment==='production'?'Production':'Sandbox'} berhasil.`)}>Test koneksi IAK</button></div>{!environmentSaved&&<small>Simpan pengaturan environment terlebih dahulu sebelum Test atau Sync.</small>}</section>

    <section><h3>3. Callback prepaid</h3><p>Pasang URL ini sebagai callback IAK. Callback diverifikasi menggunakan signature IAK, jadi tidak memerlukan webhook secret tambahan.</p><code className="dlv-digi-url">{callback}</code><div className="dlv-digi-row"><button className="is-secondary" type="button" onClick={()=>void navigator.clipboard.writeText(callback)}>Copy callback URL</button></div></section>

    <section><h3>4. Harga & environment</h3><div className="dlv-digi-grid"><label><span>Environment</span><select value={environment} onChange={e=>setEnvironment(e.target.value)}><option value="testing">Testing / Sandbox</option><option value="production">Production</option></select></label><label><span>Markup</span><select value={markupMode} onChange={e=>setMarkupMode(e.target.value)}><option value="fixed">Nominal Rp</option><option value="percent">Persentase %</option></select></label><label><span>Nilai markup</span><input inputMode="decimal" value={markupValue} onChange={e=>setMarkupValue(e.target.value)}/></label><label><span>Minimum markup</span><input inputMode="numeric" value={minimum} onChange={e=>setMinimum(e.target.value)}/></label></div><label className="dlv-digi-check"><input type="checkbox" checked={postpaid} onChange={e=>setPostpaid(e.target.checked)}/><span>Aktifkan katalog & flow Bayar Tagihan</span></label><label className="dlv-digi-check"><input type="checkbox" checked={live} onChange={e=>setLive(e.target.checked)}/><span>Aktifkan transaksi digital</span></label><button disabled={busy} onClick={()=>void run(()=>call('save_settings',{environment,markup_mode:markupMode,markup_value:markupValue,minimum_markup:minimum,postpaid_enabled:String(postpaid),live_enabled:String(live)}),'Pengaturan IAK disimpan. Jika katalog direset, lakukan Sync ulang.')}>Simpan pengaturan</button><small>Biarkan transaksi digital OFF saat pertama setup. Perubahan environment, markup, atau postpaid akan mengunci transaksi sampai katalog disinkron ulang.</small></section>

    <section className="dlv-digi-sync"><h3>5. Sinkron katalog IAK</h3><p>Price list IAK disimpan ke database DLavie. User membaca cache server, bukan memanggil API IAK langsung.</p><button disabled={busy||!apiActionReady} onClick={()=>void run(()=>call('sync_catalog'),'Katalog IAK selesai disinkronkan.')}>{busy?'Memproses…':'Sync katalog sekarang'}</button><small>Terakhir: {date(data?.settings.last_catalog_sync_at)} · {data?.settings.last_catalog_sync_status||'—'} · {data?.settings.last_catalog_sync_message||'—'}</small></section>
   </div>
  </aside>}
 </div>
}
