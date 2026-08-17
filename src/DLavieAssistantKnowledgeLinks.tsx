import { useEffect } from 'react'

const LINK_RE=/\[\[([^\]|]{1,100})\|(#\/[^\]]{1,180})\]\]/g

function linkifyParagraph(p:HTMLElement){
 const article=p.closest('.dlv-assistant-message')
 if(!article?.classList.contains('is-assistant')||article.classList.contains('is-typing'))return
 const raw=p.textContent||''
 if(!raw.includes('[['))return
 LINK_RE.lastIndex=0
 const matches=[...raw.matchAll(LINK_RE)]
 if(!matches.length)return
 const fragment=document.createDocumentFragment()
 let cursor=0
 for(const match of matches){
  const index=match.index||0
  if(index>cursor)fragment.append(document.createTextNode(raw.slice(cursor,index)))
  const a=document.createElement('a')
  a.className='dlv-assistant-doc-link'
  a.href=match[2]
  a.textContent=match[1]
  const arrow=document.createElement('span');arrow.textContent='→';a.appendChild(arrow)
  fragment.append(a)
  cursor=index+match[0].length
 }
 if(cursor<raw.length)fragment.append(document.createTextNode(raw.slice(cursor)))
 p.replaceChildren(fragment)
}

function patchEngineVersion(){
 document.querySelectorAll<HTMLElement>('.dlv-assistant-ready-meta strong').forEach(node=>{
  if(/^DLavie v\d+/i.test(node.textContent||''))node.textContent='DLavie v3'
 })
}

function applyLinks(){
 document.querySelectorAll<HTMLElement>('.dlv-assistant-message.is-assistant:not(.is-typing) p').forEach(linkifyParagraph)
 patchEngineVersion()
}

function setReactInputValue(input:HTMLInputElement,value:string){
 const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set
 setter?.call(input,value)
 input.dispatchEvent(new Event('input',{bubbles:true}))
}

function applyHelpDeepLink(){
 const hash=window.location.hash
 const [route,raw='']=hash.replace(/^#\/?/,'').split('?')
 if(route.toLowerCase()!=='help')return
 const params=new URLSearchParams(raw)
 const search=params.get('search')||params.get('topic')
 if(!search)return
 window.setTimeout(()=>{
  const input=document.querySelector<HTMLInputElement>('.faq-search input')
  if(!input)return
  setReactInputValue(input,search)
  window.setTimeout(()=>{
   const first=document.querySelector<HTMLElement>('.faq-list article')
   if(!first)return
   const button=first.querySelector<HTMLButtonElement>('button')
   if(button&&button.getAttribute('aria-expanded')!=='true')button.click()
   first.scrollIntoView({behavior:'smooth',block:'center'})
  },120)
 },70)
}

export default function DLavieAssistantKnowledgeLinks(){
 useEffect(()=>{
  const observer=new MutationObserver(mutations=>{
   if(mutations.some(m=>m.type==='childList'||(m.type==='attributes'&&m.attributeName==='class')))applyLinks()
  })
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
  const click=(event:MouseEvent)=>{
   const target=event.target as HTMLElement|null
   const link=target?.closest<HTMLAnchorElement>('.dlv-assistant-doc-link')
   if(!link)return
   document.querySelector<HTMLButtonElement>('.dlv-assistant-close')?.click()
  }
  const route=()=>{applyHelpDeepLink();window.setTimeout(applyLinks,0)}
  document.addEventListener('click',click,true)
  window.addEventListener('hashchange',route)
  applyLinks();applyHelpDeepLink()
  return()=>{observer.disconnect();document.removeEventListener('click',click,true);window.removeEventListener('hashchange',route)}
 },[])
 return null
}
