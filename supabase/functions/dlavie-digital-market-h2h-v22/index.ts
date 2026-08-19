import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";

const ORIGIN="https://drmacze.github.io";
const UPSTREAM="https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-digital-market-h2h";
const POLICY_VERSION="2026-08-20-digital-v1";
const cors=()=>({"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Max-Age":"86400","Vary":"Origin"});
const safe=(v:unknown,n=500)=>String(v??"").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,n);
async function sha256(v:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("");}

Deno.serve(withSupabase({auth:"none"},async(req,ctx)=>{
 const headers=cors();
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return Response.json({error:"method_not_allowed"},{status:405,headers});
 try{
  const raw=await req.text();
  const body=Object.fromEntries(new URLSearchParams(raw).entries()) as Record<string,string>;
  const action=safe(body.action,40);
  const db=ctx.supabaseAdmin.schema("api");
  if(action==="purchase"||action==="inquiry_postpaid"){
   if(body.confirm_data!=="true"||body.accept_policy!=="true"||body.policy_version!==POLICY_VERSION){
    return Response.json({error:"purchase_confirmation_required",message:"Periksa data dan setujui kebijakan transaksi digital sebelum melanjutkan."},{status:409,headers});
   }
   const user_id=safe(body.user_id,80),sku=safe(body.sku,160),customer_no=safe(body.customer_no,220);
   if(!user_id||!sku||customer_no.length<3)return Response.json({error:"invalid_confirmation_context"},{status:400,headers});
   const q=await db.from("dlavie_digital_purchase_consents").insert({user_id,sku,customer_no,policy_version:POLICY_VERSION});
   if(q.error)throw q.error;
  }
  if(action==="pay_postpaid"){
   if(body.payment_confirmed!=="true"||body.policy_version!==POLICY_VERSION){
    return Response.json({error:"payment_confirmation_required",message:"Konfirmasi kembali detail tagihan dan total sebelum pembayaran."},{status:409,headers});
   }
   const user_id=safe(body.user_id,80),ref_id=safe(body.ref_id,180),token=safe(body.wallet_token,180);
   if(!user_id||!ref_id||!token)return Response.json({error:"auth_required"},{status:401,headers});
   const w=await db.from("dlavie_wallets").select("id").eq("access_hash",await sha256(token)).maybeSingle();
   if(w.error)throw w.error;if(!w.data?.id)return Response.json({error:"auth_required"},{status:401,headers});
   const oq=await db.from("dlavie_digital_orders").update({payment_confirmed_at:new Date().toISOString(),payment_policy_version:POLICY_VERSION}).eq("source","h2h").eq("ref_id",ref_id).eq("wallet_id",w.data.id).eq("user_id",user_id).eq("product_kind","postpaid").eq("status","inquired").select("id").maybeSingle();
   if(oq.error)throw oq.error;if(!oq.data?.id)return Response.json({error:"postpaid_not_payable"},{status:409,headers});
  }
  const upstream=await fetch(UPSTREAM,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:raw});
  const text=await upstream.text();
  return new Response(text,{status:upstream.status,headers:{...headers,"content-type":upstream.headers.get("content-type")||"application/json"}});
 }catch(e){
  console.error("dlavie-digital-market-h2h-v22",e instanceof Error?e.message:e);
  return Response.json({error:"market_guard_error",message:"Guard transaksi digital belum dapat memproses permintaan."},{status:500,headers});
 }
}));
