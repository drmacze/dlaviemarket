import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import DigitalOrderHistory from './DigitalOrderHistory'
import DigitalBrandIcon,{DigitalCategoryIcon} from './DigitalBrandIcon'
import { digitalAuth, digitalCall, digitalExtendedCall, digitalExtendedKind, digitalRoute, digitalStatus, digitalTargetLabel, isDigitalMarket, money, type DigitalIntegration, type DigitalOrder, type DigitalProduct, type DigitalSummary } from './digital-market-api'
import './digital-market-extended-v13.css'

const STATE_EVENT='dlavie:state-changed'
type MarketKind='prepaid'|'postpaid'
type ViewMode='grid'|'list'
const routeKind=():MarketKind=>digitalRoute().params.get('kind')==='postpaid'?'postpaid':'prepaid'
const detailRows=(detail?:Record<string,unknown>|null)=>{
 if(!detail)return [] as Array<[string,string]>
 const labels:Record<string,string>={tarif:'Tarif',daya:'Daya',lembar_tagihan:'Lembar tagihan',alamat:'Alamat',jatuh_tempo:'Jatuh tempo',jumlah_peserta:'Jumlah peserta',item_name:'Item',tahun_pajak:'Tahun pajak',kelurahan:'Kelurahan',kecamatan:'Kecamatan',kab_kota:'Kab/Kota',nomor_polisi:'Nomor polisi',merek_kb:'Merek kendaraan',model_kb:'Model kendaraan',tahun_buatan:'Tahun kendaraan'}
 return Object.entries(detail).filter(([k,v])=>k!=='detail'&&!k.startsWith('_dlavie_')&&v!=null&&typeof v!=='object').slice(0,8).map(([k,v])=>[labels[k]||k.replaceAll('_',' '),String(v)] as [string,string])
}
const fallbackPrepaid=[['Pulsa','Isi ulang semua operator'],['Paket Data','Kuota & paket internet'],['PLN','Token listrik prabayar'],['E-Wallet','Top up saldo digital'],['Voucher & Game','Voucher game dan hiburan']] as const
const fallbackPostpaid=[['Bayar Tagihan','PLN, BPJS, PDAM, internet dan tagihan lainnya']] as const

function ViewSwitch({value,onChange}:{value:ViewMode;onChange:(value:ViewMode)=>void}){
 const icon=(type:ViewMode)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">{type==='grid'?<><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>:<><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></>}</svg>
 return <div className="dlv-view-switch" role="group" aria-label="Mode tampilan"><button className={value==='grid'?'is-active':''} type="button" aria-label="Tampilan grid" onClick={()=>onChange('grid')}>{icon('grid')}</button><button className={value==='list'?'is-active':''} type="button" aria-label="Tampilan list" onClick={()=>onChange('list')}>{icon('list')}</button></div>
}

export default function DLavieDigitalMarket(){
 const [active,setActive]=useState(isDigitalMarket)
 const [summary,setSummary]=useState<DigitalSummary[]>([])
 const [integration,setIntegration]=useState<DigitalIntegration|null>(null)
 const [kind,setKind]=useState<MarketKind>(routeKind)
 const [category,setCategory]=useState('')
 const [brand,setBrand]=useState('')
 const [query,setQuery]=useState('')
 const [products,setProducts]=useState<DigitalProduct[]>([])
 const [selected,setSelected]=useState<DigitalProduct|null>(null)
 const [target,setTarget]=useState('')
 const [extraIdentity,setExtraIdentity]=useState('')
 const [extraAmount,setExtraAmount]=useState('')
 const [extraYear,setExtraYear]=useState('')
 const [busy,setBusy]=useState(false)
 const [loading,setLoading]=useState(false)
 const [error,setError]=useState('')
 const [receipt,setReceipt]=useState<DigitalOrder|null>(null)
 const [orders,setOrders]=useState<DigitalOrder[]>([])
 const [historyOpen,setHistoryOpen]=useState(false)
 const [balance,setBalance]=useState(()=>Number(localStorage.getItem('dlavie-balance')||0))
 const [view,setView]=useState<ViewMode>(()=>localStorage.getItem('dlavie-market-view')==='list'?'list':'grid')
 const nokos=digitalRoute().name==='market'&&digitalRoute().params.get('mode')==='nokos'

 const resetExtras=()=>{setExtraIdentity('');setExtraAmount('');setExtraYear('')}
 const loadSummary=useCallback(async()=>{try{const d=await digitalCall('summary');setSummary((d.summary||[]).map((x:any)=>({...x,product_count:Number(x.product_count||0),min_price:Number(x.min_price||0),max_price:Number(x.max_price||0),brands:Array.isArray(x.brands)?x.brands:[]})));setIntegration(d.integration||null)}catch(e){setError(e instanceof Error?e.message:'Katalog belum dapat dimuat.')}},[])
 const loadProducts=useCallback(async(k:MarketKind,cat:string,br='',q='')=>{if(!cat)return;setLoading(true);setError('');try{const d=await digitalCall('products',{category:cat,brand:br,q,kind:k,limit:'100'});setProducts(d.products||[])}catch(e){setError(e instanceof Error?e.message:'Produk belum dapat dimuat.')}finally{setLoading(false)}},[])
 const loadHistory=useCallback(async()=>{const a=digitalAuth();if(!a.wallet_token||!a.user_id)return;try{const d=await digitalCall('history',a);setOrders(d.orders||[]);if(typeof d.balance==='number'){setBalance(d.balance);localStorage.setItem('dlavie-balance',String(d.balance));window.dispatchEvent(new CustomEvent(STATE_EVENT))}}catch{}},[])

 useEffect(()=>{const sync=()=>{const yes=isDigitalMarket();setActive(yes);if(yes&&!digitalRoute().params.get('mode'))setKind(routeKind());document.documentElement.toggleAttribute('data-digital-market',yes)};sync();window.addEventListener('hashchange',sync);return()=>{window.removeEventListener('hashchange',sync);document.documentElement.removeAttribute('data-digital-market')}},[])
 useEffect(()=>{if(active){void loadSummary();void loadHistory()}},[active,loadSummary,loadHistory])
 useEffect(()=>{if(!active||!category)return;const t=window.setTimeout(()=>void loadProducts(kind,category,brand,query),220);return()=>clearTimeout(t)},[active,kind,category,brand,query,loadProducts])
 useEffect(()=>{const sync=()=>setBalance(Number(localStorage.getItem('dlavie-balance')||0));window.addEventListener(STATE_EVENT,sync);return()=>window.removeEventListener(STATE_EVENT,sync)},[])

 const groups=useMemo(()=>summary.filter(x=>x.product_kind===kind),[summary,kind])
 const current=groups.find(x=>x.category===category)
 const prepaidCount=summary.filter(x=>x.product_kind==='prepaid').reduce((n,x)=>n+x.product_count,0)
 const postpaidCount=summary.filter(x=>x.product_kind==='postpaid').reduce((n,x)=>n+x.product_count,0)
 const extended=digitalExtendedKind(selected)
 const extraReady=extended==='emoney'?Number(extraAmount)>=1000:extended==='samsat'?extraIdentity.trim().length>=4:true

 useEffect(()=>{
  if(!active||category||!groups.length)return
  const requested=(digitalRoute().params.get('category')||'').trim().toLowerCase()
  if(!requested)return
  const match=groups.find(x=>x.category.toLowerCase()===requested||x.category.toLowerCase().includes(requested)||requested.includes(x.category.toLowerCase()))
  if(match)setCategory(match.category)
 },[active,category,groups])

 const setViewMode=(next:ViewMode)=>{setView(next);localStorage.setItem('dlavie-market-view',next)}
 const chooseKind=(value:MarketKind)=>{setKind(value);setCategory('');setBrand('');setQuery('');setProducts([]);setSelected(null);setReceipt(null);setTarget('');resetExtras();const next=value==='postpaid'?'#/market?kind=postpaid':'#/market';if(location.hash!==next)location.hash=next}
 const chooseCategory=(c:string)=>{setCategory(c);setBrand('');setQuery('');setSelected(null);setReceipt(null);setTarget('');resetExtras()}
 const chooseProduct=(p:DigitalProduct)=>{setSelected(p);setReceipt(null);setTarget('');resetExtras()}
 const updateBalance=(v:unknown)=>{if(typeof v!=='number')return;setBalance(v);localStorage.setItem('dlavie-balance',String(v));window.dispatchEvent(new CustomEvent(STATE_EVENT))}
 const purchase=async(e:FormEvent)=>{
  e.preventDefault();if(!selected||busy||target.trim().length<3||!extraReady)return
  setBusy(true);setError('')
  try{
   const auth=digitalAuth();let d:any
   if(kind==='postpaid'&&extended){
    const customer=extended==='samsat'?`${target.trim()},${extraIdentity.trim()}`:target.trim()
    const extra:Record<string,string>={...auth,sku:selected.sku,customer_no:customer}
    if(extended==='emoney')extra.amount=String(Math.round(Number(extraAmount)))
    if(extended==='pbb'&&extraYear.trim())extra.year=extraYear.trim()
    d=await digitalExtendedCall(extra)
   }else{
    const action=kind==='postpaid'?'inquiry_postpaid':'purchase'
    d=await digitalCall(action,{...auth,sku:selected.sku,customer_no:target.trim()})
   }
   setReceipt(d.order);updateBalance(d.balance);setSelected(null);setTarget('');resetExtras();await loadHistory()
  }catch(e){setError(e instanceof Error?e.message:'Transaksi belum dapat diproses.')}finally{setBusy(false)}
 }
 const payPostpaid=async(ref:string)=>{if(busy)return;setBusy(true);setError('');try{const d=await digitalCall('pay_postpaid',{...digitalAuth(),ref_id:ref});setReceipt(d.order);updateBalance(d.balance);setHistoryOpen(false);await loadHistory()}catch(e){setError(e instanceof Error?e.message:'Pembayaran tagihan belum dapat diproses.')}finally{setBusy(false)}}
 const checkStatus=async(ref:string)=>{if(busy)return;setBusy(true);setError('');try{const d=await digitalCall('status',{...digitalAuth(),ref_id:ref});setReceipt(d.order);updateBalance(d.balance);await loadHistory()}catch(e){setError(e instanceof Error?e.message:'Status belum dapat diperbarui.')}finally{setBusy(false)}}

 if(nokos)return <button className="dlv-digital-return" onClick={()=>{location.hash='#/market'}}>← Digital Market</button>
 if(!active)return null
 const billRows=detailRows(receipt?.inquiry_detail)
 const fallbacks=kind==='prepaid'?fallbackPrepaid:fallbackPostpaid

 return <main className="dlv-digital-market"><div className="dlv-digital-shell">
  <header className="dlv-digital-hero"><div><span>DLAVIE · DIGITAL MARKET</span><h1>Satu saldo.<br/>Lebih banyak kebutuhan digital.</h1><p>Pulsa, paket data, listrik, e-wallet, voucher, game, tagihan bulanan, dan Nomor Virtual dalam satu marketplace.</p></div><aside><small>SALDO WALLET</small><strong>{money.format(balance)}</strong><button onClick={()=>document.querySelector<HTMLButtonElement>('.balance-pill')?.click()}>Tambah saldo</button></aside></header>
  <div className="dlv-digital-status"><span className={integration?.enabled?'is-on':''}/><b>{integration?.enabled?'H2H.id aktif':'H2H.id catalog'}</b><em>{integration?.catalog_count||0} SKU</em><button onClick={()=>setHistoryOpen(true)}>Pesanan saya {orders.length?`· ${orders.length}`:''}</button></div>
  {error&&<div className="dlv-digital-alert">{error}<button onClick={()=>setError('')}>×</button></div>}

  {!category?<section>
   <div className="dlv-digital-title-row"><div className="dlv-digital-title"><span>LAYANAN DIGITAL</span><h2>Apa yang kamu butuhkan?</h2></div><ViewSwitch value={view} onChange={setViewMode}/></div>
   <div className="dlv-market-kind-switch"><button className={kind==='prepaid'?'is-active':''} onClick={()=>chooseKind('prepaid')}><i><DigitalCategoryIcon value="Pulsa dan Data"/></i><span><strong>Produk Instan</strong><small>Pulsa, data, voucher, game, e-wallet · {prepaidCount} SKU</small></span></button><button className={kind==='postpaid'?'is-active':''} onClick={()=>chooseKind('postpaid')} disabled={!integration?.postpaid_enabled}><i><DigitalCategoryIcon value="Bayar Tagihan"/></i><span><strong>Bayar Tagihan</strong><small>{integration?.postpaid_enabled?`Inquiry dulu, bayar setelah detail cocok · ${postpaidCount} layanan`:'Belum diaktifkan admin'}</small></span></button></div>
   <div className={`dlv-category-grid is-${view}`}>
    <button className="is-legacy" onClick={()=>{location.hash='#/market?mode=nokos'}}><i><DigitalCategoryIcon value="Nomor Virtual"/></i><span><strong>Nomor Virtual</strong><small>Layanan nomor & verifikasi DLavie</small></span><b>→</b></button>
    {groups.map(x=><button key={`${kind}-${x.category}`} onClick={()=>chooseCategory(x.category)}><i><DigitalCategoryIcon value={x.category}/></i><span><strong>{x.category}</strong><small>{kind==='prepaid'?`${x.product_count} produk · mulai ${money.format(x.min_price)}`:`${x.product_count} layanan · ${x.brands.length} brand`}</small></span><b>→</b></button>)}
    {!groups.length&&fallbacks.map(([name,description])=><button className="is-sync-pending" type="button" key={name} aria-disabled="true"><i><DigitalCategoryIcon value={name}/></i><span><strong>{name}</strong><small>{description} · menunggu sinkron katalog H2H.id</small></span><b>SYNC</b></button>)}
   </div>
   {!groups.length&&<div className="dlv-catalog-empty"><b>{kind==='postpaid'?'Katalog tagihan belum tersedia.':'Kategori sudah disiapkan.'}</b><span>{integration?.catalog_count?'Aktifkan katalog tagihan dari H2H Control lalu sinkron ulang.':'Begitu katalog H2H.id disinkronkan, kartu di atas otomatis berubah menjadi kategori dan produk aktif.'}</span></div>}
  </section>:
  <section className="dlv-product-stage">
   <button className="dlv-digital-back" onClick={()=>{setCategory('');setProducts([]);setSelected(null);setReceipt(null);setTarget('');resetExtras()}}>← Semua kategori</button>
   <div className="dlv-product-head"><div><span>{kind==='postpaid'?'BAYAR TAGIHAN':'PRODUK DIGITAL'}</span><h2>{category}</h2><p>{current?.product_count||0} {kind==='postpaid'?'layanan':'SKU'} tersedia.</p></div><div className="dlv-product-head-tools"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari produk atau brand…"/><ViewSwitch value={view} onChange={setViewMode}/></div></div>
   {current?.brands?.length?<div className="dlv-brand-strip"><button className={!brand?'is-active':''} onClick={()=>setBrand('')}>Semua</button>{current.brands.slice(0,24).map(x=><button key={x} className={brand===x?'is-active':''} onClick={()=>setBrand(x)}><DigitalBrandIcon brand={x} category={category}/><span>{x}</span></button>)}</div>:null}
   <div className="dlv-product-layout"><div className={`dlv-product-list is-${view}`}>{loading?<div className="dlv-product-loading">Memuat katalog…</div>:products.map(p=>{const ext=digitalExtendedKind(p);return <button key={p.sku} className={`${selected?.sku===p.sku?'is-selected ':''}${ext?'is-extended-ready':''}`} onClick={()=>chooseProduct(p)}><i className="dlv-product-brand"><DigitalBrandIcon brand={p.brand} category={p.category}/></i><span><small>{p.brand} · {p.product_type||p.category}</small><strong>{p.product_name}</strong><em>{ext?`Format khusus · ${ext==='pbb'?'PBB':ext==='emoney'?'E-Money':'SAMSAT'}`:kind==='postpaid'?'Cek nominal tagihan sebelum bayar':`${p.unlimited_stock?'Stok tersedia':`Stok ${p.stock}`}${p.multi?' · Multi trx':''}`}</em></span><b>{kind==='postpaid'?'Cek tagihan':money.format(p.sell_price)}</b></button>})}{!loading&&!products.length&&<div className="dlv-product-empty">Tidak ada produk untuk filter ini.</div>}</div>
   <aside className="dlv-product-checkout">{selected?<form onSubmit={purchase}><small>{kind==='postpaid'?'INQUIRY TAGIHAN':'CHECKOUT'}</small><div className="dlv-checkout-brand"><DigitalBrandIcon brand={selected.brand} category={selected.category}/><div><h3>{selected.product_name}</h3><p>{selected.brand} · {selected.sku}</p></div></div><label><span>{extended==='samsat'?'Kode pembayaran':extended==='pbb'?'NOP / nomor pembayaran':extended==='emoney'?'Nomor E-Money / HP':digitalTargetLabel(selected.category,selected.brand)}</span><input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Masukkan tujuan dengan teliti" autoComplete="off" required/></label>{extended==='samsat'&&<label className="dlv-extended-field"><span>Nomor identitas</span><input value={extraIdentity} onChange={e=>setExtraIdentity(e.target.value.replace(/[^0-9A-Za-z]/g,''))} placeholder="Nomor identitas pemilik" autoComplete="off" required/></label>}{extended==='emoney'&&<label className="dlv-extended-field"><span>Nominal E-Money</span><input inputMode="numeric" value={extraAmount} onChange={e=>setExtraAmount(e.target.value.replace(/\D/g,''))} placeholder="Contoh 25000" autoComplete="off" required/><small>{extraAmount?money.format(Number(extraAmount||0)):'Masukkan nominal top up yang ingin dicek.'}</small></label>}{extended==='pbb'&&<label className="dlv-extended-field"><span>Tahun pajak <i>opsional</i></span><input inputMode="numeric" maxLength={4} value={extraYear} onChange={e=>setExtraYear(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="Kosong = tahun berjalan" autoComplete="off"/><small>Isi 4 digit bila supplier meminta tahun pajak tertentu.</small></label>}{extended&&<div className="dlv-extended-note"><b>Format khusus aktif</b><span>Data tambahan akan dikirim sesuai format supplier pada tahap inquiry.</span></div>}{selected.description&&<div className="dlv-product-desc">{selected.description}</div>}{kind==='prepaid'&&<div className="dlv-checkout-total"><span>Total</span><strong>{money.format(selected.sell_price)}</strong></div>}<button disabled={busy||target.trim().length<3||!extraReady}>{busy?'Memproses…':kind==='postpaid'?'Cek tagihan':'Bayar dengan Wallet'}<b>→</b></button><em>{kind==='postpaid'?'Saldo belum dipotong saat cek tagihan.':'Harga dan saldo diverifikasi ulang di server.'}</em></form>:receipt?<div className={`dlv-digital-receipt${receipt.product_kind==='postpaid'?' is-postpaid':''}`}><small>{receipt.product_kind==='postpaid'?'TAGIHAN DIGITAL':'DIGITAL ORDER'}</small><h3>{digitalStatus(receipt.status)}</h3><code>{receipt.ref_id}</code><p>{receipt.product_name}</p>{receipt.customer_name&&<div className="dlv-bill-identity"><small>NAMA PELANGGAN</small><b>{receipt.customer_name}</b><span>{receipt.customer_no}</span></div>}{receipt.period&&<div className="dlv-bill-period"><small>PERIODE</small><b>{receipt.period}</b></div>}{billRows.length>0&&<div className="dlv-bill-details">{billRows.map(([k,v])=><p key={k}><span>{k}</span><b>{v}</b></p>)}</div>}<div className="dlv-bill-total"><span>{receipt.product_kind==='postpaid'?'Total pembayaran':'Total'}</span><strong>{money.format(receipt.sell_price)}</strong></div>{receipt.message&&<span>{receipt.message}</span>}{receipt.serial_number&&<div><small>SN / TOKEN</small><b>{receipt.serial_number}</b></div>}{receipt.status==='inquired'&&<><div className="dlv-bill-lock"><span>✓ Detail tagihan sudah dibekukan</span><small>Selesaikan pembayaran sebelum masa inquiry H2H berakhir.</small></div><button className="is-pay" disabled={busy||balance<receipt.sell_price} onClick={()=>void payPostpaid(receipt.ref_id)}>{busy?'Memproses…':balance<receipt.sell_price?'Saldo tidak cukup':'Bayar dengan Wallet'}</button></>}{receipt.status==='pending'&&<button disabled={busy} onClick={()=>void checkStatus(receipt.ref_id)}>Cek status</button>}</div>:<div className="dlv-checkout-empty"><i>{kind==='postpaid'?'⌁':'↗'}</i><strong>Pilih {kind==='postpaid'?'layanan tagihan':'produk'}</strong><span>{kind==='postpaid'?'Cek tagihan untuk melihat nama, periode, dan total sebelum membayar.':'Detail dan kolom tujuan akan muncul di sini.'}</span></div>}</aside></div>
  </section>}
 </div><DigitalOrderHistory open={historyOpen} orders={orders} busy={busy} onClose={()=>setHistoryOpen(false)} onCheck={ref=>void checkStatus(ref)} onPay={ref=>void payPostpaid(ref)}/></main>
}
