import { useEffect, useState } from 'react'
import { digitalAuth, digitalCall, isDigitalMarket, money } from './digital-market-api'

const EVENT='dlavie:state-changed'

export default function H2HSandboxExperience(){
 const [sandbox,setSandbox]=useState(false)
 const [sandboxBalance,setSandboxBalance]=useState<number|null>(null)
 const [active,setActive]=useState(isDigitalMarket)

 useEffect(()=>{
  const syncRoute=()=>setActive(isDigitalMarket())
  window.addEventListener('hashchange',syncRoute)
  return()=>window.removeEventListener('hashchange',syncRoute)
 },[])

 useEffect(()=>{
  if(!active){setSandbox(false);document.documentElement.removeAttribute('data-h2h-sandbox');return}
  let dead=false
  const load=async()=>{
   try{
    const s=await digitalCall('summary')
    const yes=s?.integration?.environment==='sandbox'
    if(dead)return
    setSandbox(yes)
    document.documentElement.toggleAttribute('data-h2h-sandbox',yes)
    if(yes){
     const auth=digitalAuth()
     if(auth.wallet_token&&auth.user_id){
      const h=await digitalCall('history',auth).catch(()=>null)
      if(!dead&&typeof h?.sandbox_balance==='number')setSandboxBalance(h.sandbox_balance)
     }
    }
   }catch{}
  }
  void load()
  const onState=()=>void load()
  window.addEventListener(EVENT,onState)
  const t=window.setInterval(load,15000)
  return()=>{dead=true;window.removeEventListener(EVENT,onState);window.clearInterval(t)}
 },[active])

 useEffect(()=>{
  if(!sandbox)return
  const apply=()=>{
   const status=document.querySelector<HTMLElement>('.dlv-digital-status b')
   if(status&&status.textContent!=='Sandbox DLavie aktif')status.textContent='Sandbox DLavie aktif'
   document.querySelectorAll<HTMLButtonElement>('.dlv-product-checkout form > button').forEach(btn=>{
    if(btn.textContent?.includes('Bayar dengan Wallet')){
     const arrow=btn.querySelector('b')
     btn.childNodes.forEach(n=>{if(n.nodeType===Node.TEXT_NODE)n.textContent='Tes di Sandbox'})
     if(arrow)arrow.textContent='→'
    }
   })
   document.querySelectorAll<HTMLButtonElement>('.dlv-digital-receipt .is-pay').forEach(btn=>{
    if(!btn.disabled&&btn.textContent?.includes('Bayar dengan Wallet'))btn.textContent='Bayar di Sandbox'
   })
  }
  apply()
  const obs=new MutationObserver(apply)
  obs.observe(document.body,{subtree:true,childList:true,characterData:true})
  return()=>obs.disconnect()
 },[sandbox])

 if(!active||!sandbox)return null
 return <div className="dlv-h2h-sandbox-banner" role="status">
  <div><b>SANDBOX DLAVIE</b><span>H2H tidak dipanggil · HCoin dan saldo Wallet asli tidak dipotong.</span></div>
  <strong>{sandboxBalance==null?'Saldo tes Rp1.000.000':`Saldo tes ${money.format(sandboxBalance)}`}</strong>
  <small>Tujuan akhir <b>000</b> = gagal + refund · <b>999</b> = tetap pending · selain itu = sukses + SN/token simulasi.</small>
 </div>
}
