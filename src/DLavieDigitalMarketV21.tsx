import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import DigitalOrderHistory from './DigitalOrderHistory'
import DigitalBrandIcon,{DigitalCategoryIcon} from './DigitalBrandIcon'
import { digitalAuth, digitalCall, digitalExtendedCall, digitalExtendedKind, digitalRoute, digitalStatus, digitalTargetLabel, isDigitalMarket, money, type DigitalIntegration, type DigitalOrder, type DigitalProduct, type DigitalSummary } from './digital-market-api'

const STATE_EVENT='dlavie:state-changed'
type MarketKind='prepaid'|'postpaid'
type ViewMode='grid'|'list'
const routeKind=():MarketKind=>digitalRoute().params.get('kind')==='postpaid'?'postpaid':'prepaid'

const categoryOrder=['Pulsa','Paket Data','PLN','E-Wallet','Voucher & Game','Voucher Operator','Streaming & Hiburan','BPJS','PDAM','Internet & TV','PBB','SAMSAT','Multifinance','Gas','Asuransi','Tagihan Lainnya']
const brandOrder=['Telkomsel','IM3','XL','AXIS','Tri','Smartfren','DANA','OVO','GoPay','ShopeePay','LinkAja','Mobile Legends','Free Fire','PUBG Mobile','Call of Duty Mobile','Honor of Kings','Roblox','Valorant','Genshin Impact','Honkai: Star Rail','Zenless Zone Zero','Arena Breakout','Delta Force','Blood Strike','Wild Rift','League of Legends','FC Mobile','Point Blank']
const idx=(arr:string[],v:string)=>{const i=arr.indexOf(v);return i<0?999:i}
const clean=(v='')=>v.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
const categoryCopy=(value:string)=>{
 const x=clean(value)
 if(x.includes('pulsa'))return'Isi ulang nomor semua operator'
 if(x.includes('paket data'))return'Internet, kuota, combo dan paket operator'
 if(x==='pln'||x.includes('listrik'))return'Token listrik dan layanan PLN'
 if(x.includes('wallet'))return'Top up saldo dompet digital'
 if(x.includes('voucher game'))return'Pilih game dulu, lalu pilih diamonds / points'
 if(x.includes('voucher operator'))return'Voucher fisik/digital operator yang tersedia'
 if(x.includes('streaming'))return'Langganan dan voucher hiburan digital'
 return'Cek layanan, pelanggan dan nominal sebelum bayar'
}
const brandCopy=(category:string,brand:string)=>{
 const x=clean(category)
 if(x.includes('game'))return'Pilih nominal / item'
 if(x.includes('data'))return'Pilih paket internet'
 if(x.includes('pulsa'))return'Pilih nominal pulsa'
 if(x.includes('wallet'))return'Pilih nominal top up'
 if(x.includes('voucher'))return'Pilih voucher tersedia'
 return`Lihat produk ${brand}`
}
const friendlyName=(p:DigitalProduct)=>{
 const name=(p.product_name||p.sku).trim()
 const b=(p.brand||'').trim()
 if(!b)return name
 const n=clean(name),bb=clean(b)
 if(n.startsWith(bb+' ')){
  const words=b.split(/\s+/).length
  const stripped=name.split(/\s+/).slice(words).join(' ').replace(/^[-–—:·]+\s*/,'').trim()
  return stripped||name
 }
 return name
}
const detailRows=(detail?:Record<string,unknown>|null)=>{
 if(!detail)return [] as Array<[string,string]>
 const labels:Record<string,string>={tarif:'Tarif',daya:'Daya',lembar_tagihan:'Lembar tagihan',alamat:'Alamat',jatuh_tempo:'Jatuh tempo',jumlah_peserta:'Jumlah peserta',item_name:'Item',tahun_pajak:'Tahun pajak',kelurahan:'Kelurahan',kecamatan:'Kecamatan',kab_kota:'Kab/Kota',nomor_polisi:'Nomor polisi',merek_kb:'Merek kendaraan',model_kb:'Model kendaraan',tahun_buatan:'Tahun kendaraan'}
 return Object.entries(detail).filter(([k,v])=>k!=='detail'&&!k.startsWith('_dlavie_')&&v!=null&&typeof v!=='object').slice(0,8).map(([k,v])=>[labels[k]||k.replaceAll('_',' '),String(v)] as [string,string])
}

function ViewSwitch({value,onChange}:{value:ViewMode;onChange:(value:ViewMode)=>void}){
 return <div className="dlv21-view" role="group" aria-label="Mode tampilan"><button className={value==='grid'?'is-active':''} onClick={()=>onChange('grid')} aria-label="Grid"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg></button><button className={value==='list'?'is-active':''} onClick={()=>onChange('list')} aria-label="List"><svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="18" r="1"/></svg></button></div>
}

export default function DLavieDigitalMarketV21(){
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
 const [sandboxBalance,setSandboxBalance]=useState<number|null>(null)
 const [view,setView]=useState<ViewMode>(()=>localStorage.getItem('dlavie-market-view')==='list'?'list':'grid')
 const nokos=digitalRoute().name==='market'&&digitalRoute().params.get('mode')==='nokos'
 const sandbox=integration?.environment==='sandbox'

 const groups=useMemo(()=>summary.filter(x=>x.product_kind===kind).sort((a,b)=>idx(categoryOrder,a.category)-idx(categoryOrder,b.category)||a.category.localeCompare(b.category,'id')),[summary,kind])
 const current=groups.find(x=>x.category===category)
 const sortedBrands=useMemo(()=>[...(current?.brands||[])].filter(Boolean).sort((a,b)=>idx(brandOrder,a)-idx(brandOrder,b)||a.localeCompare(b,'id')),[current])
 const filteredBrands=useMemo(()=>{const q=clean(query);const all=q?sortedBrands.filter(x=>clean(x).includes(q)):sortedBrands;return all.slice(0,q?120:64)},[sortedBrands,query])
 const brandHub=!!category&&!brand&&sortedBrands.length>1
 const extended=digitalExtendedKind(selected)
 const extraReady=extended==='emoney'?Number(extraAmount)>=1000:extended==='samsat'?extraIdentity.trim().length>=4:true
 const effectiveBalance=sandbox?(sandboxBalance??1000000):balance
 const prepaidCount=summary.filter(x=>x.product_kind==='prepaid').reduce((n,x)=>n+x.product_count,0)
 const postpaidCount=summary.filter(x=>x.product_kind==='postpaid').reduce((n,x)=>n+x.product_count,0)

 const resetExtras=()=>{setExtraIdentity('');setExtraAmount('');setExtraYear('')}
 const resetCheckout=()=>{setSelected(null);setReceipt(null);setTarget('');resetExtras()}
 const loadSummary=useCallback(async()=>{try{const d=await digitalCall('summary');setSummary((d.summary||[]).map((x:any)=>({...x,product_count:Number(x.product_count||0),min_price:Number(x.min_price||0),max_price:Number(x.max_price||0),brands:Array.isArray(x.brands)?x.brands:[]})));setIntegration(d.integration||null)}catch(e){setError(e instanceof Error?e.message:'Katalog belum dapat dimuat.')}},[])
 const loadProducts=useCallback(async(k:MarketKind,cat:string,br:string,q:string)=>{if(!cat)return;setLoading(true);setError('');try{const d=await digitalCall('products',{category:cat,brand:br,q,kind:k,limit:'100'});setProducts(d.products||[])}catch(e){setError(e instanceof Error?e.message:'Produk belum dapat dimuat.')}finally{setLoading(false)}},[])
 const loadHistory=useCallback(async()=>{const a=digitalAuth();if(!a.wallet_token||!a.user_id)return;try{const d=await digitalCall('history',a);setOrders(d.orders||[]);if(typeof d.balance==='number'){setBalance(d.balance);localStorage.setItem('dlavie-balance',String(d.balance))}if(typeof d.sandbox_balance==='number')setSandboxBalance(d.sandbox_balance);window.dispatchEvent(new CustomEvent(STATE_EVENT))}catch{}},[])

 useEffect(()=>{const sync=()=>{const yes=isDigitalMarket();setActive(yes);if(yes&&!digitalRoute().params.get('mode'))setKind(routeKind());document.documentElement.toggleAttribute('data-digital-market',yes)};sync();window.addEventListener('hashchange',sync);return()=>{window.removeEventListener('hashchange',sync);document.documentElement.removeAttribute('data-digital-market')}},[])
 useEffect(()=>{if(active){void loadSummary();void loadHistory()}},[active,loadSummary,loadHistory])
 useEffect(()=>{if(!active||!category||brandHub)return;const t=window.setTimeout(()=>void loadProducts(kind,category,brand,query),180);return()=>window.clearTimeout(t)},[active,category,brand,query,kind,brandHub,loadProducts])
 useEffect(()=>{if(!active||category||!groups.length)return;const requested=(digitalRoute().params.get('category')||'').trim().toLowerCase();if(!requested)return;const match=groups.find(x=>x.category.toLowerCase()===requested||x.category.toLowerCase().includes(requested)||requested.includes(x.category.toLowerCase()));if(match)setCategory(match.category)},[active,category,groups])
 useEffect(()=>{document.documentElement.toggleAttribute('data-market-sheet',!!selected||!!receipt);return()=>document.documentElement.removeAttribute('data-market-sheet')},[selected,receipt])

 const applyBalances=(d:any)=>{if(sandbox){if(typeof d?.sandbox_balance==='number')setSandboxBalance(d.sandbox_balance);else if(typeof d?.balance==='number')setSandboxBalance(d.balance)}else if(typeof d?.balance==='number'){setBalance(d.balance);localStorage.setItem('dlavie-balance',String(d.balance))}window.dispatchEvent(new CustomEvent(STATE_EVENT))}
 const setViewMode=(next:ViewMode)=>{setView(next);localStorage.setItem('dlavie-market-view',next)}
 const chooseKind=(value:MarketKind)=>{setKind(value);setCategory('');setBrand('');setQuery('');setProducts([]);resetCheckout();const next=value==='postpaid'?'#/market?kind=postpaid':'#/market';if(location.hash!==next)location.hash=next}
 const chooseCategory=(c:string)=>{setCategory(c);setBrand('');setQuery('');setProducts([]);resetCheckout()}
 const chooseBrand=(b:string)=>{setBrand(b);setQuery('');setProducts([]);resetCheckout()}
 const chooseProduct=(p:DigitalProduct)=>{setSelected(p);setReceipt(null);setTarget('');resetExtras()}
 const back=()=>{if(brand){setBrand('');setQuery('');setProducts([]);resetCheckout()}else{setCategory('');setQuery('');setProducts([]);resetCheckout()}}

 const purchase=async(e:FormEvent)=>{e.preventDefault();if(!selected||busy||target.trim().length<3||!extraReady)return;setBusy(true);setError('');try{const auth=digitalAuth();let d:any;if(kind==='postpaid'&&extended){const customer=extended==='samsat'?`${target.trim()},${extraIdentity.trim()}`:target.trim();const extra:Record<string,string>={...auth,sku:selected.sku,customer_no:customer};if(extended==='emoney')extra.amount=String(Math.round(Number(extraAmount)));if(extended==='pbb'&&extraYear.trim())extra.year=extraYear.trim();d=await digitalExtendedCall(extra)}else{d=await digitalCall(kind==='postpaid'?'inquiry_postpaid':'purchase',{...auth,sku:selected.sku,customer_no:target.trim()})}setReceipt(d.order);setSelected(null);applyBalances(d);await loadHistory()}catch(e){setError(e instanceof Error?e.message:'Transaksi belum dapat diproses.')}finally{setBusy(false)}}
 const payPostpaid=async(ref:string)=>{if(busy)return;setBusy(true);setError('');try{const d=await digitalCall('pay_postpaid',{...digitalAuth(),ref_id:ref});setReceipt(d.order);applyBalances(d);setHistoryOpen(false);await loadHistory()}catch(e){setError(e instanceof Error?e.message:'Pembayaran tagihan belum dapat diproses.')}finally{setBusy(false)}}
 const checkStatus=async(ref:string)=>{if(busy)return;setBusy(true);setError('');try{const d=await digitalCall('status',{...digitalAuth(),ref_id:ref});setReceipt(d.order);applyBalances(d);await loadHistory()}catch(e){setError(e instanceof Error?e.message:'Status belum dapat diperbarui.')}finally{setBusy(false)}}

 if(nokos)return <button className="dlv-digital-return" onClick={()=>{location.hash='#/market'}}>← Digital Market</button>
 if(!active)return null
 const billRows=detailRows(receipt?.inquiry_detail)
 const displayBalance=sandbox?(sandboxBalance??1000000):balance

 return <main className="dlv-digital-market dlv21-market"><div className="dlv21-shell">
  <header className="dlv21-hero"><div><span>DIGITAL MARKET</span><h1>Kebutuhan digital,<br/>lebih gampang dicari.</h1><p>Pilih kategori, pilih brand atau game, lalu pilih produk. Tidak ada lagi ribuan SKU bercampur dalam satu layar.</p></div><aside><small>{sandbox?'SALDO TES':'SALDO WALLET'}</small><strong>{money.format(displayBalance)}</strong>{sandbox?<em>Wallet asli tetap {money.format(balance)}</em>:<button onClick={()=>document.querySelector<HTMLButtonElement>('.balance-pill')?.click()}>Tambah saldo</button>}</aside></header>
  <div className="dlv21-status"><div><i className={sandbox||integration?.enabled?'is-on':''}/><b>{sandbox?'Sandbox DLavie':integration?.enabled?'H2H.id Production':'Katalog H2H.id'}</b><span>{integration?.catalog_count||0} SKU tersinkron</span></div><button onClick={()=>setHistoryOpen(true)}>Pesanan {orders.length?`· ${orders.length}`:''}</button></div>
  {sandbox&&<div className="dlv21-sandbox-inline"><b>SANDBOX</b><span>Transaksi tidak memanggil H2H dan tidak memotong HCoin / Wallet asli.</span></div>}
  {error&&<div className="dlv21-alert">{error}<button onClick={()=>setError('')}>×</button></div>}

  {!category?<section className="dlv21-section"><div className="dlv21-head"><div><span>LAYANAN</span><h2>Pilih kebutuhan</h2></div><ViewSwitch value={view} onChange={setViewMode}/></div><div className="dlv21-kind"><button className={kind==='prepaid'?'is-active':''} onClick={()=>chooseKind('prepaid')}><DigitalCategoryIcon value="Pulsa dan Data"/><span><b>Produk Instan</b><small>{prepaidCount} produk aktif</small></span></button><button className={kind==='postpaid'?'is-active':''} disabled={!integration?.postpaid_enabled} onClick={()=>chooseKind('postpaid')}><DigitalCategoryIcon value="Bayar Tagihan"/><span><b>Bayar Tagihan</b><small>{integration?.postpaid_enabled?`${postpaidCount} layanan`:'Belum diaktifkan'}</small></span></button></div><div className={`dlv21-category-grid is-${view}`}><button className="is-nokos" onClick={()=>{location.hash='#/market?mode=nokos'}}><DigitalCategoryIcon value="Nomor Virtual"/><span><b>Nomor Virtual</b><small>Layanan nomor & verifikasi</small></span><strong>→</strong></button>{groups.map(x=><button key={`${kind}-${x.category}`} onClick={()=>chooseCategory(x.category)}><DigitalCategoryIcon value={x.category}/><span><b>{x.category}</b><small>{categoryCopy(x.category)}</small><em>{x.product_count.toLocaleString('id-ID')} produk</em></span><strong>→</strong></button>)}</div></section>:
  <section className="dlv21-section dlv21-catalog"><div className="dlv21-breadcrumb"><button onClick={back}>←</button><span>Digital Market</span><b>/</b><span>{category}</span>{brand&&<><b>/</b><strong>{brand}</strong></>}</div>
   {brandHub?<><div className="dlv21-head"><div><span>{category==='Voucher & Game'?'PILIH GAME':'PILIH BRAND'}</span><h2>{category}</h2><p>{category==='Voucher & Game'?'Game dipisahkan per judul supaya diamonds, UC, points dan item tidak bercampur.':'Pilih provider terlebih dahulu agar daftar produk lebih ringkas.'}</p></div></div><div className="dlv21-search"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={category==='Voucher & Game'?'Cari Free Fire, Mobile Legends, Roblox…':'Cari brand / provider…'}/><span>{sortedBrands.length} pilihan</span></div><div className="dlv21-brand-grid">{filteredBrands.map(x=><button key={x} onClick={()=>chooseBrand(x)}><DigitalBrandIcon brand={x} category={category}/><span><b>{x}</b><small>{brandCopy(category,x)}</small></span><strong>→</strong></button>)}</div>{filteredBrands.length===0&&<div className="dlv21-empty">Brand atau game tidak ditemukan.</div>}{!query&&sortedBrands.length>64&&<div className="dlv21-hint">Menampilkan pilihan utama. Gunakan pencarian untuk menemukan game atau brand lainnya.</div>}</>:
   <><div className="dlv21-head"><div><span>{brand||category}</span><h2>{brand||category}</h2><p>{current?.product_count||0} produk di kategori ini. Pilih produk untuk membuka checkout.</p></div><ViewSwitch value={view} onChange={setViewMode}/></div><div className="dlv21-product-tools"><button onClick={()=>{setBrand('');setQuery('');setProducts([])}} disabled={sortedBrands.length<=1}>⌁ {brand||'Semua brand'}</button><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari nominal atau paket…"/></div><div className={`dlv21-product-grid is-${view}`}>{loading?<div className="dlv21-loading">Memuat produk…</div>:products.map(p=><button key={p.sku} className={selected?.sku===p.sku?'is-selected':''} onClick={()=>chooseProduct(p)}><DigitalBrandIcon brand={p.brand} category={p.category}/><span><small>{p.brand}</small><b>{friendlyName(p)}</b><em>{p.product_type?.replaceAll('_',' ')||p.category}</em></span><strong>{kind==='postpaid'?'Cek tagihan':money.format(p.sell_price)}</strong></button>)}</div>{!loading&&!products.length&&<div className="dlv21-empty">Tidak ada produk untuk filter ini.</div>}</>}
  </section>}
 </div>

 {(selected||receipt)&&<div className="dlv21-sheet-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)resetCheckout()}}><aside className="dlv21-sheet" role="dialog" aria-modal="true"><button className="dlv21-sheet-close" disabled={busy} onClick={resetCheckout}>×</button>{selected?<form onSubmit={purchase}><div className="dlv21-sheet-kicker">{sandbox?'SANDBOX CHECKOUT':kind==='postpaid'?'CEK TAGIHAN':'CHECKOUT'}</div><div className="dlv21-sheet-brand"><DigitalBrandIcon brand={selected.brand} category={selected.category}/><div><small>{selected.brand}</small><h3>{friendlyName(selected)}</h3><code>{selected.sku}</code></div></div><label><span>{extended==='samsat'?'Kode pembayaran':extended==='pbb'?'NOP / nomor pembayaran':extended==='emoney'?'Nomor E-Money / HP':digitalTargetLabel(selected.category,selected.brand)}</span><input autoFocus value={target} onChange={e=>setTarget(e.target.value)} placeholder={selected.category==='Voucher & Game'?'Masukkan User ID / Player ID':'Masukkan tujuan dengan teliti'} autoComplete="off" required/></label>{extended==='samsat'&&<label><span>Nomor identitas</span><input value={extraIdentity} onChange={e=>setExtraIdentity(e.target.value.replace(/[^0-9A-Za-z]/g,''))} required/></label>}{extended==='emoney'&&<label><span>Nominal E-Money</span><input inputMode="numeric" value={extraAmount} onChange={e=>setExtraAmount(e.target.value.replace(/\D/g,''))} placeholder="25000" required/><small>{extraAmount?money.format(Number(extraAmount)):'Minimal Rp1.000'}</small></label>}{extended==='pbb'&&<label><span>Tahun pajak <i>opsional</i></span><input inputMode="numeric" maxLength={4} value={extraYear} onChange={e=>setExtraYear(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="2026"/></label>}{selected.description&&selected.description!==selected.product_name&&<p className="dlv21-desc">{selected.description}</p>}{kind==='prepaid'&&<div className="dlv21-total"><span>Total</span><strong>{money.format(selected.sell_price)}</strong></div>}<button className="dlv21-primary" disabled={busy||target.trim().length<3||!extraReady}>{busy?'Memproses…':kind==='postpaid'?'Cek tagihan':sandbox?'Tes di Sandbox':'Bayar dengan Wallet'}<b>→</b></button><em className="dlv21-safe">{sandbox?'Tidak memotong HCoin atau Wallet asli.':'Harga dan saldo diverifikasi ulang di server.'}</em></form>:receipt?<div className="dlv21-receipt"><div className="dlv21-sheet-kicker">{sandbox?'HASIL SANDBOX':'DIGITAL ORDER'}</div><h3>{digitalStatus(receipt.status)}</h3><code>{receipt.ref_id}</code><div className="dlv21-receipt-product"><DigitalBrandIcon brand={receipt.brand} category={receipt.category}/><span><small>{receipt.brand}</small><b>{receipt.product_name}</b></span></div>{receipt.customer_name&&<p><span>Pelanggan</span><b>{receipt.customer_name}</b></p>}{receipt.period&&<p><span>Periode</span><b>{receipt.period}</b></p>}{billRows.map(([k,v])=><p key={k}><span>{k}</span><b>{v}</b></p>)}<div className="dlv21-total"><span>Total</span><strong>{money.format(receipt.sell_price)}</strong></div>{receipt.message&&<div className="dlv21-receipt-message">{receipt.message}</div>}{receipt.serial_number&&<div className="dlv21-sn"><small>SN / TOKEN</small><b>{receipt.serial_number}</b></div>}{receipt.status==='inquired'&&<button className="dlv21-primary" disabled={busy||effectiveBalance<receipt.sell_price} onClick={()=>void payPostpaid(receipt.ref_id)}>{busy?'Memproses…':effectiveBalance<receipt.sell_price?'Saldo tidak cukup':sandbox?'Bayar di Sandbox':'Bayar dengan Wallet'}</button>}{(receipt.status==='pending'||receipt.status==='reserved')&&<button className="dlv21-primary" disabled={busy} onClick={()=>void checkStatus(receipt.ref_id)}>Cek status</button>}</div>:null}</aside></div>}
 <DigitalOrderHistory open={historyOpen} orders={orders} busy={busy} onClose={()=>setHistoryOpen(false)} onCheck={ref=>void checkStatus(ref)} onPay={ref=>void payPostpaid(ref)}/>
 </main>
}
