import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type Contributor={name:string;roleId:string;roleEn:string;logo:string;mark:string;wide?:boolean}
const BASE=import.meta.env.BASE_URL
const contributors:Contributor[]=[
 {name:'Digiflazz',roleId:'Supplier produk digital',roleEn:'Digital product supplier',logo:'https://digiflazz.com/favicon.ico',mark:'DG'},
 {name:'Supabase',roleId:'Backend & database',roleEn:'Backend & database',logo:`${BASE}integrations/supabase.svg`,mark:'SB'},
 {name:'Midtrans',roleId:'Infrastruktur pembayaran',roleEn:'Payment infrastructure',logo:`${BASE}integrations/midtrans.svg`,mark:'MT',wide:true},
 {name:'GitHub',roleId:'Source & Pages deployment',roleEn:'Source & Pages deployment',logo:`${BASE}integrations/github.svg`,mark:'GH'},
]
function isEnglish(){return localStorage.getItem('dlavie-language')==='en'}
function route(){return location.hash.replace(/^#\/?/,'').split('?')[0].toLowerCase()}
function findPlacement(){
 const guest=document.querySelector<HTMLElement>('.dlv-guest-doc-v2 .dlv-doc-main')
 if(guest)return{parent:guest,before:guest.querySelector<HTMLElement>('.dlv-doc-footer')}
 const r=route()
 if(r==='market'){
  const parent=document.querySelector<HTMLElement>('.dlv-digital-market .dlv-digital-shell')
  if(parent)return{parent,before:null}
 }
 if(r==='activity'||r==='aktivitas'){
  const parent=document.querySelector<HTMLElement>('.order-center-page .order-center-shell')
  if(parent)return{parent,before:null}
 }
 if(r==='help'||r==='faq'){
  const parent=document.querySelector<HTMLElement>('.help-center-page.dlv-content-v2 .market-info-shell')
  if(parent)return{parent,before:null}
 }
 if(r==='legal'||r==='terms'||r==='privacy'){
  const parent=document.querySelector<HTMLElement>('.legal-center-page.dlv-content-v2 .market-info-shell')
  if(parent)return{parent,before:null}
 }
 const footer=document.querySelector<HTMLElement>('.app .footer,.footer')
 if(footer?.parentElement)return{parent:footer.parentElement as HTMLElement,before:footer}
 return null
}
function Card({item,english}:{item:Contributor;english:boolean}){
 const [failed,setFailed]=useState(false)
 return <article className="dlv-contributor-card"><span className={`dlv-contributor-logo${item.wide?' is-wide':''}`}>{!failed&&<img src={item.logo} alt={`${item.name} logo`} referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>}<b className={failed?'is-visible':''}>{item.mark}</b></span><span className="dlv-contributor-copy"><strong>{item.name}</strong><small>{english?item.roleEn:item.roleId}</small></span><i aria-hidden="true"/></article>
}
export default function DLavieContributorRail(){
 const [anchor,setAnchor]=useState<HTMLElement|null>(null)
 const [english,setEnglish]=useState(isEnglish)
 const items=useMemo(()=>contributors,[])
 useEffect(()=>{
  const node=document.createElement('div');node.className='dlv-contributor-anchor'
  let raf=0
  const place=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{const placement=findPlacement();if(!placement){if(node.parentElement)node.remove();setAnchor(null);return}const {parent,before}=placement;if(before&&before.parentElement===parent){if(node.parentElement!==parent||node.nextSibling!==before)parent.insertBefore(node,before)}else if(node.parentElement!==parent||node!==parent.lastElementChild)parent.appendChild(node);setAnchor(node);setEnglish(isEnglish())})}
  place();const observer=new MutationObserver(place);observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',place);window.addEventListener('storage',place);window.addEventListener('dlavie:language-change',place)
  return()=>{cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('hashchange',place);window.removeEventListener('storage',place);window.removeEventListener('dlavie:language-change',place);node.remove()}
 },[])
 if(!anchor)return null
 const group=(hidden=false)=><div className="dlv-contributor-group" aria-hidden={hidden||undefined}>{items.map(item=><Card key={`${hidden?'copy-':'main-'}${item.name}`} item={item} english={english}/>)}</div>
 return createPortal(<section className="dlv-contributors" aria-label={english?'DLavie technology contributors and infrastructure':'Kontributor teknologi dan infrastruktur DLavie'}><header><div><span>DLAVIE · CONTRIBUTORS</span><strong>{english?'Technology behind the marketplace':'Teknologi di balik marketplace'}</strong></div><small>{english?'Digital supplier · backend · payments · deployment':'Supplier digital · backend · pembayaran · deployment'}</small></header><div className="dlv-contributor-viewport"><div className="dlv-contributor-track">{group()}{group(true)}</div></div><footer>{english?'Logos identify technologies or integrations used by DLavie and do not imply endorsement or an official partnership.':'Logo menunjukkan teknologi atau integrasi yang digunakan DLavie dan tidak menyatakan endorsement atau partnership resmi.'}</footer></section>,anchor)
}
