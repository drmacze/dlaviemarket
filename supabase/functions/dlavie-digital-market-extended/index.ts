import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";

const ORIGIN="https://drmacze.github.io";
const cors=()=>({"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Max-Age":"86400","Vary":"Origin"});
async function readBody(req:Request){const t=(req.headers.get("content-type")||"").toLowerCase();if(t.includes("application/x-www-form-urlencoded"))return Object.fromEntries(new URLSearchParams(await req.text()).entries());return await req.json().catch(()=>({}))}
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
async function gateway(db:any,s:any,payload:Record<string,unknown>){if(!s.gateway_url)throw new Error("integration_not_ready");const [gw,user,key]=await Promise.all([vault(db,"dlavie_digiflazz_gateway_secret"),vault(db,"dlavie_digiflazz_username"),vault(db,"dlavie_digiflazz_api_key")]);if(!gw||!user||!key)throw new Error("integration_not_ready");const raw=JSON.stringify({...payload,username:user,api_key:key}),ts=String(Math.floor(Date.now()/1000)),sig=await hmac(gw,`${ts}\n${raw}`);const r=await fetch(String(s.gateway_url),{method:"POST",headers:{"content-type":"application/json","x-dlavie-timestamp":ts,"x-dlavie-signature":sig},body:raw});const d=await r.json().catch(()=>({}));return {http_ok:r.ok,http_status:r.status,...d}}
function normalize(v:unknown){const s=String(v||"").toLowerCase();if(["sukses","success","successful"].includes(s))return"success";if(["gagal","failed","failure"].includes(s))return"failed";return"pending"}
function supplierData(result:any){return result?.data||result?.response?.data||{}}
function sell(base:number,s:any){const min=Math.max(0,Number(s.minimum_markup||0)),v=Number(s.markup_value||0),m=s.markup_mode==="percent"?Math.max(min,Math.round(base*v/100)):Math.max(min,Math.round(v));return Math.max(base,base+m)}
function postpaidSell(data:any,s:any){const cost=Math.max(0,Math.round(Number(data.price||0))),supplierSelling=Math.max(0,Math.round(Number(data.selling_price||0)));return Math.max(cost,supplierSelling,sell(cost,s))}
function extendedType(p:any){const x=`${p.category||""} ${p.brand||""} ${p.product_name||""} ${p.sku||""}`.toLowerCase();if(x.includes("samsat"))return"samsat";if(x.includes("e-money")||x.includes("emoney"))return"emoney";if(x.includes("pbb"))return"pbb";return"unknown"}
async function claimOrder(db:any,input:Record<string,unknown>){const q=await db.rpc("dlavie_digital_claim_order",input);if(q.error)throw q.error;const claim=q.data?.[0];if(!claim?.order_id)throw new Error("order_claim_failed");const oq=await db.from("dlavie_digital_orders").select("*").eq("id",claim.order_id).single();if(oq.error)throw oq.error;return{order:oq.data,created:claim.created!==false}}

Deno.serve(withSupabase({auth:"none"},async(req,ctx)=>{
 const headers=cors();if(req.method==="OPTIONS")return new Response(null,{status:204,headers});if(req.method!=="POST")return Response.json({error:"method_not_allowed"},{status:405,headers});
 try{
  const b:any=await readBody(req),action=safe(b.action,40),db=ctx.supabaseAdmin.schema("api");
  if(action!=="inquiry")return Response.json({error:"invalid_action"},{status:400,headers});
  const token=safe(b.wallet_token,180),userId=safe(b.user_id,80),wallet=await authWallet(db,token);if(!wallet||!userId)return Response.json({error:"auth_required"},{status:401,headers});
  const s=await settings(db);if(!s.live_enabled||!s.postpaid_enabled)return Response.json({error:"postpaid_disabled"},{status:409,headers});if(!s.gateway_url)return Response.json({error:"integration_not_ready"},{status:503,headers});
  const sku=safe(b.sku,120);let customer=safe(b.customer_no,180);if(!sku||customer.length<3)return Response.json({error:"invalid_target"},{status:400,headers});
  const pq=await db.from("dlavie_digital_products").select("*").eq("sku",sku).eq("product_kind","postpaid").eq("buyer_product_status",true).eq("seller_product_status",true).maybeSingle();if(pq.error)throw pq.error;const p:any=pq.data;if(!p)return Response.json({error:"product_unavailable"},{status:409,headers});
  const type=extendedType(p);if(!p.requires_extended_input||type==="unknown")return Response.json({error:"extended_input_not_applicable"},{status:409,headers});
  const payload:any={op:"transaction",commands:"inq-pasca",buyer_sku_code:p.sku,customer_no:customer,testing:s.environment==="testing"};
  if(type==="emoney"){
   const amount=Math.round(Number(b.amount||0));if(!Number.isFinite(amount)||amount<1000||amount>100000000)return Response.json({error:"invalid_amount",message:"Nominal E-Money tidak valid."},{status:400,headers});payload.amount=amount;
  }
  if(type==="pbb"){
   const rawYear=safe(b.year,8);if(rawYear){const year=Number(rawYear);if(!Number.isInteger(year)||year<2000||year>2100)return Response.json({error:"invalid_year",message:"Tahun pajak tidak valid."},{status:400,headers});payload.year=year}
  }
  if(type==="samsat"){
   const parts=customer.split(",").map((x:string)=>x.trim()).filter(Boolean);if(parts.length!==2||parts.some((x:string)=>x.length<4))return Response.json({error:"invalid_samsat_target",message:"SAMSAT membutuhkan kode pembayaran dan nomor identitas."},{status:400,headers});customer=`${parts[0]},${parts[1]}`;payload.customer_no=customer;
  }
  const claim=await claimOrder(db,{p_wallet_id:wallet.id,p_user_id:userId,p_product_kind:"postpaid",p_sku:p.sku,p_product_name:p.product_name,p_category:p.category,p_brand:p.brand,p_product_type:p.product_type||"",p_customer_no:customer,p_base_price:0,p_sell_price:0,p_environment:s.environment,p_ref_id:refId(),p_dedupe_seconds:30});const order:any=claim.order,ref=String(order.ref_id);if(!claim.created)return Response.json({ok:true,duplicate:true,order,balance:await walletBalance(db,wallet.id)},{headers});
  payload.ref_id=ref;
  const result=await gateway(db,s,payload),data=supplierData(result),normalized=normalize(data.status);
  if(normalized!=="success"){
   const uq=await db.from("dlavie_digital_orders").update({status:"failed",supplier_status:safe(data.status,50)||null,rc:safe(data.rc,50)||null,message:safe(data.message||"Inquiry tagihan gagal.",600),raw_response:{...result,extended_input:type},gateway_forwarded:result.forwarded!==false,updated_at:new Date().toISOString()}).eq("id",order.id).select("*").single();
   return Response.json({ok:false,error:"inquiry_failed",message:uq.data?.message||"Tagihan tidak ditemukan.",order:uq.data},{status:409,headers});
  }
  const cost=Math.max(0,Math.round(Number(data.price||0))),total=postpaidSell(data,s);if(total<=0)return Response.json({error:"invalid_inquiry_amount"},{status:502,headers});
  const detail=(data.desc&&typeof data.desc==="object")?{...data.desc,_dlavie_extended_type:type,...(type==="emoney"?{_dlavie_amount:payload.amount}:{}),...(type==="pbb"&&payload.year?{_dlavie_year:payload.year}:{})}:data.desc||{};
  const patch={status:"inquired",customer_name:safe(data.customer_name,220)||null,period:safe(Array.isArray(data.periode)?data.periode.join(", "):data.periode,240)||null,base_price:cost,sell_price:total,inquiry_admin:Number.isFinite(Number(data.admin))?Math.round(Number(data.admin)):null,inquiry_price:cost,inquiry_selling_price:Number.isFinite(Number(data.selling_price))?Math.round(Number(data.selling_price)):null,inquiry_detail:detail,inquired_at:new Date().toISOString(),inquiry_valid_until:jakartaEndOfDay(),supplier_status:safe(data.status,50)||null,rc:safe(data.rc,50)||null,message:safe(data.message,600)||null,buyer_last_saldo:Number.isFinite(Number(data.buyer_last_saldo))?Number(data.buyer_last_saldo):null,raw_response:{...result,extended_input:type},gateway_forwarded:result.forwarded!==false,updated_at:new Date().toISOString()};
  const uq=await db.from("dlavie_digital_orders").update(patch).eq("id",order.id).select("*").single();if(uq.error)throw uq.error;return Response.json({ok:true,order:uq.data,balance:await walletBalance(db,wallet.id)},{headers});
 }catch(e){console.error("dlavie-digital-market-extended",e);const m=e instanceof Error?e.message:"extended_market_error",status=m==="integration_not_ready"?503:500;return Response.json({error:m,message:m},{status,headers:cors()})}
}));
