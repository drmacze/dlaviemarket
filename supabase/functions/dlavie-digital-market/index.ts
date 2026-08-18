import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";

const ORIGIN="https://drmacze.github.io";
const cors=()=>({"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Max-Age":"86400","Vary":"Origin"});

async function readBody(req:Request){
  const t=(req.headers.get("content-type")||"").toLowerCase();
  if(t.includes("application/x-www-form-urlencoded"))return Object.fromEntries(new URLSearchParams(await req.text()).entries());
  return await req.json().catch(()=>({}));
}
function safe(v:unknown,n=300){return String(v??"").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,n)}
async function sha256(v:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("")}
async function hmac(secret:string,v:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const d=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(v));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("")}
function refId(){return `DLVDG-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().replaceAll("-","").slice(0,8).toUpperCase()}`}
function jakartaKey(v:Date|string=new Date()){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(v))}
function jakartaEndOfDay(){return new Date(`${jakartaKey()}T23:59:59+07:00`).toISOString()}
async function vault(db:any,name:string){const q=await db.rpc("dlavie_get_vault_secret",{p_name:name});if(q.error)throw q.error;return String(q.data||"")}
async function settings(db:any){const q=await db.from("dlavie_digiflazz_settings").select("*").eq("id",1).single();if(q.error)throw q.error;return q.data}
async function authWallet(db:any,token:string){if(!token)return null;const q=await db.from("dlavie_wallets").select("id,balance").eq("access_hash",await sha256(token)).maybeSingle();if(q.error)throw q.error;return q.data}
async function walletBalance(db:any,walletId:string){const q=await db.from("dlavie_wallets").select("balance").eq("id",walletId).maybeSingle();if(q.error)throw q.error;return Number(q.data?.balance||0)}
async function gateway(db:any,s:any,payload:Record<string,unknown>){
  if(!s.gateway_url)throw new Error("integration_not_ready");
  const [gw,user,key]=await Promise.all([vault(db,"dlavie_digiflazz_gateway_secret"),vault(db,"dlavie_digiflazz_username"),vault(db,"dlavie_digiflazz_api_key")]);
  if(!gw||!user||!key)throw new Error("integration_not_ready");
  const raw=JSON.stringify({...payload,username:user,api_key:key}),ts=String(Math.floor(Date.now()/1000)),sig=await hmac(gw,`${ts}\n${raw}`);
  const r=await fetch(String(s.gateway_url),{method:"POST",headers:{"content-type":"application/json","x-dlavie-timestamp":ts,"x-dlavie-signature":sig},body:raw});
  const d=await r.json().catch(()=>({}));
  return {http_ok:r.ok,http_status:r.status,...d};
}
function normalize(v:unknown){const s=String(v||"").toLowerCase();if(["sukses","success","successful"].includes(s))return"success";if(["gagal","failed","failure"].includes(s))return"failed";return"pending"}
function sell(base:number,s:any){const min=Math.max(0,Number(s.minimum_markup||0)),v=Number(s.markup_value||0),m=s.markup_mode==="percent"?Math.max(min,Math.round(base*v/100)):Math.max(min,Math.round(v));return Math.max(base,base+m)}
function supplierData(result:any){return result?.data||result?.response?.data||{}}
function postpaidSell(data:any,s:any){const cost=Math.max(0,Math.round(Number(data.price||0))),supplierSelling=Math.max(0,Math.round(Number(data.selling_price||0)));return Math.max(cost,supplierSelling,sell(cost,s))}

async function applySupplier(db:any,order:any,result:any,kind:"purchase"|"status"){
  const data=supplierData(result),normalized=normalize(data.status),now=new Date().toISOString();
  let balance:number|null=null;
  const patch:any={supplier_status:safe(data.status,50)||null,rc:safe(data.rc,50)||null,message:safe(data.message,600)||null,serial_number:safe(data.sn,500)||null,supplier_price:Number.isFinite(Number(data.price))?Math.round(Number(data.price)):null,buyer_last_saldo:Number.isFinite(Number(data.buyer_last_saldo))?Number(data.buyer_last_saldo):null,gateway_forwarded:result.forwarded!==false,raw_response:result,updated_at:now,last_checked_at:now};
  if(data.customer_name)patch.customer_name=safe(data.customer_name,220);
  if(data.periode!=null)patch.period=safe(Array.isArray(data.periode)?data.periode.join(", "):data.periode,240);
  if(data.desc!=null)patch.inquiry_detail=data.desc;
  if(kind==="purchase")patch.requested_at=now;else patch.last_status_check_at=now;
  if(normalized==="success"){patch.status="success";patch.completed_at=now}
  else if(normalized==="failed"){
    const rr=await db.rpc("dlavie_digital_refund_wallet",{p_wallet_id:order.wallet_id,p_ref_id:order.ref_id,p_amount:order.sell_price,p_reason:order.product_kind==="postpaid"?"digiflazz_postpaid_failed":"digiflazz_failed"});
    if(rr.error)throw rr.error;
    balance=Number(rr.data?.[0]?.balance??0);patch.status="refunded";patch.refunded_at=now;
  }else patch.status="pending";
  const uq=await db.from("dlavie_digital_orders").update(patch).eq("id",order.id).select("*").single();
  if(uq.error)throw uq.error;
  return{order:uq.data,balance};
}

async function history(db:any,wallet:any,userId:string){
  const q=await db.from("dlavie_digital_orders").select("ref_id,product_kind,sku,product_name,category,brand,product_type,customer_no,customer_name,period,sell_price,status,supplier_status,rc,message,serial_number,environment,created_at,updated_at,inquired_at,inquiry_valid_until,inquiry_admin,inquiry_price,inquiry_selling_price,inquiry_detail,completed_at,refunded_at").eq("wallet_id",wallet.id).eq("user_id",userId).order("created_at",{ascending:false}).limit(60);
  if(q.error)throw q.error;return q.data||[];
}

Deno.serve(withSupabase({auth:"none"},async(req,ctx)=>{
  const headers=cors();
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
  if(req.method!=="POST")return Response.json({error:"method_not_allowed"},{status:405,headers});
  try{
    const b:any=await readBody(req),action=safe(b.action,40),db=ctx.supabaseAdmin.schema("api");

    if(action==="summary"){
      const [sq,rq]=await Promise.all([settings(db),db.rpc("dlavie_digital_catalog_summary")]);
      if(rq.error)throw rq.error;
      return Response.json({ok:true,summary:rq.data||[],integration:{environment:sq.environment,enabled:sq.live_enabled,postpaid_enabled:sq.postpaid_enabled,catalog_count:sq.catalog_count,last_sync:sq.last_catalog_sync_at,status:sq.last_catalog_sync_status},legacy_nokos:true},{headers});
    }

    if(action==="products"){
      const category=safe(b.category,100),brand=safe(b.brand,100),kind=safe(b.kind,20)||"prepaid",q=safe(b.q,80).replace(/[%(),]/g," "),limit=Math.max(1,Math.min(120,Number(b.limit||60)));
      let query=db.from("dlavie_digital_products").select("sku,product_kind,product_name,category,brand,product_type,sell_price,admin_fee,commission,base_price,unlimited_stock,stock,multi,start_cut_off,end_cut_off,description,requires_extended_input,synced_at").eq("product_kind",kind).eq("buyer_product_status",true).eq("seller_product_status",true).order(kind==="prepaid"?"sell_price":"brand",{ascending:true}).limit(limit);
      if(category)query=query.eq("category",category);if(brand)query=query.eq("brand",brand);if(q)query=query.or(`product_name.ilike.%${q}%,brand.ilike.%${q}%,product_type.ilike.%${q}%`);
      const pq=await query;if(pq.error)throw pq.error;
      return Response.json({ok:true,products:(pq.data||[]).filter((x:any)=>kind==="postpaid"||x.unlimited_stock||Number(x.stock)>0)},{headers});
    }

    const token=safe(b.wallet_token,180),userId=safe(b.user_id,80),wallet=await authWallet(db,token);
    if(!wallet||!userId)return Response.json({error:"auth_required"},{status:401,headers});
    if(action==="history")return Response.json({ok:true,orders:await history(db,wallet,userId),balance:Number(wallet.balance||0)},{headers});

    if(action==="purchase"){
      const s=await settings(db);
      if(!s.live_enabled)return Response.json({error:"digital_market_disabled",message:"Transaksi produk digital belum diaktifkan admin."},{status:409,headers});
      if(!s.gateway_url)return Response.json({error:"integration_not_ready"},{status:503,headers});
      const sku=safe(b.sku,120),customer=safe(b.customer_no,100);
      if(!sku||customer.length<3)return Response.json({error:"invalid_target"},{status:400,headers});
      const pq=await db.from("dlavie_digital_products").select("*").eq("sku",sku).eq("buyer_product_status",true).eq("seller_product_status",true).maybeSingle();
      if(pq.error)throw pq.error;const p:any=pq.data;
      if(!p||(!p.unlimited_stock&&Number(p.stock)<=0))return Response.json({error:"product_unavailable"},{status:409,headers});
      if(p.product_kind!=="prepaid")return Response.json({error:"inquiry_required"},{status:409,headers});
      const ref=refId(),now=new Date().toISOString();
      const iq=await db.from("dlavie_digital_orders").insert({ref_id:ref,wallet_id:wallet.id,user_id:userId,product_kind:p.product_kind,sku:p.sku,product_name:p.product_name,category:p.category,brand:p.brand,product_type:p.product_type,customer_no:customer,base_price:p.base_price,sell_price:p.sell_price,status:"created",environment:s.environment,created_at:now,updated_at:now}).select("*").single();
      if(iq.error)throw iq.error;let order:any=iq.data;
      const rr=await db.rpc("dlavie_digital_reserve_wallet",{p_wallet_id:wallet.id,p_ref_id:ref,p_amount:Number(p.sell_price)});
      if(rr.error){await db.from("dlavie_digital_orders").update({status:"failed",message:String(rr.error.message||"reserve_failed"),updated_at:new Date().toISOString()}).eq("id",order.id);if(String(rr.error.message||"").includes("insufficient_balance"))return Response.json({error:"insufficient_balance"},{status:409,headers});throw rr.error}
      const reservedBalance=Number(rr.data?.[0]?.balance??0),reserved=rr.data?.[0]?.reserved!==false;
      if(!reserved){const current=await db.from("dlavie_digital_orders").select("*").eq("id",order.id).single();return Response.json({ok:true,duplicate:true,order:current.data,balance:reservedBalance},{headers})}
      const rsv=await db.from("dlavie_digital_orders").update({status:"reserved",updated_at:new Date().toISOString()}).eq("id",order.id).select("*").single();if(rsv.error)throw rsv.error;order=rsv.data;
      try{
        const result=await gateway(db,s,{op:"transaction",buyer_sku_code:p.sku,customer_no:customer,ref_id:ref,testing:s.environment==="testing",max_price:Number(p.base_price)});
        if(result.http_ok===false&&result.forwarded===false){
          const rf=await db.rpc("dlavie_digital_refund_wallet",{p_wallet_id:wallet.id,p_ref_id:ref,p_amount:Number(p.sell_price),p_reason:"gateway_rejected_before_forward"});
          const bal=Number(rf.data?.[0]?.balance??reservedBalance);
          const uq=await db.from("dlavie_digital_orders").update({status:"refunded",message:safe(result.error||"Gateway menolak request sebelum diteruskan.",600),gateway_forwarded:false,raw_response:result,refunded_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",order.id).select("*").single();
          return Response.json({ok:false,error:"supplier_not_called",order:uq.data,balance:bal},{status:502,headers});
        }
        const applied=await applySupplier(db,order,result,"purchase");return Response.json({ok:true,order:applied.order,balance:applied.balance??reservedBalance},{headers});
      }catch(e){
        const msg=e instanceof Error?e.message:"gateway_unknown";
        const uq=await db.from("dlavie_digital_orders").update({status:"pending",message:`Status supplier belum dapat dipastikan: ${msg}`,gateway_forwarded:null,updated_at:new Date().toISOString()}).eq("id",order.id).select("*").single();
        return Response.json({ok:true,uncertain:true,order:uq.data,balance:reservedBalance},{headers});
      }
    }

    if(action==="inquiry_postpaid"){
      const s=await settings(db);
      if(!s.live_enabled||!s.postpaid_enabled)return Response.json({error:"postpaid_disabled"},{status:409,headers});
      const sku=safe(b.sku,120),customer=safe(b.customer_no,100);
      if(!sku||customer.length<3)return Response.json({error:"invalid_target"},{status:400,headers});
      const pq=await db.from("dlavie_digital_products").select("*").eq("sku",sku).eq("product_kind","postpaid").eq("buyer_product_status",true).eq("seller_product_status",true).maybeSingle();
      if(pq.error)throw pq.error;const p:any=pq.data;
      if(!p)return Response.json({error:"product_unavailable"},{status:409,headers});
      if(p.requires_extended_input)return Response.json({error:"extended_input_required",message:"Produk ini memerlukan data tambahan khusus dan belum dibuka pada flow standar."},{status:409,headers});
      const ref=refId(),now=new Date().toISOString();
      const iq=await db.from("dlavie_digital_orders").insert({ref_id:ref,wallet_id:wallet.id,user_id:userId,product_kind:"postpaid",sku:p.sku,product_name:p.product_name,category:p.category,brand:p.brand,product_type:p.product_type,customer_no:customer,base_price:0,sell_price:0,status:"created",environment:s.environment,created_at:now,updated_at:now}).select("*").single();
      if(iq.error)throw iq.error;const order:any=iq.data;
      const result=await gateway(db,s,{op:"transaction",commands:"inq-pasca",buyer_sku_code:p.sku,customer_no:customer,ref_id:ref,testing:s.environment==="testing"});
      const data=supplierData(result),normalized=normalize(data.status);
      if(normalized!=="success"){
        const uq=await db.from("dlavie_digital_orders").update({status:"failed",supplier_status:safe(data.status,50)||null,rc:safe(data.rc,50)||null,message:safe(data.message||"Inquiry tagihan gagal.",600),raw_response:result,gateway_forwarded:result.forwarded!==false,updated_at:new Date().toISOString()}).eq("id",order.id).select("*").single();
        return Response.json({ok:false,error:"inquiry_failed",message:uq.data?.message||"Tagihan tidak ditemukan.",order:uq.data},{status:409,headers});
      }
      const cost=Math.max(0,Math.round(Number(data.price||0))),total=postpaidSell(data,s);
      if(total<=0)return Response.json({error:"invalid_inquiry_amount"},{status:502,headers});
      const patch={status:"inquired",customer_name:safe(data.customer_name,220)||null,period:safe(Array.isArray(data.periode)?data.periode.join(", "):data.periode,240)||null,base_price:cost,sell_price:total,inquiry_admin:Number.isFinite(Number(data.admin))?Math.round(Number(data.admin)):null,inquiry_price:cost,inquiry_selling_price:Number.isFinite(Number(data.selling_price))?Math.round(Number(data.selling_price)):null,inquiry_detail:data.desc||{},inquired_at:new Date().toISOString(),inquiry_valid_until:jakartaEndOfDay(),supplier_status:safe(data.status,50)||null,rc:safe(data.rc,50)||null,message:safe(data.message,600)||null,buyer_last_saldo:Number.isFinite(Number(data.buyer_last_saldo))?Number(data.buyer_last_saldo):null,raw_response:result,gateway_forwarded:result.forwarded!==false,updated_at:new Date().toISOString()};
      const uq=await db.from("dlavie_digital_orders").update(patch).eq("id",order.id).select("*").single();if(uq.error)throw uq.error;
      return Response.json({ok:true,order:uq.data,balance:Number(wallet.balance||0)},{headers});
    }

    if(action==="pay_postpaid"){
      const ref=safe(b.ref_id,120),oq=await db.from("dlavie_digital_orders").select("*").eq("ref_id",ref).eq("wallet_id",wallet.id).eq("user_id",userId).eq("product_kind","postpaid").maybeSingle();
      if(oq.error)throw oq.error;let order:any=oq.data;
      if(!order)return Response.json({error:"order_not_found"},{status:404,headers});
      if(order.status!=="inquired")return Response.json({error:"postpaid_not_payable",message:"Tagihan ini sudah diproses atau tidak lagi dapat dibayar."},{status:409,headers});
      if(!order.inquired_at||jakartaKey(order.inquired_at)!==jakartaKey())return Response.json({error:"inquiry_expired",message:"Tagihan harus dicek ulang karena pembayaran wajib dilakukan pada tanggal inquiry yang sama."},{status:409,headers});
      if(Number(order.sell_price)<=0)return Response.json({error:"invalid_inquiry_amount"},{status:409,headers});
      const rr=await db.rpc("dlavie_digital_reserve_wallet",{p_wallet_id:wallet.id,p_ref_id:ref,p_amount:Number(order.sell_price)});
      if(rr.error){if(String(rr.error.message||"").includes("insufficient_balance"))return Response.json({error:"insufficient_balance"},{status:409,headers});throw rr.error}
      const reservedBalance=Number(rr.data?.[0]?.balance??0),reserved=rr.data?.[0]?.reserved!==false;
      if(!reserved){
        const repair=await db.from("dlavie_digital_orders").update({status:"reserved",requested_at:order.requested_at||new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",order.id).eq("status","inquired").select("*").maybeSingle();
        if(repair.error)throw repair.error;
        const current=repair.data||((await db.from("dlavie_digital_orders").select("*").eq("id",order.id).single()).data);
        return Response.json({ok:true,duplicate:true,order:current,balance:reservedBalance},{headers});
      }
      const rsv=await db.from("dlavie_digital_orders").update({status:"reserved",requested_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",order.id).eq("status","inquired").select("*").maybeSingle();
      if(rsv.error)throw rsv.error;
      if(!rsv.data){const current=await db.from("dlavie_digital_orders").select("*").eq("id",order.id).single();return Response.json({ok:true,duplicate:true,order:current.data,balance:reservedBalance},{headers})}
      order=rsv.data;const s=await settings(db);
      try{
        const result=await gateway(db,s,{op:"transaction",commands:"pay-pasca",buyer_sku_code:order.sku,customer_no:order.customer_no,ref_id:order.ref_id,testing:order.environment==="testing"});
        if(result.http_ok===false&&result.forwarded===false){
          const rf=await db.rpc("dlavie_digital_refund_wallet",{p_wallet_id:wallet.id,p_ref_id:ref,p_amount:Number(order.sell_price),p_reason:"postpaid_gateway_rejected_before_forward"});
          const bal=Number(rf.data?.[0]?.balance??reservedBalance);
          const uq=await db.from("dlavie_digital_orders").update({status:"refunded",message:safe(result.error||"Gateway menolak pembayaran sebelum diteruskan.",600),gateway_forwarded:false,raw_response:result,refunded_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",order.id).select("*").single();
          return Response.json({ok:false,error:"supplier_not_called",order:uq.data,balance:bal},{status:502,headers});
        }
        const applied=await applySupplier(db,order,result,"purchase");return Response.json({ok:true,order:applied.order,balance:applied.balance??reservedBalance},{headers});
      }catch(e){
        const msg=e instanceof Error?e.message:"gateway_unknown";
        const uq=await db.from("dlavie_digital_orders").update({status:"pending",message:`Status pembayaran belum dapat dipastikan: ${msg}`,gateway_forwarded:null,updated_at:new Date().toISOString()}).eq("id",order.id).select("*").single();
        return Response.json({ok:true,uncertain:true,order:uq.data,balance:reservedBalance},{headers});
      }
    }

    if(action==="status"){
      const ref=safe(b.ref_id,120),oq=await db.from("dlavie_digital_orders").select("*").eq("ref_id",ref).eq("wallet_id",wallet.id).eq("user_id",userId).maybeSingle();
      if(oq.error)throw oq.error;const order:any=oq.data;
      if(!order)return Response.json({error:"order_not_found"},{status:404,headers});
      if(["success","refunded","failed","inquired"].includes(order.status))return Response.json({ok:true,order,balance:Number(wallet.balance||0)},{headers});
      if(order.status==="created")return Response.json({error:"order_not_reserved",message:"Order belum memiliki reservasi saldo dan tidak boleh diteruskan ke supplier."},{status:409,headers});
      if(!["reserved","pending"].includes(order.status))return Response.json({error:"status_not_checkable"},{status:409,headers});
      const lq=await db.from("dlavie_wallet_ledger").select("id").eq("wallet_id",wallet.id).eq("idempotency_key",`digital:debit:${order.ref_id}`).maybeSingle();
      if(lq.error)throw lq.error;if(!lq.data)return Response.json({error:"wallet_reservation_missing",message:"Reservasi saldo order tidak ditemukan; supplier tidak akan dipanggil."},{status:409,headers});
      if(order.last_status_check_at&&Date.now()-new Date(order.last_status_check_at).getTime()<55000)return Response.json({error:"status_cooldown",message:"Tunggu sekitar 1 menit sebelum cek ulang."},{status:429,headers});
      const s=await settings(db),payload:any={op:"transaction",buyer_sku_code:order.sku,customer_no:order.customer_no,ref_id:order.ref_id,testing:order.environment==="testing"};
      if(order.product_kind==="postpaid")payload.commands="status-pasca";else payload.max_price=Number(order.base_price);
      const result=await gateway(db,s,payload),applied=await applySupplier(db,order,result,"status"),bal=applied.balance??await walletBalance(db,wallet.id);
      return Response.json({ok:true,order:applied.order,balance:bal},{headers});
    }

    return Response.json({error:"invalid_action"},{status:400,headers});
  }catch(e){
    console.error("dlavie-digital-market",e);const m=e instanceof Error?e.message:"digital_market_error",code=m==="integration_not_ready"?503:500;
    return Response.json({error:m==="integration_not_ready"?"integration_not_ready":"digital_market_error",message:m},{status:code,headers:cors()});
  }
}));
