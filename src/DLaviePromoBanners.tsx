import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './contributor-banner-v30.css'

type BannerContext='home'|'game'|'data'|'pulsa'|'wallet'|'emoney'|'pln'|'streaming'
type CreditMark={name:string;domain:string;role:string;initials:string}
type BannerSlide={id:string;label:string;title:string;body:string;cta?:string;route?:string;symbol?:string;chips:string[];credits?:CreditMark[];tone:'market'|'promo'|'trust'|'game'|'data'|'credits'}

const contributorCredits:CreditMark[]=[
 {name:'DANA',domain:'dana.id',role:'E-Wallet',initials:'D'},
 {name:'Midtrans',domain:'midtrans.com',role:'Payment Gateway',initials:'M'},
 {name:'Digiflazz',domain:'digiflazz.com',role:'Digital Services',initials:'DF'},
 {name:'H2H.id',domain:'h2h.id',role:'Digital Services',initials:'H2H'},
 {name:'OVO',domain:'ovo.id',role:'E-Wallet',initials:'O'},
 {name:'GoPay',domain:'gopay.co.id',role:'E-Wallet',initials:'G'},
 {name:'ShopeePay',domain:'shopeepay.co.id',role:'E-Wallet',initials:'SP'},
 {name:'LinkAja',domain:'linkaja.id',role:'E-Wallet',initials:'LA'},
]

const homeSlides:BannerSlide[]=[
 {id:'home-market',label:'DLAVIE DIGITAL MARKET',title:'Kebutuhan digital, dalam satu alur.',body:'Pulsa, paket data, PLN, e-wallet, voucher game, dan layanan digital lain dari satu wallet.',cta:'Buka market',route:'#/market',symbol:'D',chips:['Pulsa','Paket Data','PLN','Voucher'],tone:'market'},
 {id:'home-promo',label:'TEMUKAN LEBIH CEPAT',title:'Pilih produk tanpa menghafal kode supplier.',body:'Cari berdasarkan kategori, operator, game, brand, atau kebutuhan. Harga dan detail tetap ditampilkan sebelum checkout.',cta:'Jelajahi produk',route:'#/market',symbol:'⌕',chips:['Cari brand','Filter kategori','Harga jelas'],tone:'promo'},
 {id:'home-trust',label:'TRANSAKSI DLAVIE',title:'Periksa dulu. Bayar setelah yakin.',body:'Tujuan, produk, nominal, dan persetujuan ditampilkan kembali sebelum transaksi dikirim.',cta:'Lihat cara kerja',route:'#/market',symbol:'✓',chips:['Periksa data','Konfirmasi','Struk privat'],tone:'trust'},
 {id:'home-credits',label:'CONTRIBUTOR CREDITS',title:'Ekosistem layanan di balik pengalaman DLavie.',body:'Sejumlah layanan pembayaran dan produk digital yang hadir dalam ekosistem DLavie, ditampilkan tanpa membuka detail teknis internal.',chips:['Pembayaran','E-Wallet','Produk Digital','Layanan'],credits:contributorCredits,tone:'credits'},
]
const gameSlides:BannerSlide[]=[
 {id:'game-free-fire',label:'FREE FIRE',title:'Top up diamond tanpa mencari SKU.',body:'Pilih Free Fire, tentukan nominal, lalu periksa Player ID sebelum bayar.',cta:'Lihat Free Fire',route:'#/market?category=Voucher%20%26%20Game',symbol:'FF',chips:['Diamond','Membership','Player ID'],tone:'game'},
 {id:'game-hub',label:'VOUCHER & GAME',title:'Game populer dipisahkan per judul.',body:'Mobile Legends, PUBG Mobile, Valorant, Roblox, Free Fire, dan lainnya tampil sebagai koleksi tersendiri.',cta:'Lihat semua game',route:'#/market?category=Voucher%20%26%20Game',symbol:'✦',chips:['MLBB','PUBG','Valorant','Roblox'],tone:'game'},
]
const dataSlides:BannerSlide[]=[
 {id:'data-auto',label:'PAKET DATA',title:'Masukkan nomor, operator bisa terdeteksi otomatis.',body:'Tetap tersedia pilihan manual kalau kamu ingin mencari operator dan paket sendiri.',cta:'Cari paket data',route:'#/market?category=Paket%20Data',symbol:'5G',chips:['Auto detect','Pilih manual','Format +62'],tone:'data'},
 {id:'data-choice',label:'KUOTA SESUAI KEBUTUHAN',title:'Bandingkan paket sebelum memilih.',body:'Cari nominal, masa aktif, dan jenis paket dari operator yang sama dalam satu tampilan.',cta:'Lihat paket',route:'#/market?category=Paket%20Data',symbol:'↗',chips:['Masa aktif','Nominal','Jenis kuota'],tone:'data'},
]
const pulsaSlides:BannerSlide[]=[
 {id:'pulsa-number',label:'PULSA',title:'Nomor dulu, nominal kemudian.',body:'DLavie membantu mengenali operator dari nomor yang kamu masukkan. Pilihan manual tetap tersedia kapan pun.',cta:'Isi pulsa',route:'#/market?category=Pulsa',symbol:'Rp',chips:['Deteksi operator','Semua nominal','Konfirmasi nomor'],tone:'data'},
]
const walletSlides:BannerSlide[]=[
 {id:'wallet-main',label:'E-WALLET',title:'Top up saldo dengan tujuan yang lebih jelas.',body:'Pilih dompet digital, masukkan nomor yang benar, lalu cek kembali nominal sebelum transaksi.',cta:'Pilih e-wallet',route:'#/market?category=E-Wallet',symbol:'W',chips:['DANA','OVO','GoPay','ShopeePay'],tone:'market'},
]
const emoneySlides:BannerSlide[]=[
 {id:'emoney-card',label:'KARTU E-MONEY',title:'Nomor kartu diperlakukan berbeda dari nomor HP.',body:'Flazz, BRIZZI, TapCash, dan e-Money Mandiri memakai flow input kartu yang terpisah supaya tidak salah format.',cta:'Lihat kartu e-money',route:'#/market?category=Kartu%20E-Money',symbol:'◫',chips:['Flazz','BRIZZI','TapCash','e-Money'],tone:'trust'},
]
const plnSlides:BannerSlide[]=[
 {id:'pln-token',label:'PLN',title:'Token listrik dengan pemeriksaan tujuan sebelum bayar.',body:'Pilih produk PLN, masukkan nomor meter atau ID pelanggan sesuai layanan, lalu cek kembali sebelum konfirmasi.',cta:'Lihat produk PLN',route:'#/market?category=PLN',symbol:'⚡',chips:['Token','ID pelanggan','Nomor meter'],tone:'data'},
]
const streamingSlides:BannerSlide[]=[
 {id:'streaming-main',label:'STREAMING & HIBURAN',title:'Voucher hiburan dipisahkan per layanan.',body:'Cari layanan yang kamu pakai, lalu pilih paket atau voucher yang tersedia tanpa bercampur dengan game.',cta:'Lihat hiburan',route:'#/market?category=Streaming%20%26%20Hiburan',symbol:'▶',chips:['Vidio','Spotify','WeTV','Genflix'],tone:'promo'},
]
const slidesByContext:Record<BannerContext,BannerSlide[]>={home:homeSlides,game:gameSlides,data:dataSlides,pulsa:pulsaSlides,wallet:walletSlides,emoney:emoneySlides,pln:plnSlides,streaming:streamingSlides}
const openRoute=(route:string)=>{window.location.hash=route.replace(/^#/,'')}
const officialIcon=(domain:string)=>`https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(`https://${domain}`)}`

function CreditLogo({credit}:{credit:CreditMark}){
 const [failed,setFailed]=useState(false)
 return <span className="dlv30-credit" role="listitem" title={`${credit.name} · ${credit.role}`}>
  <span className="dlv30-credit-mark">{failed?<b>{credit.initials}</b>:<img src={officialIcon(credit.domain)} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>}</span>
  <span><strong>{credit.name}</strong><small>{credit.role}</small></span>
 </span>
}

function BannerVisual({slide}:{slide:BannerSlide}){
 if(slide.credits)return <span className="dlv30-credits-art" role="list" aria-label="Layanan dalam ekosistem DLavie">{slide.credits.map(credit=><CreditLogo credit={credit} key={credit.name}/>)}</span>
 return <span className="dlv25-banner-art" aria-hidden="true"><i>{slide.symbol}</i><b/><b/><b/></span>
}

function SlideSurface({slide,moved}:{slide:BannerSlide;moved:React.MutableRefObject<boolean>}){
 const children:ReactNode=<><span className="dlv25-banner-copy"><small>{slide.label}</small><strong>{slide.title}</strong><em>{slide.body}</em><span className="dlv28-banner-chips">{slide.chips.map(chip=><i key={chip}>{chip}</i>)}</span>{slide.cta&&<b>{slide.cta}<i>→</i></b>}</span><BannerVisual slide={slide}/></>
 if(slide.route)return <button type="button" className="dlv25-banner-card" onClick={()=>{if(!moved.current)openRoute(slide.route!);moved.current=false}}>{children}</button>
 return <div className="dlv25-banner-card dlv30-static-banner">{children}</div>
}

function BannerSlider({slides,context}:{slides:BannerSlide[];context:BannerContext}){
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false)
 const pointer=useRef<{x:number;y:number}|null>(null),moved=useRef(false)
 const reduced=useMemo(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches,[])
 const count=slides.length
 useEffect(()=>setIndex(0),[context])
 useEffect(()=>{if(paused||reduced||count<2)return;const id=window.setInterval(()=>setIndex(i=>(i+1)%count),6500);return()=>window.clearInterval(id)},[paused,reduced,count])
 const go=(i:number)=>setIndex((i+count)%count)
 return <section className={`dlv-promo-carousel dlv25-banner dlv28-banner is-${context}`} aria-label="Sorotan DLavie" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
  {count>1&&<span className="dlv28-banner-count" aria-hidden="true">{String(index+1).padStart(2,'0')} / {String(count).padStart(2,'0')}</span>}
  <div className="dlv-promo-viewport" onPointerDown={e=>{pointer.current={x:e.clientX,y:e.clientY};moved.current=false}} onPointerMove={e=>{if(pointer.current&&Math.abs(e.clientX-pointer.current.x)>8)moved.current=true}} onPointerUp={e=>{const p=pointer.current;pointer.current=null;if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)){go(index+(dx<0?1:-1));moved.current=true}}} onPointerCancel={()=>{pointer.current=null}}>
   <div className="dlv-promo-track" style={{transform:`translate3d(-${index*100}%,0,0)`}}>{slides.map(slide=><article className={`dlv-promo-slide tone-${slide.tone}`} key={slide.id}><SlideSurface slide={slide} moved={moved}/></article>)}</div>
  </div>
  {count>1&&<><button className="dlv-promo-arrow is-prev" type="button" aria-label="Banner sebelumnya" onClick={()=>go(index-1)}>‹</button><button className="dlv-promo-arrow is-next" type="button" aria-label="Banner berikutnya" onClick={()=>go(index+1)}>›</button><div className="dlv-promo-dots">{slides.map((s,i)=><button type="button" className={i===index?'is-active':''} onClick={()=>go(i)} key={s.id} aria-label={`Banner ${i+1}`}><i/></button>)}</div></>}
 </section>
}

export default function DLaviePromoBanners(){
 const [homeHost,setHomeHost]=useState<HTMLElement|null>(null),[marketHost,setMarketHost]=useState<HTMLElement|null>(null),[marketContext,setMarketContext]=useState<BannerContext|null>(null)
 const owned=useRef<HTMLElement[]>([])
 useEffect(()=>{
  let queued=false
  const ensure=(cls:string,parent:HTMLElement,before:Element|null)=>{let node=parent.querySelector<HTMLElement>(`:scope > .${cls}`);if(!node){node=document.createElement('div');node.className=cls;parent.insertBefore(node,before);owned.current.push(node)}return node}
  const hide=(s:string)=>document.querySelectorAll<HTMLElement>(s).forEach(n=>n.hidden=true)
  const syncNavClearance=()=>{
   const nav=document.querySelector<HTMLElement>('.site-nav-wrap')
   const h=nav?Math.max(68,Math.ceil(nav.getBoundingClientRect().height)):76
   document.documentElement.style.setProperty('--dlv-nav-clearance',`${h}px`)
  }
  const detectContext=(signal:string):BannerContext|null=>{
   if(signal.includes('voucher')&&signal.includes('game'))return'game'
   if(signal.includes('paket data')||signal.includes('category=data'))return'data'
   if(signal.includes('pulsa'))return'pulsa'
   if(signal.includes('kartu e-money')||signal.includes('kartu e money'))return'emoney'
   if(signal.includes('e-wallet')||signal.includes('e wallet'))return'wallet'
   if(signal.includes('pln'))return'pln'
   if(signal.includes('streaming')||signal.includes('hiburan'))return'streaming'
   return null
  }
  const scan=()=>{
   queued=false
   syncNavClearance()
   const raw=location.hash.replace(/^#\/?/,'')
   const inMarket=raw.toLowerCase().startsWith('market')
   if(!inMarket){
    const app=document.querySelector<HTMLElement>('.app')
    const main=document.querySelector<HTMLElement>('main#top,main')
    if(app&&main){
     const node=ensure('dlv-promo-home-host',app,main)
     node.hidden=false
     setHomeHost(node)
    }
    hide('.dlv-promo-market-host')
    setMarketHost(null)
    setMarketContext(null)
    return
   }
   hide('.dlv-promo-home-host')
   setHomeHost(null)
   const crumb=Array.from(document.querySelectorAll<HTMLElement>('.dlv21-breadcrumb')).find(x=>x.offsetParent!==null)
   const params=new URLSearchParams(raw.split('?')[1]||'')
   const signal=`${crumb?.textContent||''} ${decodeURIComponent(params.get('category')||'')}`.toLowerCase()
   const ctx=detectContext(signal)
   const shell=document.querySelector<HTMLElement>('.dlv21-market .dlv21-shell')
   const section=crumb?.closest<HTMLElement>('.dlv21-section')||shell?.querySelector<HTMLElement>('.dlv21-section')
   if(shell&&section&&ctx){const node=ensure('dlv-promo-market-host',shell,section);node.hidden=false;setMarketHost(node);setMarketContext(ctx)}else{hide('.dlv-promo-market-host');setMarketHost(null);setMarketContext(null)}
  }
  const queue=()=>{if(!queued){queued=true;requestAnimationFrame(scan)}}
  const ob=new MutationObserver(queue)
  ob.observe(document.body,{childList:true,subtree:true,characterData:true})
  addEventListener('hashchange',queue)
  addEventListener('resize',queue,{passive:true})
  queue()
  return()=>{
   ob.disconnect()
   removeEventListener('hashchange',queue)
   removeEventListener('resize',queue)
   document.documentElement.style.removeProperty('--dlv-nav-clearance')
   owned.current.forEach(n=>n.remove())
  }
 },[])
 const activeSlides=marketContext?slidesByContext[marketContext]:null
 return <>{homeHost&&createPortal(<BannerSlider slides={homeSlides} context="home"/>,homeHost)}{marketHost&&marketContext&&activeSlides&&createPortal(<BannerSlider slides={activeSlides} context={marketContext}/>,marketHost)}</>
}
