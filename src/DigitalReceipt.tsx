import { useMemo } from 'react'
import DigitalBrandIcon from './DigitalBrandIcon'
import { digitalStatus, money, when, type DigitalOrder } from './digital-market-api'

const safeFile=(v='')=>v.replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,80)

function receiptLines(order:DigitalOrder){
  return [
    ['Status',digitalStatus(order.status)],
    ['Ref ID',order.ref_id],
    ['Tanggal',when(order.created_at)],
    ['Produk',order.product_name],
    ['Brand',order.brand],
    ['Kategori',order.category],
    ['Tujuan',order.customer_no||'—'],
    ...(order.customer_name?[['Pelanggan',order.customer_name]]:[]),
    ...(order.period?[['Periode',order.period]]:[]),
    ['Total',money.format(order.sell_price)],
    ['Environment',order.environment==='sandbox'?'Sandbox DLavie':'Production'],
    ...(order.serial_number?[['SN / TOKEN',order.serial_number]]:[]),
  ] as Array<[string,string]>
}

function wrap(ctx:CanvasRenderingContext2D,text:string,max:number){
  const words=text.split(/\s+/);const rows:string[]=[];let line=''
  for(const word of words){const n=line?`${line} ${word}`:word;if(ctx.measureText(n).width>max&&line){rows.push(line);line=word}else line=n}
  if(line)rows.push(line);return rows
}

export default function DigitalReceipt({order,onClose}:{order:DigitalOrder|null;onClose:()=>void}){
  const rows=useMemo(()=>order?receiptLines(order):[],[order])
  if(!order)return null

  const printReceipt=()=>{
    document.documentElement.setAttribute('data-dlavie-print-receipt','1')
    const done=()=>{document.documentElement.removeAttribute('data-dlavie-print-receipt');window.removeEventListener('afterprint',done)}
    window.addEventListener('afterprint',done)
    window.print()
    window.setTimeout(()=>document.documentElement.removeAttribute('data-dlavie-print-receipt'),2500)
  }

  const downloadPng=()=>{
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1580
    const ctx=canvas.getContext('2d');if(!ctx)return
    ctx.fillStyle='#f7f7f2';ctx.fillRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle='#0d1512';ctx.font='800 54px system-ui';ctx.fillText('DLavie',72,100)
    ctx.font='700 26px system-ui';ctx.fillStyle='#237a59';ctx.fillText(order.environment==='sandbox'?'STRUK SANDBOX':'BUKTI TRANSAKSI DIGITAL',72,148)
    ctx.font='800 66px system-ui';ctx.fillStyle='#0d1512';ctx.fillText(digitalStatus(order.status),72,245)
    ctx.font='500 24px ui-monospace,monospace';ctx.fillStyle='#6e7773';ctx.fillText(order.ref_id,72,292)
    let y=365
    for(const [label,value] of rows){
      ctx.font='700 20px system-ui';ctx.fillStyle='#7a837f';ctx.fillText(label.toUpperCase(),72,y)
      ctx.font='650 28px system-ui';ctx.fillStyle='#121916';const lines=wrap(ctx,String(value),900)
      lines.forEach((line,i)=>ctx.fillText(line,72,y+38+(i*34)));y+=72+(Math.max(0,lines.length-1)*34)
      ctx.strokeStyle='#d9ddd9';ctx.beginPath();ctx.moveTo(72,y-12);ctx.lineTo(1008,y-12);ctx.stroke();y+=14
      if(y>1450)break
    }
    ctx.font='500 20px system-ui';ctx.fillStyle='#7a837f';ctx.fillText('Simpan bukti ini untuk kebutuhan bantuan transaksi.',72,1510)
    canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`DLavie-Struk-${safeFile(order.ref_id)}.png`;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1500)},'image/png',1)
  }

  return <div className="dlv22-receipt-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <article className="dlv22-receipt-center" role="dialog" aria-modal="true" aria-label="Struk transaksi digital">
      <header><div><small>STRUK DIGITAL · PRIVAT</small><h2>{order.environment==='sandbox'?'Bukti Sandbox':'Bukti transaksi'}</h2><p>Data lengkap hanya ditampilkan setelah kamu membuka Struk.</p></div><button onClick={onClose} aria-label="Tutup struk">×</button></header>
      <section className="dlv22-receipt-paper dlv22-print-receipt">
        <div className="dlv22-receipt-brand"><div><b>DLavie</b><span>DIGITAL MARKET</span></div><DigitalBrandIcon brand={order.brand} category={order.category}/></div>
        <div className="dlv22-receipt-state"><small>{order.environment==='sandbox'?'SANDBOX':'TRANSAKSI'}</small><strong>{digitalStatus(order.status)}</strong><code>{order.ref_id}</code></div>
        <div className="dlv22-receipt-product"><span>{order.brand}</span><b>{order.product_name}</b></div>
        <div className="dlv22-receipt-rows">{rows.filter(([k])=>!['Produk','Brand','Kategori'].includes(k)).map(([k,v])=><p key={k}><span>{k}</span><b>{v}</b></p>)}</div>
        {order.message&&<div className="dlv22-receipt-note">{order.message}</div>}
        <footer><b>DLavie Digital Market</b><span>Simpan Ref ID saat menghubungi bantuan. Struk ini bukan faktur pajak.</span></footer>
      </section>
      <div className="dlv22-receipt-actions"><button onClick={downloadPng}>↓ Simpan gambar</button><button onClick={printReceipt}>⌘ Cetak / Simpan PDF</button></div>
      <p className="dlv22-privacy-note">Perangkat dan browser tetap dapat mengambil screenshot. DLavie melindungi privasi dengan memask data sensitif di layar biasa dan hanya menampilkan versi lengkap lewat Struk.</p>
    </article>
  </div>
}
