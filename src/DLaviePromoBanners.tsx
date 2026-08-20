import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type BannerContext='home'|'game'|'data'
type BannerSlide={id:string;label:string;title:string;body:string;cta:string;route:string;symbol:string;tone:'market'|'promo'|'trust'|'game'|'data'}

const homeSlides:BannerSlide[]=[
 {id:'home-market',label:'DLAVIE DIGITAL MARKET',title:'Kebutuhan digital, dalam satu alur.',body:'Pulsa, paket data, PLN, e-wallet, voucher game, dan layanan digital lain dari satu wallet.',cta:'Buka market',route:'#/market',symbol:'D',tone:'market'},
 {id:'home-promo',label:'PILIHAN MINGGU INI',title:'Lebih mudah menemukan produk yang tepat.',body:'Cari berdasarkan kategori, operator, game, atau brand tanpa harus menghafal kode produk.',cta:'Jelajahi produk',route:'#/market',symbol:'%',tone:'promo'},
 {id:'home-trust',label:'TRANSAKSI DLAVIE',title:'Periksa dulu. Bayar setelah yakin.',body:'Tujuan, produk, nominal, dan persetujuan ditampilkan kembali sebelum transaksi dikirim.',cta:'Lihat cara kerja',route:'#/market',symbol:'✓',tone:'trust'},
]
const gameSlides:BannerSlide[]=[
 {id:'game-free-fire',label:'FREE FIRE',title:'Top up diamond tanpa mencari SKU.',body:'Pilih Free Fire, tentukan nominal, lalu periksa Player ID sebelum bayar.',cta:'Lihat Free Fire',route:'#/market?category=Voucher%20%26%20Game',symbol:'FF',tone:'game'},
 {id:'game-hub',label:'VOUCHER & GAME',title:'Game populer dipisahkan per judul.',body:'Mobile Legends, PUBG Mobile, Valorant, Roblox, Free Fire, dan lainnya tampil sebagai koleksi tersendiri.',cta:'Lihat semua game',route:'#/market?category=Voucher%20%26%20Game',symbol:'✦',tone:'game'},
]
const dataSlides:BannerSlide[]=[
 {id:'data-auto',label:'PAKET DATA',title:'Masukkan nomor, operator bisa terdeteksi otomatis.',body:'Tetap tersedia pilihan manual jika kamu ingin mencari operator dan paket sendiri.',cta:'Cari paket data',route:'#/market?category=Paket%20Data',symbol:'5G',tone:'data'},
 {id:'data-choice',label:'KUOTA SESUAI KEBUTUHAN',title:'Bandingkan paket sebelum memilih.',body:'Cari nominal, masa aktif, dan jenis paket dari operator yang sama dalam satu tampilan.',cta:'Lihat paket',route:'#/market?category=Paket%20Data',symbol:'↗',tone:'data'},
]
const openRoute=(route:string)=>{window.location.hash=route.replace(/^#/,'')}

function BannerSlider({slides,context}:{slides:BannerSlide[];context:BannerContext}){
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false)
 const pointer=useRef<{x:number;y:number}|null>(null),moved=useRef(false)
 const reduced=useMemo(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches,[])
 const count=slides.length
 useEffect(()=>setIndex(0),[context])
 useEffect(()=>{if(paused||reduced||count<2)return;const id=window.setInterval(()=>setIndex(i=>(i+1)%count),6500);return()=>window.clearInterval(id)},[paused,reduced,count])
 const go=(i:number)=>setIndex((i+count)%count)
 return <section className={`dlv-promo-carousel dlv25-banner is-${context}`} aria-label="Sorotan DLavie" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
  <div className="dlv-promo-viewport" onPointerDown={e=>{pointer.current={x:e.clientX,y:e.clientY};moved.current=false}} onPointerMove={e=>{if(pointer.current&&Math.abs(e.clientX-pointer.current.x)>8)moved.current=true}} onPointerUp={e=>{const p=pointer.current;pointer.current=null;if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)){go(index+(dx<0?1:-1));moved.current=true}}}>
   <div className="dlv-promo-track" style={{transform:`translate3d(-${index*100}%,0,0)`}}>{slides.map(slide=><article className={`dlv-promo-slide tone-${slide.tone}`} key={slide.id}><button type="button" className="dlv25-banner-card" onClick={()=>{if(!moved.current)openRoute(slide.route);moved.current=false}}><span className="dlv25-banner-copy"><small>{slide.label}</small><strong>{slide.title}</strong><em>{slide.body}</em><b>{slide.cta}<i>→</i></b></span><span className="dlv25-banner-art" aria-hidden="true"><i>{slide.symbol}</i><b/><b/><b/></span></button></article>)}</div>
  </div>
  {count>1&&<><button className="dlv-promo-arrow is-prev" type="button" aria-label="Banner sebelumnya" onClick={()=>go(index-1)}>‹</button><button className="dlv-promo-arrow is-next" type="button" aria-label="Banner berikutnya" onClick={()=>go(index+1)}>›</button><div className="dlv-promo-dots">{slides.map((s,i)=><button type="button" className={i===index?'is-active':''} onClick={()=>go(i)} key={s.id} aria-label={`Banner ${i+1}`}><i/></button>)}</div></>}
 </section>
}

export default function DLaviePromoBanners(){
 const [homeHost,setHomeHost]=useState<HTMLElement|null>(null),[marketHost,setMarketHost]=useState<HTMLElement|null>(null),[marketContext,setMarketContext]=useState<BannerContext|null>(null)
 const owned=useRef<HTMLElement[]>([])
 useEffect(()=>{let queued=false;const ensure=(cls:string,parent:HTMLElement,before:Element|null)=>{let node=parent.querySelector<HTMLElement>(`:scope > .${cls}`);if(!node){node=document.createElement('div');node.className=cls;parent.insertBefore(node,before);owned.current.push(node)}return node};const hide=(s:string)=>document.querySelectorAll<HTMLElement>(s).forEach(n=>n.hidden=true)
  const scan=()=>{queued=false;const raw=location.hash.replace(/^#\/?/,'');const inMarket=raw.toLowerCase().startsWith('market');if(!inMarket){const main=document.querySelector<HTMLElement>('main#top,main');if(main){const node=ensure('dlv-promo-home-host',main,main.firstElementChild);node.hidden=false;setHomeHost(node)}hide('.dlv-promo-market-host');setMarketHost(null);setMarketContext(null);return}hide('.dlv-promo-home-host');setHomeHost(null);const crumb=Array.from(document.querySelectorAll<HTMLElement>('.dlv21-breadcrumb')).find(x=>x.offsetParent!==null);const params=new URLSearchParams(raw.split('?')[1]||'');const signal=`${crumb?.textContent||''} ${decodeURIComponent(params.get('category')||'')}`.toLowerCase();const ctx:BannerContext|null=signal.includes('voucher')||signal.includes('game')?'game':signal.includes('paket data')||signal.includes('data')?'data':null;const shell=document.querySelector<HTMLElement>('.dlv21-market .dlv21-shell');const section=crumb?.closest<HTMLElement>('.dlv21-section')||shell?.querySelector<HTMLElement>('.dlv21-section');if(shell&&section&&ctx){const node=ensure('dlv-promo-market-host',shell,section);node.hidden=false;setMarketHost(node);setMarketContext(ctx)}else{hide('.dlv-promo-market-host');setMarketHost(null);setMarketContext(null)}}
  const queue=()=>{if(!queued){queued=true;requestAnimationFrame(scan)}};const ob=new MutationObserver(queue);ob.observe(document.body,{childList:true,subtree:true,characterData:true});addEventListener('hashchange',queue);queue();return()=>{ob.disconnect();removeEventListener('hashchange',queue);owned.current.forEach(n=>n.remove())}},[])
 return <>{homeHost&&createPortal(<BannerSlider slides={homeSlides} context="home"/>,homeHost)}{marketHost&&marketContext==='game'&&createPortal(<BannerSlider slides={gameSlides} context="game"/>,marketHost)}{marketHost&&marketContext==='data'&&createPortal(<BannerSlider slides={dataSlides} context="data"/>,marketHost)}</>
}
