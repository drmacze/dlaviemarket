import { useEffect } from 'react'

type Order={id:string;serviceName?:string;providerName?:string;price?:number;status?:string;otp?:string;createdAt?:number;expiresAt?:number}
type Profile={id?:string}
const API='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-order-evidence'
const ORDER_KEY='dlavie-orders-v1'
const PROFILE_KEY='dlavie-account-profile-v1'
const TOKEN_KEY='dlavie-wallet-token-v1'
const SESSION_KEY='dlavie-account-session-v1'
const FP_KEY='dlavie-order-evidence-fp-v1'
const STATE_EVENT='dlavie:state-changed'
function readOrders():Order[]{try{return JSON.parse(localStorage.getItem(ORDER_KEY)||'[]')}catch{return[]}}
function profile():Profile|null{try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')}catch{return null}}
function fingerprints():Record<string,string>{try{return JSON.parse(localStorage.getItem(FP_KEY)||'{}')}catch{return{}}}
function otpStatus(o:Order){if(o.status==='received')return'received';if(o.status==='expired')return'expired';if(o.status==='waiting')return'waiting';return'unknown'}
export default function DLavieOrderEvidenceBridge(){useEffect(()=>{let timer=0,busy=false
 const sync=async()=>{if(busy||sessionStorage.getItem(SESSION_KEY)!=='active')return;const p=profile(),token=localStorage.getItem(TOKEN_KEY)||'';if(!p?.id||!token)return;const current=fingerprints(),next={...current};const changed=readOrders().slice(0,20).filter(o=>{const fp=[o.status||'',o.otp?'otp':'',o.price||0,o.expiresAt||0].join('|');if(current[o.id]===fp)return false;next[o.id]=fp;return true});if(!changed.length)return;busy=true;try{for(const o of changed){const body=new URLSearchParams({action:'sync',wallet_token:token,user_id:p.id,order_id:o.id,service:o.serviceName||'',provider:o.providerName||'',amount:String(o.price||0),order_status:o.status||'unknown',otp_status:otpStatus(o),evidence_source:o.status==='received'&&o.otp?'client_demo':'client_reported',otp:o.otp||'',created_at:o.createdAt?new Date(o.createdAt).toISOString():'',expires_at:o.expiresAt?new Date(o.expiresAt).toISOString():''});const r=await fetch(API,{method:'POST',body});if(!r.ok)throw new Error('evidence_sync_failed')}localStorage.setItem(FP_KEY,JSON.stringify(next))}catch{/* evidence bridge must never block the market UI */}finally{busy=false}}
 const schedule=()=>{clearTimeout(timer);timer=window.setTimeout(()=>void sync(),450)};schedule();window.addEventListener(STATE_EVENT,schedule);window.addEventListener('focus',schedule);window.addEventListener('storage',schedule);return()=>{clearTimeout(timer);window.removeEventListener(STATE_EVENT,schedule);window.removeEventListener('focus',schedule);window.removeEventListener('storage',schedule)}
 },[]);return null}
