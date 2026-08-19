import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import DigitalBrandIcon from './DigitalBrandIcon'
import { detectIndonesianOperator, phoneDigits, setManualOperator, type IndonesianOperator } from './DigitalPhoneIntelligence'

const operators=['Telkomsel','IM3','XL','AXIS','Tri','Smartfren'] as const

export default function DigitalManualOperatorFallback(){
 const [host,setHost]=useState<HTMLElement|null>(null)
 const [digits,setDigits]=useState('')
 useEffect(()=>{
  let input:HTMLInputElement|null=null
  const read=()=>{const h=document.querySelector<HTMLElement>('.dlv22-number-first');setHost(h);const next=h?.querySelector<HTMLInputElement>('input')||null;if(next!==input){if(input)input.removeEventListener('input',readValue);input=next;if(input)input.addEventListener('input',readValue)}readValue()}
  const readValue=()=>setDigits(phoneDigits(input?.value||''))
  const obs=new MutationObserver(read);obs.observe(document.body,{childList:true,subtree:true});read()
  return()=>{obs.disconnect();if(input)input.removeEventListener('input',readValue)}
 },[])
 if(!host||digits.length<4||detectIndonesianOperator(digits))return null
 const choose=(operator:Exclude<IndonesianOperator,null>)=>{
  setManualOperator(digits,operator)
  const input=host.querySelector<HTMLInputElement>('input');if(!input)return
  const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set
  if(!setter)return
  const original=input.value
  setter.call(input,`${original}0`);input.dispatchEvent(new Event('input',{bubbles:true}))
  requestAnimationFrame(()=>{setter.call(input,original);input.dispatchEvent(new Event('input',{bubbles:true}))})
 }
 return createPortal(<div className="dlv22-manual-operator"><div><b>Prefix belum dapat dipastikan</b><span>Pilih operator hanya jika kamu yakin. Nomor asli tetap dipakai.</span></div><div>{operators.map(o=><button key={o} onClick={()=>choose(o)}><DigitalBrandIcon brand={o} category="Paket Data"/><span>{o}</span></button>)}</div></div>,host)
}
