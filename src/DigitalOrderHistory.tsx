import type { DigitalOrder } from './digital-market-api'
import { digitalStatus, money, when } from './digital-market-api'

export default function DigitalOrderHistory({open,orders,busy,onClose,onCheck}:{open:boolean;orders:DigitalOrder[];busy:boolean;onClose:()=>void;onCheck:(ref:string)=>void}){
  if(!open)return null
  return <div className="dlv-digital-history-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><aside className="dlv-digital-history"><header><div><span>PESANAN DIGITAL</span><h2>Riwayat pembelian</h2></div><button onClick={onClose}>×</button></header>{orders.length?orders.map(o=><article key={o.ref_id}><div className="dlv-history-copy"><small>{o.category} · {o.brand}</small><strong>{o.product_name}</strong><code>{o.ref_id}</code></div><div className="dlv-history-state"><b>{money.format(o.sell_price)}</b><em data-status={o.status}>{digitalStatus(o.status)}</em><small>{when(o.created_at)}</small></div>{o.serial_number&&<p><b>SN / TOKEN</b><span>{o.serial_number}</span></p>}{o.message&&<p className="is-message">{o.message}</p>}{o.status==='pending'&&<button disabled={busy} onClick={()=>onCheck(o.ref_id)}>Cek status</button>}</article>):<div className="dlv-history-empty">Belum ada pembelian produk digital.</div>}</aside></div>
}
