import { useMemo, type ReactNode } from 'react'
import DigitalBrandIcon from './DigitalBrandIcon'
import { digitalStatus, money, when, type DigitalOrder } from './digital-market-api'

const safeFile=(v='')=>v.replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,80)

function receiptLines(order:DigitalOrder){
  return [
    ['Status',digitalStatus(order.status)],
    ['Ref ID',order.ref_id],
    ['Tanggal',when(order.created_at)],
    ['Tujuan',order.customer_no||'—'],
    ...(order.customer_name?[['Pelanggan',order.customer_name]]:[]),
    ...(order.period?[['Periode',order.period]]:[]),
    ['Environment',order.environment==='sandbox'?'Sandbox DLavie':'Production'],
    ...(order.serial_number?[['SN / TOKEN',order.serial_number]]:[]),
  ] as Array<[string,string]>
}

function wrap(ctx:CanvasRenderingContext2D,text:string,max:number){
  const words=text.split(/\s+/);const rows:string[]=[];let line=''
  for(const word of words){const n=line?`${line} ${word}`:word;if(ctx.measureText(n).width>max&&line){rows.push(line);line=word}else line=n}
  if(line)rows.push(line);return rows
}

type ReceiptIconName='close'|'download'|'print'|'shield'|'receipt'
function ReceiptIcon({name}:{name:ReceiptIconName}){
  const paths:Record<ReceiptIconName,ReactNode>={
    close:<><path d="m6 6 12 12M18 6 6 18"/></>,
    download:<><path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 19h14"/></>,
    print:<><path d="M7 8V3h10v5"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/><circle cx="18" cy="11" r=".6" fill="currentColor" stroke="none"/></>,
    shield:<><path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6z"/><path d="m9 12 2 2 4-4"/></>,
    receipt:<><path d="M6 3h12v18l-3-1.7-3 1.7-3-1.7L6 21z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
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
    const detailRows=rows.filter(([label])=>label!=='Status')
    const canvas=document.createElement('canvas')
    canvas.width=1080
    canvas.height=Math.max(1540,620+(detailRows.length*92)+(order.message?150:0))
    const ctx=canvas.getContext('2d');if(!ctx)return
    ctx.fillStyle='#f7f7f2';ctx.fillRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle='#0d1512';ctx.font='800 54px system-ui';ctx.fillText('DLavie',72,100)
    ctx.font='800 19px system-ui';ctx.fillStyle='#68736e';ctx.fillText('DIGITAL MARKET · STRUK PRIVAT',72,140)
    ctx.strokeStyle='#d5dad6';ctx.beginPath();ctx.moveTo(72,178);ctx.lineTo(1008,178);ctx.stroke()
    ctx.font='800 24px system-ui';ctx.fillStyle='#237a59';ctx.fillText(order.environment==='sandbox'?'SANDBOX DLAVIE':'TRANSAKSI DIGITAL',72,230)
    ctx.font='850 62px system-ui';ctx.fillStyle='#0d1512';ctx.fillText(digitalStatus(order.status),72,305)
    ctx.font='500 22px ui-monospace,monospace';ctx.fillStyle='#6e7773';ctx.fillText(order.ref_id,72,346)

    ctx.fillStyle='#edf1ed';ctx.beginPath();ctx.roundRect(72,390,936,166,26);ctx.fill()
    ctx.font='800 18px system-ui';ctx.fillStyle='#68736e';ctx.fillText((order.brand||'DIGITAL').toUpperCase(),104,435)
    ctx.font='800 31px system-ui';ctx.fillStyle='#111916';
    const productRows=wrap(ctx,order.product_name,800).slice(0,2)
    productRows.forEach((line,i)=>ctx.fillText(line,104,478+(i*37)))
    ctx.font='800 18px system-ui';ctx.fillStyle='#68736e';ctx.fillText('TOTAL',104,535)
    ctx.font='900 34px system-ui';ctx.fillStyle='#111916';ctx.textAlign='right';ctx.fillText(money.format(order.sell_price),972,535);ctx.textAlign='left'

    let y=625
    for(const [label,value] of detailRows){
      ctx.font='750 18px system-ui';ctx.fillStyle='#77827d';ctx.fillText(label.toUpperCase(),72,y)
      ctx.font='700 24px system-ui';ctx.fillStyle='#121916';ctx.textAlign='right'
      const lines=wrap(ctx,String(value),610)
      lines.slice(0,2).forEach((line,i)=>ctx.fillText(line,1008,y+(i*30)))
      ctx.textAlign='left';y+=Math.max(74,44+(Math.min(lines.length,2)*22))
      ctx.strokeStyle='#dde1de';ctx.beginPath();ctx.moveTo(72,y-20);ctx.lineTo(1008,y-20);ctx.stroke()
    }
    if(order.message){
      ctx.fillStyle='#e8eee9';ctx.beginPath();ctx.roundRect(72,y,936,104,22);ctx.fill()
      ctx.font='600 20px system-ui';ctx.fillStyle='#26342e'
      wrap(ctx,order.message,870).slice(0,3).forEach((line,i)=>ctx.fillText(line,104,y+39+(i*26)))
      y+=140
    }
    ctx.font='750 18px system-ui';ctx.fillStyle='#5f6b65';ctx.fillText('DLavie Digital Market',72,canvas.height-92)
    ctx.font='500 17px system-ui';ctx.fillStyle='#7a837f';ctx.fillText('Simpan Ref ID saat menghubungi bantuan. Struk ini bukan faktur pajak.',72,canvas.height-58)
    canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`DLavie-Struk-${safeFile(order.ref_id)}.png`;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1500)},'image/png',1)
  }

  const detailRows=rows.filter(([label])=>label!=='Status')
  const sandbox=order.environment==='sandbox'

  return <div className="dlv22-receipt-backdrop dlv28-receipt-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <article className="dlv22-receipt-center dlv28-receipt-center" role="dialog" aria-modal="true" aria-label="Struk transaksi digital">
      <header className="dlv28-receipt-header">
        <div><small><ReceiptIcon name="shield"/> STRUK PRIBADI</small><h2>{sandbox?'Struk Sandbox':'Struk transaksi'}</h2><p>Detail penuh hanya muncul di tampilan struk ini.</p></div>
        <button onClick={onClose} aria-label="Tutup struk"><ReceiptIcon name="close"/></button>
      </header>

      <section className="dlv22-receipt-paper dlv22-print-receipt dlv28-receipt-paper">
        <div className="dlv22-receipt-brand dlv28-receipt-brand">
          <div><b>DLavie</b><span>DIGITAL MARKET</span></div>
          <span className="dlv28-paper-mark"><ReceiptIcon name="receipt"/></span>
        </div>

        <div className="dlv28-receipt-status">
          <div><small>{sandbox?'SANDBOX DLAVIE':'TRANSAKSI DIGITAL'}</small><strong>{digitalStatus(order.status)}</strong><code>{order.ref_id}</code></div>
          <span className={`is-${String(order.status).toLowerCase()}`}>{digitalStatus(order.status)}</span>
        </div>

        <div className="dlv28-receipt-product-card">
          <DigitalBrandIcon brand={order.brand} category={order.category}/>
          <div><small>{order.brand||order.category}</small><b>{order.product_name}</b><em>{order.category}</em></div>
        </div>

        <div className="dlv28-receipt-total"><span>Total pembayaran</span><strong>{money.format(order.sell_price)}</strong></div>

        <div className="dlv22-receipt-rows dlv28-receipt-rows">{detailRows.map(([k,v])=><p key={k}><span>{k}</span><b>{v}</b></p>)}</div>
        {order.message&&<div className="dlv22-receipt-note dlv28-receipt-note">{order.message}</div>}
        <footer><b>DLavie Digital Market</b><span>Simpan Ref ID saat menghubungi bantuan. Struk ini bukan faktur pajak.</span></footer>
      </section>

      <div className="dlv22-receipt-actions dlv28-receipt-actions">
        <button onClick={downloadPng}><ReceiptIcon name="download"/><span><b>Simpan gambar</b><small>PNG untuk arsip pribadi</small></span></button>
        <button onClick={printReceipt}><ReceiptIcon name="print"/><span><b>Cetak / Simpan PDF</b><small>Gunakan dialog print perangkat</small></span></button>
      </div>
      <p className="dlv22-privacy-note dlv28-privacy-note"><ReceiptIcon name="shield"/> Data sensitif tetap dimask di layar biasa. Versi lengkap hanya dibuka ketika kamu memilih Struk.</p>
    </article>
  </div>
}
