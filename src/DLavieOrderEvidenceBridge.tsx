import { useEffect } from 'react'

type Order={id:string;serviceName?:string;providerName?:string;price?:number;status?:string;otp?:string;createdAt?:number;expiresAt?:number;phone?:string;countryName?:string;countryCode?:string}
type Profile={id?:string;username?:string;email?:string;createdAt?:string;avatarId?:string}
const API='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-order-evidence'
const ORDER_KEY='dlavie-orders-v1'
const PROFILE_KEY='dlavie-account-profile-v1'
const TOKEN_KEY='dlavie-wallet-token-v1'
const SESSION_KEY='dlavie-account-session-v1'
const FP_KEY='dlavie-order-evidence-fp-v3'
const PROFILE_FP_KEY='dlavie-account-evidence-fp-v1'
const STATE_EVENT='dlavie:state-changed'
function readOrders():Order[]{try{return JSON.parse(localStorage.getItem(ORDER_KEY)||'[]')}catch{return[]}}
function profile():Profile|null{try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')}catch{return null}}
function fingerprints():Record<string,string>{try{return JSON.parse(localStorage.getItem(FP_KEY)||'{}')}catch{return{}}}
function otpStatus(o:Order){if(o.status==='received')return'received';if(o.status==='expired')return'expired';if(o.status==='waiting')return'waiting';if(o.status==='cancelled')return'not_received';return'unknown'}
function accountFields(p:Profile){return{username:p.username||'',email:p.email||'',account_created_at:p.createdAt||'',avatar_id:p.avatarId||''}}
async function post(body:URLSearchParams){const r=await fetch(API,{method:'POST',body});if(!r.ok)throw new Error('evidence_sync_failed');return r}
export default function DLavieOrderEvidenceBridge(){useEffect(()=>{let timer=0,busy=false
 const sync=async()=>{if(busy||sessionStorage.getItem(SESSION_KEY)!=='active')return;const p=profile(),token=localStorage.getItem(TOKEN_KEY)||'';if(!p?.id||!token)return;busy=true;try{
   const profileFp=[p.id,p.username||'',p.email||'',p.createdAt||'',p.avatarId||''].join('|')
   if(localStorage.getItem(PROFILE_FP_KEY)!==profileFp){await post(new URLSearchParams({action:'account_sync',wallet_token:token,user_id:p.id,...accountFields(p)}));localStorage.setItem(PROFILE_FP_KEY,profileFp)}
   const current=fingerprints(),next={...current};const changed=readOrders().slice(0,20).filter(o=>{const fp=[o.status||'',o.otp?'otp':'',o.price||0,o.expiresAt||0,o.phone||'',o.providerName||''].join('|');if(current[o.id]===fp)return false;next[o.id]=fp;return true})
   for(const o of changed){
     await post(new URLSearchParams({action:'sync',wallet_token:token,user_id:p.id,...accountFields(p),order_id:o.id,service:o.serviceName||'',provider:o.providerName||'',amount:String(o.price||0),order_status:o.status||'unknown',otp_status:otpStatus(o),evidence_source:o.status==='received'&&o.otp?'client_demo':'client_reported',otp:o.otp||'',phone:o.phone||'',country:o.countryName||'',country_code:o.countryCode||'',created_at:o.createdAt?new Date(o.createdAt).toISOString():'',expires_at:o.expiresAt?new Date(o.expiresAt).toISOString():''}))
     let eventType=''
     if(o.status==='cancelled')eventType='cancel_requested'
     else if(o.status==='received'&&o.otp)eventType='otp_displayed_demo'
     else if(o.status==='expired')eventType='order_expired_app'
     if(eventType)await post(new URLSearchParams({action:'app_event',wallet_token:token,user_id:p.id,order_id:o.id,event_type:eventType,...(eventType==='otp_displayed_demo'?{otp:o.otp||''}:{})}))
   }
   if(changed.length)localStorage.setItem(FP_KEY,JSON.stringify(next))
 }catch{/* evidence bridge must never block the market UI; failed fingerprints retry on next event/focus */}finally{busy=false}}
 const schedule=()=>{clearTimeout(timer);timer=window.setTimeout(()=>void sync(),450)};schedule();window.addEventListener(STATE_EVENT,schedule);window.addEventListener('focus',schedule);window.addEventListener('storage',schedule);return()=>{clearTimeout(timer);window.removeEventListener(STATE_EVENT,schedule);window.removeEventListener('focus',schedule);window.removeEventListener('storage',schedule)}
 },[]);return null}
