import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import DigitalBrandIcon,{DigitalCategoryIcon} from './DigitalBrandIcon'

type HomeView='grid'|'list'
type Filter='all'|'instant'|'bill'
type HomeCategory={id:string;name:string;description:string;kind:'instant'|'bill'|'legacy';brands:string[];route:string;badge:string}

const categories:HomeCategory[]=[
 {id:'pulsa',name:'Pulsa',description:'Isi ulang semua operator Indonesia.',kind:'instant',brands:['Telkomsel','IM3','XL','Tri'],route:'#/market?category=Pulsa',badge:'Instan'},
 {id:'data',name:'Paket Data',description:'Kuota internet dan paket operator.',kind:'instant',brands:['Telkomsel','IM3','XL','Smartfren'],route:'#/market?category=Data',badge:'Instan'},
 {id:'pln',name:'PLN',description:'Token listrik dan layanan PLN.',kind:'instant',brands:['PLN'],route:'#/market?category=PLN',badge:'Token'},
 {id:'wallet',name:'E-Wallet',description:'Top up saldo dompet digital.',kind:'instant',brands:['DANA','OVO','GoPay','ShopeePay'],route:'#/market?category=E-Wallet',badge:'Top up'},
 {id:'game',name:'Voucher & Game',description:'Voucher game, hiburan, dan digital.',kind:'instant',brands:['Mobile Legends','Free Fire','Steam'],route:'#/market?category=Game',badge:'Voucher'},
 {id:'bill',name:'Bayar Tagihan',description:'Cek tagihan lalu bayar setelah detail sesuai.',kind:'bill',brands:['PLN','BPJS'],route:'#/market?kind=postpaid',badge:'Pascabayar'},
 {id:'nokos',name:'Nomor Virtual',description:'Nomor sementara dan verifikasi SMS DLavie.',kind:'legacy',brands:['WhatsApp','Telegram'],route:'#/market?mode=nokos',badge:'Layanan tambahan'},
]

function ViewIcon({type}:{type:HomeView}){
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">{type==='grid'?<><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>:<><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></>}</svg>
}

function CategoryCard({item,view}:{item:HomeCategory;view:HomeView}){
 const open=()=>{window.location.hash=item.route.replace(/^#/,'')}
 return <button className={`dlv-home-category is-${view}`} type="button" onClick={open}>
  <span className="dlv-home-category-icon"><DigitalCategoryIcon value={item.name}/></span>
  <span className="dlv-home-category-copy"><small>{item.badge}</small><strong>{item.name}</strong><em>{item.description}</em><span className="dlv-home-brand-stack">{item.brands.slice(0,4).map(brand=><DigitalBrandIcon key={brand} brand={brand} category={item.name}/>)}</span></span>
  <span className="dlv-home-category-arrow">→</span>
 </button>
}

function WindowPreview(){
 return <div className="dlv-window-digital-preview">{categories.slice(0,4).map(item=><div className="dlv-window-digital-row" key={item.id}><DigitalCategoryIcon value={item.name}/><span><strong>{item.name}</strong><small>{item.badge} · produk digital</small></span><b>Siap</b><i/></div>)}</div>
}

export default function DigitalHomeMarket(){
 const [catalogHost,setCatalogHost]=useState<HTMLElement|null>(null)
 const [windowHost,setWindowHost]=useState<HTMLElement|null>(null)
 const [view,setView]=useState<HomeView>(()=>localStorage.getItem('dlavie-home-market-view')==='list'?'list':'grid')
 const [filter,setFilter]=useState<Filter>('all')
 const [query,setQuery]=useState('')

 useEffect(()=>{
  const catalog=document.querySelector<HTMLElement>('.catalog-section')
  const preview=document.querySelector<HTMLElement>('.window-list')
  let catHost:HTMLDivElement|null=null,winHost:HTMLDivElement|null=null
  if(catalog){catalog.classList.add('dlv-home-digitalized');catHost=document.createElement('div');catHost.className='dlv-home-digital-host';catalog.appendChild(catHost);setCatalogHost(catHost)}
  if(preview){preview.classList.add('dlv-window-digitalized');winHost=document.createElement('div');winHost.className='dlv-window-digital-host';preview.appendChild(winHost);setWindowHost(winHost)}
  return()=>{catHost?.remove();winHost?.remove();catalog?.classList.remove('dlv-home-digitalized');preview?.classList.remove('dlv-window-digitalized')}
 },[])

 const visible=useMemo(()=>categories.filter(item=>{
  const matchesFilter=filter==='all'||(filter==='instant'&&item.kind==='instant')||(filter==='bill'&&item.kind==='bill')
  const q=query.trim().toLowerCase()
  return matchesFilter&&(!q||`${item.name} ${item.description} ${item.brands.join(' ')}`.toLowerCase().includes(q))
 }),[filter,query])
 const setMode=(next:HomeView)=>{setView(next);localStorage.setItem('dlavie-home-market-view',next)}

 const market=catalogHost?createPortal(<div className="dlv-home-market">
  <div className="dlv-home-market-head">
   <div><span>KATEGORI DIGITAL</span><h2>Semua kebutuhan, satu market.</h2><p>Pulsa, paket data, PLN, e-wallet, voucher, tagihan, dan Nomor Virtual memakai wallet yang sama.</p></div>
   <div className="dlv-home-view-switch" role="group" aria-label="Mode tampilan"><button type="button" className={view==='grid'?'is-active':''} onClick={()=>setMode('grid')} aria-label="Tampilan grid"><ViewIcon type="grid"/></button><button type="button" className={view==='list'?'is-active':''} onClick={()=>setMode('list')} aria-label="Tampilan list"><ViewIcon type="list"/></button></div>
  </div>
  <div className="dlv-home-market-tools"><label><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari pulsa, data, PLN, e-wallet…"/></label><div><button className={filter==='all'?'is-active':''} onClick={()=>setFilter('all')}>Semua</button><button className={filter==='instant'?'is-active':''} onClick={()=>setFilter('instant')}>Produk instan</button><button className={filter==='bill'?'is-active':''} onClick={()=>setFilter('bill')}>Tagihan</button></div></div>
  <div className={`dlv-home-category-layout is-${view}`}>{visible.map(item=><CategoryCard item={item} view={view} key={item.id}/>)}</div>
  {!visible.length&&<div className="dlv-home-market-empty">Kategori tidak ditemukan.</div>}
  <button className="dlv-home-market-open" type="button" onClick={()=>{window.location.hash='/market'}}>Buka Digital Market <span>→</span></button>
 </div>,catalogHost):null
 const preview=windowHost?createPortal(<WindowPreview/>,windowHost):null
 return <>{market}{preview}</>
}
