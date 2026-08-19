import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Sprite='a'|'b'
type Frame=0|1|2|3
type BannerSlide={id:string;sprite:Sprite;frame:Frame;label:string;title:string;cta:string;route:string}
type BannerContext='home'|'game'|'data'

const homeSlides:BannerSlide[]=[
 {id:'home-market',sprite:'a',frame:0,label:'DLAVIE DIGITAL MARKET',title:'Satu wallet untuk kebutuhan digital harian.',cta:'Jelajahi market',route:'#/market'},
 {id:'home-promo',sprite:'a',frame:1,label:'PROMO DLAVIE',title:'Promo digital yang terasa lebih jelas.',cta:'Lihat Digital Market',route:'#/market'},
 {id:'home-workflow',sprite:'a',frame:2,label:'DLAVIE WORKFLOW',title:'Transaksi lebih tenang, dari pilih produk sampai bukti pembelian.',cta:'Pelajari alurnya',route:'#/market'},
]
const gameSlides:BannerSlide[]=[
 {id:'game-free-fire',sprite:'a',frame:3,label:'VOUCHER GAME',title:'Top up Free Fire lebih ringkas.',cta:'Buka Voucher Game',route:'#/market?category=Voucher%20%26%20Game'},
 {id:'game-mobile-legends',sprite:'b',frame:0,label:'VOUCHER GAME',title:'Diamond Mobile Legends, tampil lebih jelas.',cta:'Buka Voucher Game',route:'#/market?category=Voucher%20%26%20Game'},
 {id:'game-hub',sprite:'b',frame:1,label:'GAME HUB',title:'Voucher game populer dalam satu tempat.',cta:'Lihat semua game',route:'#/market?category=Voucher%20%26%20Game'},
]
const dataSlides:BannerSlide[]=[
 {id:'data-operators',sprite:'b',frame:2,label:'PAKET DATA',title:'Kuota semua operator, lebih mudah dibandingkan.',cta:'Cari paket data',route:'#/market?category=Paket%20Data'},
 {id:'data-daily',sprite:'b',frame:3,label:'KUOTA HARIAN',title:'Untuk chat, streaming, kerja, dan gaming.',cta:'Lihat pilihan kuota',route:'#/market?category=Paket%20Data'},
]
const frameY=['0%','33.3333%','66.6667%','100%'] as const
const spriteUrl=(sprite:Sprite)=>`${import.meta.env.BASE_URL}banners/dlavie-banner-sprite-${sprite}.webp`
const openRoute=(route:string)=>{window.location.hash=route.replace(/^#/,'')}

function BannerSlider({slides,context}:{slides:BannerSlide[];context:BannerContext}){
 const [index,setIndex]=useState(0)
 const [paused,setPaused]=useState(false)
 const [timerKey,setTimerKey]=useState(0)
 const pointer=useRef<{x:number;y:number}|null>(null)
 const moved=useRef(false)
 const reduced=useMemo(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches,[])
 const count=slides.length

 useEffect(()=>{setIndex(0);setTimerKey(k=>k+1)},[context])
 useEffect(()=>{
  if(paused||reduced||count<2)return
  const id=window.setInterval(()=>setIndex(i=>(i+1)%count),6500)
  return()=>window.clearInterval(id)
 },[paused,reduced,count,timerKey])
 useEffect(()=>{
  const visibility=()=>setPaused(document.hidden)
  document.addEventListener('visibilitychange',visibility)
  return()=>document.removeEventListener('visibilitychange',visibility)
 },[])

 const go=(next:number)=>{setIndex((next+count)%count);setTimerKey(k=>k+1)}
 const next=()=>go(index+1),prev=()=>go(index-1)
 const down=(e:React.PointerEvent)=>{pointer.current={x:e.clientX,y:e.clientY};moved.current=false}
 const move=(e:React.PointerEvent)=>{if(!pointer.current)return;if(Math.abs(e.clientX-pointer.current.x)>8)moved.current=true}
 const up=(e:React.PointerEvent)=>{
  const start=pointer.current;pointer.current=null
  if(!start)return
  const dx=e.clientX-start.x,dy=e.clientY-start.y
  if(Math.abs(dx)>44&&Math.abs(dx)>Math.abs(dy)){dx<0?next():prev();moved.current=true}
 }
 const activate=(slide:BannerSlide)=>{if(!moved.current)openRoute(slide.route);moved.current=false}

 return <section className={`dlv-promo-carousel is-${context}`} aria-label={context==='home'?'Sorotan DLavie':context==='game'?'Sorotan Voucher Game':'Sorotan Paket Data'} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}>
  <div className="dlv-promo-viewport" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{pointer.current=null}}>
   <div className="dlv-promo-track" style={{transform:`translate3d(-${index*100}%,0,0)`}}>
    {slides.map(slide=><article className="dlv-promo-slide" key={slide.id} aria-hidden={slides[index].id!==slide.id}>
     <button type="button" className="dlv-promo-art" aria-label={`${slide.title} — ${slide.cta}`} onClick={()=>activate(slide)}>
      <span className="dlv-promo-sprite" aria-hidden="true" style={{backgroundImage:`url(${spriteUrl(slide.sprite)})`,backgroundPosition:`center ${frameY[slide.frame]}`}}/>
      <span className="dlv-promo-theme-wash" aria-hidden="true"/>
     </button>
     <div className="dlv-promo-mobile-caption">
      <span>{slide.label}</span><strong>{slide.title}</strong><button type="button" onClick={()=>openRoute(slide.route)}>{slide.cta}<b>→</b></button>
     </div>
    </article>)}
   </div>
  </div>
  {count>1&&<>
   <button className="dlv-promo-arrow is-prev" type="button" aria-label="Banner sebelumnya" onClick={prev}>‹</button>
   <button className="dlv-promo-arrow is-next" type="button" aria-label="Banner berikutnya" onClick={next}>›</button>
   <div className="dlv-promo-dots" role="tablist" aria-label="Pilih banner">{slides.map((slide,i)=><button type="button" role="tab" aria-selected={i===index} aria-label={`Banner ${i+1}: ${slide.title}`} className={i===index?'is-active':''} onClick={()=>go(i)} key={slide.id}><i/></button>)}</div>
   {!reduced&&<div className="dlv-promo-progress" aria-hidden="true" key={`${index}-${timerKey}`}><i style={{animationPlayState:paused?'paused':'running'}}/></div>}
  </>}
 </section>
}

export default function DLaviePromoBanners(){
 const [homeHost,setHomeHost]=useState<HTMLElement|null>(null)
 const [marketHost,setMarketHost]=useState<HTMLElement|null>(null)
 const [marketContext,setMarketContext]=useState<BannerContext|null>(null)
 const owned=useRef<HTMLElement[]>([])

 useEffect(()=>{
  let queued=false
  const host=(className:string,parent:HTMLElement,before:Element|null)=>{
   let node=parent.querySelector<HTMLElement>(`:scope > .${className}`)
   if(!node){node=document.createElement('div');node.className=className;parent.insertBefore(node,before);owned.current.push(node)}
   return node
  }
  const scan=()=>{
   queued=false
   const raw=window.location.hash.replace(/^#\/?/,'').toLowerCase()
   const inMarket=raw.startsWith('market')
   const catalog=document.querySelector<HTMLElement>('.catalog-section')
   const visibleHome=!!catalog&&!inMarket&&catalog.offsetParent!==null
   if(visibleHome&&catalog){
    const digital=catalog.querySelector('.dlv-home-digital-host')
    const node=host('dlv-promo-home-host',catalog,digital||catalog.firstElementChild)
    node.hidden=false
    setHomeHost(prev=>prev===node?prev:node)
   }else{
    document.querySelectorAll<HTMLElement>('.dlv-promo-home-host').forEach(n=>n.hidden=true)
    setHomeHost(prev=>prev?null:prev)
   }

   if(inMarket){
    const section=document.querySelector<HTMLElement>('.dlv21-section.dlv21-catalog')
    const breadcrumb=section?.querySelector<HTMLElement>('.dlv21-breadcrumb')?.textContent||''
    const context:BannerContext|null=breadcrumb.includes('Voucher & Game')?'game':breadcrumb.includes('Paket Data')?'data':null
    if(section&&section.parentElement&&context){
     const node=host('dlv-promo-market-host',section.parentElement,section)
     node.hidden=false
     setMarketHost(prev=>prev===node?prev:node)
     setMarketContext(prev=>prev===context?prev:context)
    }else{
     document.querySelectorAll<HTMLElement>('.dlv-promo-market-host').forEach(n=>n.hidden=true)
     setMarketHost(prev=>prev?null:prev);setMarketContext(prev=>prev?null:prev)
    }
   }else{
    document.querySelectorAll<HTMLElement>('.dlv-promo-market-host').forEach(n=>n.hidden=true)
    setMarketHost(prev=>prev?null:prev);setMarketContext(prev=>prev?null:prev)
   }
  }
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(scan)}
  const observer=new MutationObserver(queue)
  observer.observe(document.body,{childList:true,subtree:true,characterData:true})
  window.addEventListener('hashchange',queue)
  window.addEventListener('resize',queue,{passive:true})
  queue()
  return()=>{
   observer.disconnect();window.removeEventListener('hashchange',queue);window.removeEventListener('resize',queue)
   owned.current.forEach(node=>node.remove());owned.current=[]
  }
 },[])

 return <>
  {homeHost&&createPortal(<BannerSlider slides={homeSlides} context="home"/>,homeHost)}
  {marketHost&&marketContext==='game'&&createPortal(<BannerSlider slides={gameSlides} context="game"/>,marketHost)}
  {marketHost&&marketContext==='data'&&createPortal(<BannerSlider slides={dataSlides} context="data"/>,marketHost)}
 </>
}
