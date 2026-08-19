import { useEffect } from 'react'

const BASE=import.meta.env.BASE_URL

type Item={name:string;roleId:string;roleEn:string;logo:string;mark:string;wide?:boolean}
const items:Item[]=[
 {name:'Digiflazz',roleId:'Supplier produk digital',roleEn:'Digital product supplier',logo:'https://digiflazz.com/favicon.ico',mark:'DG'},
 {name:'Supabase',roleId:'Backend & database',roleEn:'Backend & database',logo:`${BASE}integrations/supabase.svg`,mark:'SB'},
 {name:'Midtrans',roleId:'Infrastruktur pembayaran',roleEn:'Payment infrastructure',logo:`${BASE}integrations/midtrans.svg`,mark:'MT',wide:true},
 {name:'GitHub',roleId:'Source & Pages deployment',roleEn:'Source & Pages deployment',logo:`${BASE}integrations/github.svg`,mark:'GH'},
]
function english(){return localStorage.getItem('dlavie-language')==='en'}
function makeCard(item:Item,isEnglish:boolean){
 const card=document.createElement('article');card.className='dlv-contributor-card'
 const logo=document.createElement('span');logo.className=`dlv-contributor-logo${item.wide?' is-wide':''}`
 const img=document.createElement('img');img.src=item.logo;img.alt=`${item.name} logo`;img.referrerPolicy='no-referrer'
 const fallback=document.createElement('b');fallback.textContent=item.mark
 img.addEventListener('error',()=>{img.remove();fallback.classList.add('is-visible')},{once:true})
 logo.append(img,fallback)
 const copy=document.createElement('span');copy.className='dlv-contributor-copy'
 const strong=document.createElement('strong');strong.textContent=item.name
 const small=document.createElement('small');small.textContent=isEnglish?item.roleEn:item.roleId
 copy.append(strong,small)
 const dot=document.createElement('i');dot.setAttribute('aria-hidden','true')
 card.append(logo,copy,dot)
 return card
}
function makeGroup(isEnglish:boolean,hidden=false){const group=document.createElement('div');group.className='dlv-contributor-group';if(hidden)group.setAttribute('aria-hidden','true');items.forEach(item=>group.append(makeCard(item,isEnglish)));return group}
function build(){
 const isEnglish=english()
 const section=document.createElement('section');section.className='dlv-contributors dlv-contributors-static';section.setAttribute('aria-label',isEnglish?'DLavie technology contributors and infrastructure':'Kontributor teknologi dan infrastruktur DLavie')
 const header=document.createElement('header');const title=document.createElement('div');const eyebrow=document.createElement('span');eyebrow.textContent='DLAVIE · CONTRIBUTORS';const heading=document.createElement('strong');heading.textContent=isEnglish?'Technology behind the marketplace':'Teknologi di balik marketplace';title.append(eyebrow,heading);const meta=document.createElement('small');meta.textContent=isEnglish?'Digital supplier · backend · payments · deployment':'Supplier digital · backend · pembayaran · deployment';header.append(title,meta)
 const viewport=document.createElement('div');viewport.className='dlv-contributor-viewport';const track=document.createElement('div');track.className='dlv-contributor-track';track.append(makeGroup(isEnglish),makeGroup(isEnglish,true));viewport.append(track)
 const foot=document.createElement('footer');foot.textContent=isEnglish?'Logos identify technologies or integrations used by DLavie and do not imply endorsement or an official partnership.':'Logo menunjukkan teknologi atau integrasi yang digunakan DLavie dan tidak menyatakan endorsement atau partnership resmi.'
 section.append(header,viewport,foot);return section
}
export default function DLavieContributorGuestBridge(){
 useEffect(()=>{
  let raf=0
  const mount=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{
   const shell=document.querySelector<HTMLElement>('.dlv-guest-doc-v2 .dlv-doc-main')
   const footer=shell?.querySelector<HTMLElement>('.dlv-doc-footer')
   const existing=document.querySelector<HTMLElement>('.dlv-contributors-static')
   if(!shell||!footer){existing?.remove();return}
   if(existing&&existing.parentElement===shell&&existing.nextElementSibling===footer)return
   existing?.remove();footer.before(build())
  })}
  mount();const observer=new MutationObserver(mount);observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',mount);window.addEventListener('storage',mount);window.addEventListener('dlavie:language-change',mount)
  return()=>{cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('hashchange',mount);window.removeEventListener('storage',mount);window.removeEventListener('dlavie:language-change',mount);document.querySelector('.dlv-contributors-static')?.remove()}
 },[])
 return null
}
