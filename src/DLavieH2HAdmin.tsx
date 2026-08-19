import { FormEvent, useEffect, useState } from 'react'

const API='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-h2h-admin'
const TOKEN='dlavie-admin-support-session-v1'

type Settings={
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
 last_hcoin_balance?:number|null
 last_verification?:Record<string,unknown>|null
 webhook_configured?:boolean
}
type Status={
 settings:Settings
 secrets:{member_id:boolean;pin:boolean;password:boolean;webhook_key:boolean}
 readiness?:{credentials:boolean;catalog:boolean;ready:boolean}
 callback_url?:string
}

const friendlyError=(value:unknown)=>{
 const raw=String(value||'').trim()
 const map:Record<string,string>={
  h2h_admin_error:'Panel H2H belum dapat memuat status. Tekan Refresh; jika tetap muncul, koneksi backend H2H perlu diperiksa.',
  admin_auth_required:'Sesi admin sudah berakhir. Tutup panel lalu login admin kembali.',
  credentials_required:'Simpan credential H2H.id terlebih dahulu.',
  invalid_credentials:'Credential H2H.id ditolak. Periksa Member ID, PIN transaksi, dan Password H2H.',
  market_not_ready:'Setup belum lengkap. Test koneksi dan sinkronkan katalog sebelum mengaktifkan transaksi.'
 }
 return map[raw]||raw||'H2H Control belum dapat diproses.'
}

async function call(action:string,extra:Record<string,string>={}){
 const token=sessionStorage.getItem(TOKEN)||''
 if(!token)throw new Error('Login admin terlebih dahulu.')
 const r=await fetch(API,{method:'POST',body:new URLSearchParams({action,admin_token:token,...extra})})
 const d=await r.json().catch(()=>({}))
 if(!r.ok||!d.ok)throw new Error(friendlyError(d.message||d.error))
 return d
}

const date=(v?:string|null)=>v?new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(v)):'Belum pernah'
const money=new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})

export default function DLavieH2HAdmin(){
 const enabled=new URLSearchParams(location.search).get('support-admin')==='1'
 const [authed,setAuthed]=useState(()=>!!sessionStorage.getItem(TOKEN))
 const [open,setOpen]=useState(false)
 const [data,setData]=useState<Status|null>(null)
 const [memberId,setMemberId]=useState('')
 const [pin,setPin]=useState('')
 const [password,setPassword]=useState('')
 const [webhookKey,setWebhookKey]=useState('')
 const [markupMode,setMarkupMode]=useState('fixed')
 const [markupValue,setMarkupValue]=useState('500')
 const [minimum,setMinimum]=useState('300')
 const [live,setLive]=useState(false)
 const [postpaid,setPostpaid]=useState(false)
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 const [error,setError]=useState('')

 useEffect(()=>{if(!enabled)return;const t=setInterval(()=>setAuthed(!!sessionStorage.getItem(TOKEN)),600);return()=>clearInterval(t)},[enabled])
 const apply=(s:Status)=>{setData(s);setMarkupMode(s.settings.markup_mode||'fixed');setMarkupValue(String(s.settings.markup_value??500));setMinimum(String(s.settings.minimum_markup??300));setLive(!!s.settings.live_enabled);setPostpaid(!!s.settings.postpaid_enabled)}
 const load=async()=>{setError('');try{apply(await call('status'))}catch(e){setError(friendlyError(e instanceof Error?e.message:e))}}
 useEffect(()=>{if(authed&&enabled)void load()},[authed,enabled])
 useEffect(()=>{if(open&&authed)void load()},[open,authed])
 const run=async(fn:()=>Promise<any>,ok:string)=>{setBusy(true);setError('');setMessage('');try{const d=await fn();setMessage(ok);await load();return d}catch(e){setError(friendlyError(e instanceof Error?e.message:e));return null}finally{setBusy(false)}}
 const saveCred=async(e:FormEvent)=>{e.preventDefault();const d=await run(()=>call('save_credentials',{member_id:memberId,pin,password}),'Credential H2H.id tersimpan aman di Supabase Vault.');if(d){setPin('');setPassword('')}}
 if(!enabled||!authed)return null
 const credentials=!!data?.readiness?.credentials
 const ready=!!data?.readiness?.ready
 const callback=data?.callback_url||'https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-h2h-callback'
 const verification=data?.settings.last_verification
 const kyc=verification&&typeof verification==='object'?(verification as any).kyc_status:null
 const kyb=verification&&typeof verification==='object'?(verification as any).kyb_status:null

 return <div className={`dlv-digi-admin dlv-h2h-admin${open?' is-open':''}`}>
  <button className="dlv-digi-admin-toggle" onClick={()=>setOpen(v=>!v)}>H2H <b>{data?.settings.catalog_count||0}</b></button>
  {open&&<aside>
   <header><div><span>H2H.ID CONTROL CENTER</span><strong>Direct API · Catalog · HCoin · Callback</strong></div><button aria-label="Tutup H2H Control Center" onClick={()=>setOpen(false)}>×</button></header>
   <div className="dlv-digi-admin-body">
    <section className="dlv-digi-health"><i className={ready?'is-on':''}/><div><strong>{ready?'H2H.id siap digunakan':'Setup H2H.id belum lengkap'}</strong><span>{data?.settings.live_enabled?'Transaksi aktif':'Transaksi dikunci'} · {data?.settings.catalog_count||0} SKU · HCoin {money.format(Number(data?.settings.last_hcoin_balance||0))} · Tanpa gateway</span></div><button disabled={busy} onClick={()=>void load()}>↻ Refresh</button></section>
    {error&&<div className="dlv-digi-error">{error}</div>}{message&&<div className="dlv-digi-success">{message}</div>}

    <section><h3>1. Credential H2H.id</h3><p>H2H.id memakai Member ID + PIN transaksi + Password H2H. Password H2H berbeda dari password login akun. Semua nilai disimpan server-side di Supabase Vault.</p><form onSubmit={saveCred}><input value={memberId} onChange={e=>setMemberId(e.target.value)} placeholder={data?.secrets.member_id?'Member ID tersimpan · isi kembali jika mengganti':'Member ID / username H2H.id'} autoComplete="off"/><input type="password" inputMode="numeric" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,20))} placeholder={data?.secrets.pin?'PIN tersimpan · isi kembali jika mengganti':'PIN transaksi H2H'} autoComplete="new-password"/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={data?.secrets.password?'Password H2H tersimpan · isi kembali jika mengganti':'Password H2H (bukan password login)'} autoComplete="new-password"/><button disabled={busy||memberId.trim().length<2||pin.length<4||password.length<4}>Simpan credential</button></form><small>Gunakan Password H2H dari Pengaturan → API H2H, bukan password login akun.</small></section>

    <section><h3>2. Koneksi langsung</h3><p>Supabase memanggil API H2H.id langsung. Static Egress Gateway tidak diperlukan. Agar konfigurasi ini bekerja, kosongkan IP Whitelist di H2H.id; bila whitelist diisi, hanya IP yang terdaftar yang diizinkan.</p><div className="dlv-digi-row"><button className="is-secondary" disabled={busy||!credentials} onClick={async()=>{const d=await run(()=>call('test_connection'),'Koneksi H2H.id berhasil.');if(d?.balance!=null)setMessage(`Koneksi berhasil · HCoin ${money.format(Number(d.balance))}.`)}}>Test koneksi & HCoin</button></div>{(kyc||kyb)&&<small>Verifikasi wallet: KYC {String(kyc||'—')} · KYB {String(kyb||'—')}. Produk e-wallet tertentu dapat memerlukan verifikasi ini.</small>}</section>

    <section><h3>3. Callback transaksi</h3><p>Masukkan URL berikut pada Pengaturan → API H2H. DLavie akan memeriksa ulang status ke H2H sebelum mengubah order atau melakukan refund.</p><code className="dlv-digi-url">{callback}</code><div className="dlv-digi-row"><button className="is-secondary" type="button" onClick={()=>void navigator.clipboard.writeText(callback)}>Copy callback URL</button><button className="is-secondary" disabled={busy} onClick={async()=>{const d=await run(()=>call('generate_webhook_key'),'Webhook Key H2H baru dibuat.');if(d?.secret)setWebhookKey(d.secret)}}>Generate Webhook Key</button></div>{webhookKey&&<div className="dlv-digi-secret"><code>{webhookKey}</code><button onClick={()=>void navigator.clipboard.writeText(webhookKey)}>Copy</button><small>Masukkan nilai yang sama ke kolom Webhook Key di H2H.id. Nilai ini hanya ditampilkan sekarang.</small></div>}{data?.secrets.webhook_key&&!webhookKey&&<small>Webhook Key sudah tersimpan di DLavie.</small>}</section>

    <section><h3>4. Harga & produk</h3><div className="dlv-digi-grid"><label><span>Markup</span><select value={markupMode} onChange={e=>setMarkupMode(e.target.value)}><option value="fixed">Nominal Rp</option><option value="percent">Persentase %</option></select></label><label><span>Nilai markup</span><input inputMode="decimal" value={markupValue} onChange={e=>setMarkupValue(e.target.value)}/></label><label><span>Minimum markup</span><input inputMode="numeric" value={minimum} onChange={e=>setMinimum(e.target.value)}/></label></div><label className="dlv-digi-check"><input type="checkbox" checked={postpaid} onChange={e=>setPostpaid(e.target.checked)}/><span>Aktifkan katalog & flow Bayar Tagihan / PPOB</span></label><label className="dlv-digi-check"><input type="checkbox" checked={live} onChange={e=>setLive(e.target.checked)}/><span>Aktifkan transaksi digital</span></label><button disabled={busy} onClick={()=>void run(()=>call('save_settings',{markup_mode:markupMode,markup_value:markupValue,minimum_markup:minimum,postpaid_enabled:String(postpaid),live_enabled:String(live)}),'Pengaturan H2H.id disimpan. Jika katalog direset, lakukan Sync ulang.')}>Simpan pengaturan</button><small>Biarkan transaksi OFF saat setup awal. Perubahan markup atau pilihan PPOB akan mengunci transaksi sampai katalog disinkron ulang.</small></section>

    <section className="dlv-digi-sync"><h3>5. Sinkron katalog H2H.id</h3><p>Katalog Pulsa, Paket Data, PLN, Voucher/Game, E-Wallet dan layanan lain disimpan ke database DLavie. Produk nominal-bebas belum dibuka pada tahap awal agar perhitungan qty/admin fee tetap aman.</p><button disabled={busy||!credentials} onClick={()=>void run(()=>call('sync_catalog'),'Katalog H2H.id selesai disinkronkan.')}>{busy?'Memproses…':'Sync katalog sekarang'}</button><small>Terakhir: {date(data?.settings.last_catalog_sync_at)} · {data?.settings.last_catalog_sync_status||'—'} · {data?.settings.last_catalog_sync_message||'—'}</small></section>
   </div>
  </aside>}
 </div>
}
