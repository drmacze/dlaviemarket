import { useEffect } from 'react'
import './dlavie-contributor-rail.css'

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
function makeGroup(isEnglish:boolean,hidden=false){
 const group=document.createElement('div');group.className='dlv-contributor-group';if(hidden)group.setAttribute('aria-hidden','true')
 items.forEach(item=>group.append(makeCard(item,isEnglish)))
 return group
}
function build(){
 const isEnglish=english()
 const section=document.createElement('section');section.className='dlv-contributors dlv-contributors-site';section.setAttribute('aria-label',isEnglish?'DLavie technology contributors and infrastructure':'Kontributor teknologi dan infrastruktur DLavie')
 const header=document.createElement('header')
 const title=document.createElement('div')
 const eyebrow=document.createElement('span');eyebrow.textContent='DLAVIE · CONTRIBUTORS'
 const heading=document.createElement('strong');heading.textContent=isEnglish?'Technology behind the marketplace':'Teknologi di balik marketplace'
 title.append(eyebrow,heading)
 const meta=document.createElement('small');meta.textContent=isEnglish?'Digital supplier · backend · payments · deployment':'Supplier digital · backend · pembayaran · deployment'
 header.append(title,meta)
 const viewport=document.createElement('div');viewport.className='dlv-contributor-viewport'
 const track=document.createElement('div');track.className='dlv-contributor-track';track.append(makeGroup(isEnglish),makeGroup(isEnglish,true));viewport.append(track)
 const foot=document.createElement('footer');foot.textContent=isEnglish?'Logos identify technologies or integrations used by DLavie and do not imply endorsement or an official partnership.':'Logo menunjukkan teknologi atau integrasi yang digunakan DLavie dan tidak menyatakan endorsement atau partnership resmi.'
 section.append(header,viewport,foot)
 return section
}
function visibleFooter(){
 const candidates=Array.from(document.querySelectorAll<HTMLElement>('footer.footer.shell,footer.footer,.footer.shell,.footer'))
 const visible=candidates.filter(el=>{const style=getComputedStyle(el);const rect=el.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity||1)!==0&&rect.width>1&&rect.height>1})
 return visible.at(-1)||candidates.at(-1)||null
}

export default function DLavieContributorSiteBridge(){
 useEffect(()=>{
  let raf=0
  let currentParent:HTMLElement|null=null
  const mount=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{
   const existing=document.querySelector<HTMLElement>('.dlv-contributors-site')
   if(document.querySelector('.dlv-guest-doc-v2')){existing?.remove();currentParent?.classList.remove('dlv-contributor-host-parent');currentParent=null;return}
   const footer=visibleFooter()
   if(!footer?.parentElement){existing?.remove();currentParent?.classList.remove('dlv-contributor-host-parent');currentParent=null;return}
   const parent=footer.parentElement as HTMLElement
   if(currentParent&&currentParent!==parent)currentParent.classList.remove('dlv-contributor-host-parent')
   currentParent=parent;parent.classList.add('dlv-contributor-host-parent')
   if(existing&&existing.parentElement===parent&&existing.nextElementSibling===footer)return
   existing?.remove()
   footer.before(build())
  })}
  mount()
  const observer=new MutationObserver(mount);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']})
  window.addEventListener('hashchange',mount);window.addEventListener('storage',mount);window.addEventListener('dlavie:language-change',mount);window.addEventListener('dlavie:state-changed',mount);window.addEventListener('resize',mount)
  return()=>{cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('hashchange',mount);window.removeEventListener('storage',mount);window.removeEventListener('dlavie:language-change',mount);window.removeEventListener('dlavie:state-changed',mount);window.removeEventListener('resize',mount);currentParent?.classList.remove('dlv-contributor-host-parent');document.querySelector('.dlv-contributors-site')?.remove()}
 },[])
 return null
}
