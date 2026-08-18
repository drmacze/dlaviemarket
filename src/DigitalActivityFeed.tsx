import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { digitalAuth, digitalCall, digitalStatus, money, when, type DigitalOrder } from './digital-market-api'
const STATE_EVENT='dlavie:state-changed'
function isActivity(){const r=location.hash.replace(/^#\/?/,'').split('?')[0].toLowerCase();return r==='activity'||r==='aktivitas'}
export default function DigitalActivityFeed(){const [target,setTarget]=useState<HTMLElement|null>(null),[orders,setOrders]=useState<DigitalOrder[]>([])
 const load=useCallback(async()=>{if(!isActivity())return;const a=digitalAuth();if(!a.wallet_token||!a.user_id)return;try{const d=await digitalCall('history',a);setOrders(d.orders||[])}catch{}},[])
 useEffect(()=>{let t=0;const mount=()=>{clearTimeout(t);if(!isActivity()){setTarget(null);return}const root=document.querySelector<HTMLElement>('.order-center-shell');if(root)setTarget(root);else t=window.setTimeout(mount,120)};mount();window.addEventListener('hashchange',mount);return()=>{clearTimeout(t);window.removeEventListener('hashchange',mount)}},[])
 useEffect(()=>{if(!target)return;void load();const sync=()=>void load();window.addEventListener(STATE_EVENT,sync);window.addEventListener('focus',sync);return()=>{window.removeEventListener(STATE_EVENT,sync);window.removeEventListener('focus',sync)}},[target,load])
 if(!target)return null
 return createPortal(<section className="dlv-digital-activity"><header><div><span>DIGITAL ORDERS</span><h2>Produk digital</h2><p>Pulsa, data, listrik, e-wallet, game, dan voucher.</p></div><b>{orders.length}</b></header>{orders.length?<div className="dlv-digital-activity-list">{orders.slice(0,12).map(o=><article key={o.ref_id}><div><small>{o.category} · {o.brand}</small><strong>{o.product_name}</strong><code>{o.ref_id}</code></div><div><b>{money.format(o.sell_price)}</b><em data-status={o.status}>{digitalStatus(o.status)}</em><small>{when(o.created_at)}</small></div><footer><span>Tujuan <b>{o.customer_no}</b></span>{o.serial_number&&<span>SN / TOKEN <b>{o.serial_number}</b></span>}{o.message&&<span>{o.message}</span>}</footer></article>)}</div>:<div className="dlv-digital-activity-empty">Belum ada pembelian produk digital.</div>}</section>,target)
}
