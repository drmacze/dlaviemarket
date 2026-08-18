import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";

const ORIGIN="https://drmacze.github.io";
const cors=()=>({"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Max-Age":"86400","Vary":"Origin"});
async function readBody(req:Request){const t=(req.headers.get("content-type")||"").toLowerCase();if(t.includes("application/x-www-form-urlencoded"))return Object.fromEntries(new URLSearchParams(await req.text()).entries());return await req.json().catch(()=>({}))}
function safe(v:unknown,n=600){return String(v??"").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,n)}
async function sha256(v:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("")}
async function hmac(secret:string,v:string){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const d=await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(v));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("")}
async function vault(db:any,name:string){const q=await db.rpc("dlavie_get_vault_secret",{p_name:name});if(q.error)throw q.error;return String(q.data||"")}
async function auth(db:any,token:string){if(!token)return null;const q=await db.from("dlavie_assistant_admin_sessions").select("admin_name,expires_at").eq("token_hash",await sha256(token)).maybeSingle();if(q.error)throw q.error;if(!q.data||new Date(q.data.expires_at).getTime()<=Date.now())return null;return q.data}
async function settings(db:any){const q=await db.from("dlavie_digiflazz_settings").select("*").eq("id",1).single();if(q.error)throw q.error;return q.data}
async function gateway(db:any,s:any,payload:Record<string,unknown>){const [gw,user,key]=await Promise.all([vault(db,"dlavie_digiflazz_gateway_secret"),vault(db,"dlavie_digiflazz_username"),vault(db,"dlavie_digiflazz_api_key")]);if(!s.gateway_url||!gw||!user||!key)throw new Error("integration_not_ready");const raw=JSON.stringify({...payload,username:user,api_key:key}),ts=String(Math.floor(Date.now()/1000)),sig=await hmac(gw,`${ts}\n${raw}`);const r=await fetch(String(s.gateway_url),{method:"POST",headers:{"content-type":"application/json","x-dlavie-timestamp":ts,"x-dlavie-signature":sig},body:raw});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.message||d.error||`gateway_http_${r.status}`);return d}
function supplierData(result:any){return result?.data||result?.response?.data||{}}
function normalize(v:unknown){const s=String(v||"").toLowerCase();if(["sukses","success","successful"].includes(s))return"success";if(["gagal","failed","failure"].includes(s))return"failed";return"pending"}
const TERMINAL=new Set(["success","failed","refunded","inquired"]);
const ageMs=(v:unknown)=>Math.max(0,Date.now()-new Date(String(v||0)).getTime());

async function hasDebit(db:any,order:any){const q=await db.from("dlavie_wallet_ledger").select("id").eq("wallet_id",order.wallet_id).eq("idempotency_key",`digital:debit:${order.ref_id}`).maybeSingle();if(q.error)throw q.error;return !!q.data}
async function touchManual(db:any,order:any,note:string){const q=await db.from("dlavie_digital_orders").update({reconciliation_attempts:Number(order.reconciliation_attempts||0)+1,last_reconciled_at:new Date().toISOString(),reconciliation_note:note,updated_at:new Date().toISOString()}).eq("id",order.id).select("*").single();if(q.error)throw q.error;return q.data}

async function reconcileOne(db:any,s:any,order:any){
  if(TERMINAL.has(order.status))return {ok:true,skipped:true,reason:"terminal",order};
  const now=new Date().toISOString();
  if(ageMs(order.created_at)>89*24*60*60*1000){const updated=await touchManual(db,order,"Melewati batas aman 89 hari; status supplier tidak dipanggil otomatis.");return {ok:false,manual_review:true,reason:"status_window_expired",order:updated}}

  const debit=await hasDebit(db,order);
  if(order.status==="created"){
    if(ageMs(order.created_at)<120000)return {ok:true,skipped:true,reason:"created_too_fresh",order};
    if(!debit&&order.gateway_forwarded!==true){const q=await db.from("dlavie_digital_orders").update({status:"failed",message:"Order tidak pernah mereservasi Wallet; supplier tidak dipanggil.",gateway_forwarded:false,reconciliation_attempts:Number(order.reconciliation_attempts||0)+1,last_reconciled_at:now,reconciliation_note:"Orphan created order ditutup aman tanpa debit Wallet.",updated_at:now}).eq("id",order.id).eq("status","created").select("*").maybeSingle();if(q.error)throw q.error;return {ok:true,repaired:true,reason:"orphan_closed",order:q.data||order}}
    if(!debit){const updated=await touchManual(db,order,"Gateway pernah terindikasi diteruskan tetapi debit Wallet tidak ditemukan; perlu pemeriksaan manual.");return {ok:false,manual_review:true,reason:"forwarded_without_debit",order:updated}}
    const q=await db.from("dlavie_digital_orders").update({status:"reserved",reconciliation_note:"Reservasi Wallet ditemukan; order dipulihkan dari created ke reserved.",updated_at:now}).eq("id",order.id).eq("status","created").select("*").maybeSingle();if(q.error)throw q.error;order=q.data||order;
  }

  if(!["reserved","pending"].includes(order.status))return {ok:true,skipped:true,reason:"not_reconcilable",order};
  if(!debit){const updated=await touchManual(db,order,"Status reserved/pending tanpa debit Wallet; supplier tidak dipanggil otomatis.");return {ok:false,manual_review:true,reason:"wallet_reservation_missing",order:updated}}
  if(order.last_status_check_at&&ageMs(order.last_status_check_at)<60000)return {ok:true,skipped:true,reason:"cooldown",order};

  const payload:any={op:"transaction",buyer_sku_code:order.sku,customer_no:order.customer_no,ref_id:order.ref_id,testing:order.environment==="testing"};
  if(order.product_kind==="postpaid")payload.commands="status-pasca";else payload.max_price=Number(order.base_price);
  const result=await gateway(db,s,payload),data=supplierData(result),state=normalize(data.status);
  let balance:null|number=null;
  const patch:any={supplier_status:safe(data.status,50)||null,rc:safe(data.rc,50)||null,message:safe(data.message,600)||order.message||null,serial_number:safe(data.sn,600)||order.serial_number||null,supplier_price:Number.isFinite(Number(data.price))?Math.round(Number(data.price)):order.supplier_price,buyer_last_saldo:Number.isFinite(Number(data.buyer_last_saldo))?Number(data.buyer_last_saldo):order.buyer_last_saldo,raw_response:result,gateway_forwarded:result.forwarded!==false,last_checked_at:now,last_status_check_at:now,last_reconciled_at:now,reconciliation_attempts:Number(order.reconciliation_attempts||0)+1,reconciliation_note:`Reconcile supplier: ${state}.`,updated_at:now};
  if(data.customer_name)patch.customer_name=safe(data.customer_name,220);if(data.periode!=null)patch.period=safe(Array.isArray(data.periode)?data.periode.join(", "):data.periode,240);if(data.desc!=null)patch.inquiry_detail=data.desc;
  if(state==="success"){patch.status="success";patch.completed_at=now;patch.reconciliation_note="Supplier mengonfirmasi transaksi sukses."}
  else if(state==="failed"){
    const rr=await db.rpc("dlavie_digital_refund_wallet",{p_wallet_id:order.wallet_id,p_ref_id:order.ref_id,p_amount:Number(order.sell_price),p_reason:order.product_kind==="postpaid"?"digiflazz_postpaid_reconcile_failed":"digiflazz_reconcile_failed"});if(rr.error)throw rr.error;balance=Number(rr.data?.[0]?.balance??0);patch.status="refunded";patch.refunded_at=now;patch.reconciliation_note=rr.data?.[0]?.refunded===false?"Supplier gagal; refund sebelumnya sudah tercatat.":"Supplier gagal; Wallet direfund secara idempotent.";
  }else{patch.status="pending";patch.reconciliation_note="Supplier masih pending; tunggu webhook atau reconcile setelah cooldown."}
  const uq=await db.from("dlavie_digital_orders").update(patch).eq("id",order.id).select("*").single();if(uq.error)throw uq.error;return {ok:true,reconciled:true,state,order:uq.data,balance};
}

async function queue(db:any){const q=await db.from("dlavie_digital_orders").select("id,ref_id,wallet_id,user_id,product_kind,sku,product_name,customer_no,sell_price,base_price,status,message,environment,gateway_forwarded,created_at,updated_at,last_status_check_at,last_reconciled_at,reconciliation_attempts,reconciliation_note,supplier_status,rc,serial_number,supplier_price,buyer_last_saldo").in("status",["created","reserved","pending"]).order("updated_at",{ascending:true}).limit(60);if(q.error)throw q.error;const rows=q.data||[],now=Date.now();return {orders:rows.map((o:any)=>({...o,needs_action:o.status==="created"?now-new Date(o.created_at).getTime()>=120000:now-new Date(o.updated_at).getTime()>=65000})),summary:{total:rows.length,created:rows.filter((x:any)=>x.status==="created").length,reserved:rows.filter((x:any)=>x.status==="reserved").length,pending:rows.filter((x:any)=>x.status==="pending").length,needs_action:rows.filter((o:any)=>o.status==="created"?now-new Date(o.created_at).getTime()>=120000:now-new Date(o.updated_at).getTime()>=65000).length}}}

Deno.serve(withSupabase({auth:"none"},async(req,ctx)=>{
  const headers=cors();if(req.method==="OPTIONS")return new Response(null,{status:204,headers});if(req.method!=="POST")return Response.json({error:"method_not_allowed"},{status:405,headers});
  try{
    const b:any=await readBody(req),db=ctx.supabaseAdmin.schema("api"),admin=await auth(db,safe(b.admin_token,180));if(!admin)return Response.json({error:"admin_auth_required"},{status:401,headers});
    const action=safe(b.action,40),s=await settings(db);
    if(action==="queue")return Response.json({ok:true,...await queue(db)},{headers});
    if(action==="reconcile"){
      const ref=safe(b.ref_id,120);if(!ref)return Response.json({error:"ref_id_required"},{status:400,headers});const oq=await db.from("dlavie_digital_orders").select("*").eq("ref_id",ref).maybeSingle();if(oq.error)throw oq.error;if(!oq.data)return Response.json({error:"order_not_found"},{status:404,headers});const result=await reconcileOne(db,s,oq.data);return Response.json({ok:true,result,queue:await queue(db)},{headers});
    }
    if(action==="reconcile_stale"){
      const cutoff=new Date(Date.now()-65000).toISOString(),q=await db.from("dlavie_digital_orders").select("*").in("status",["created","reserved","pending"]).lt("updated_at",cutoff).order("updated_at",{ascending:true}).limit(12);if(q.error)throw q.error;const results=[] as any[];for(const order of q.data||[]){try{results.push(await reconcileOne(db,s,order))}catch(e){results.push({ok:false,ref_id:order.ref_id,error:e instanceof Error?e.message:"reconcile_failed"})}}return Response.json({ok:true,results,queue:await queue(db)},{headers});
    }
    return Response.json({error:"invalid_action"},{status:400,headers});
  }catch(e){console.error("dlavie-digiflazz-reconcile",e);const msg=e instanceof Error?e.message:"reconcile_error";return Response.json({error:msg,message:msg},{status:msg==="integration_not_ready"?503:500,headers:cors()})}
}));
