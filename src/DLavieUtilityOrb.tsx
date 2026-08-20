import { useEffect, useState, type ReactNode } from 'react'

type UtilityIconName='music'|'help'|'close'
function UtilityIcon({name}:{name:UtilityIconName}){
  const paths:Record<UtilityIconName,ReactNode>={
    music:<><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></>,
    help:<><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2h9A3.5 3.5 0 0 1 20 5.5v7a3.5 3.5 0 0 1-3.5 3.5H10l-5 4v-4.5A3.5 3.5 0 0 1 4 13z"/><path d="M9.4 8.2a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2-2.6 3.5"/><circle cx="12" cy="14.5" r=".65" fill="currentColor" stroke="none"/></>,
    close:<><path d="m7 7 10 10M17 7 7 17"/></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export default function DLavieUtilityOrb(){
  const [expanded,setExpanded]=useState(false)
  const [musicPlaying,setMusicPlaying]=useState(false)
  const [unread,setUnread]=useState(0)
  const [occupied,setOccupied]=useState(false)

  useEffect(()=>{
    document.documentElement.setAttribute('data-dlv-utility-orb','1')
    let queued=false
    const sync=()=>{
      queued=false
      setMusicPlaying(!!document.querySelector('.ambient-eq.playing'))
      const badge=document.querySelector<HTMLElement>('.dlv-assistant-unread')
      const count=Number((badge?.textContent||'0').replace(/\D/g,''))
      setUnread(Number.isFinite(count)?count:0)
      setOccupied(!!document.querySelector('.dlv-assistant-panel,.ambient-panel,.dlv21-sheet-backdrop,.dlv28-receipt-backdrop'))
    }
    const queue=()=>{if(!queued){queued=true;requestAnimationFrame(sync)}}
    const observer=new MutationObserver(queue)
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-phase']})
    queue()
    return()=>{
      observer.disconnect()
      document.documentElement.removeAttribute('data-dlv-utility-orb')
    }
  },[])

  useEffect(()=>{if(occupied)setExpanded(false)},[occupied])

  const openLegacyPanel=(triggerSelector:string,panelSelector:string)=>{
    setExpanded(false)
    let attempt=0
    const tryOpen=()=>{
      if(document.querySelector(panelSelector))return
      const trigger=document.querySelector<HTMLButtonElement>(triggerSelector)
      if(!trigger)return
      trigger.click()
      attempt+=1
      if(attempt<3)window.setTimeout(()=>{if(!document.querySelector(panelSelector))tryOpen()},70)
    }
    window.setTimeout(tryOpen,24)
  }
  const openMusic=()=>openLegacyPanel('.ambient-trigger','.ambient-panel')
  const openHelp=()=>openLegacyPanel('.dlv-assistant-launcher','.dlv-assistant-panel')

  return <nav className={`dlv-utility-orb ${expanded?'is-expanded':''} ${occupied?'is-occupied':''}`} aria-label="Akses cepat DLavie">
    <button className="dlv-orbit-item is-music" type="button" onClick={openMusic} aria-label="Buka pemutar musik">
      <UtilityIcon name="music"/><span>Music</span>{musicPlaying&&<i className="dlv-orbit-live" aria-label="Sedang diputar"/>}
    </button>
    <button className="dlv-orbit-item is-help" type="button" onClick={openHelp} aria-label="Buka bantuan DLavie Assistant">
      <UtilityIcon name="help"/><span>Bantuan</span>{unread>0&&<b className="dlv-orbit-unread">{unread>9?'9+':unread}</b>}
    </button>
    <button className="dlv-orbit-item is-close" type="button" onClick={()=>setExpanded(false)} aria-label="Tutup menu cepat">
      <UtilityIcon name="close"/><span>Tutup</span>
    </button>
    <button className="dlv-orbit-core" type="button" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)} data-music={musicPlaying?'on':'off'} aria-label={expanded?'Tutup akses cepat':'Buka akses cepat'}>
      <span className="dlv-orbit-halo" aria-hidden="true"/>
      <span className="dlv-orbit-mark" aria-hidden="true"><i/><i/><i/></span>
      <span className="dlv-orbit-core-label">DLavie</span>
    </button>
  </nav>
}
