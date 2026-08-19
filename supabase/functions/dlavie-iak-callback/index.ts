import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";
import { createHash, timingSafeEqual } from "node:crypto";

function md5(v:string){return createHash("md5").update(v).digest("hex")}
async function secret(db:any,name:string){const q=await db.rpc("dlavie_get_vault_secret",{p_name:name});if(q.error)throw q.error;return String(q.data||"")}
function safe(v:unknown,n=600){return String(v??"").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,n)}
function same(a:string,b:string){try{const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb)}catch{return false}}

Deno.serve(withSupabase({auth:"none"},async(req,ctx)=>{
 if(req.method!=="POST")return Response.json({ok:false,error:"method_not_allowed"},{status:405})
 try{
  const payload:any=await req.json().catch(()=>({})),data=payload?.data||payload,ref=safe(data?.ref_id,160)
  if(!ref)return Response.json({ok:false,error:"missing_ref_id"},{status:400})
  const db=ctx.supabaseAdmin.schema("api"),oq=await db.from("dlavie_digital_orders").select("*").eq("ref_id",ref).eq("source","iak").maybeSingle()
  if(oq.error)throw oq.error
  const order:any=oq.data
  if(!order)return Response.json({ok:false,error:"order_not_found"},{status:404})
  const [username,key]=await Promise.all([secret(db,"dlavie_iak_username"),secret(db,order.environment==="production"?"dlavie_iak_production_api_key":"dlavie_iak_sandbox_api_key")])
  if(!username||!key)return Response.json({ok:false,error:"integration_not_ready"},{status:503})
  const expected=md5(username+key+ref),received=safe(data?.sign,100).toLowerCase()
  if(!received||!same(expected,received))return Response.json({ok:false,error:"invalid_signature"},{status:401})
  const now=new Date().toISOString(),status=Number(data?.status),patch:any={supplier_status:String(status),rc:safe(data?.rc,50)||null,message:safe(data?.message)||null,serial_number:safe(data?.sn||data?.pin||data?.activation_code,700)||null,supplier_price:Number.isFinite(Number(data?.price))?Math.round(Number(data.price)):null,buyer_last_saldo:Number.isFinite(Number(data?.balance))?Number(data.balance):null,supplier_request_id:safe(data?.tr_id,120)||order.supplier_request_id,raw_response:payload,gateway_forwarded:true,last_checked_at:now,updated_at:now}
  if(status===1){patch.status="success";patch.completed_at=now}
  else if(status===2){const rr=await db.rpc("dlavie_digital_refund_wallet",{p_wallet_id:order.wallet_id,p_ref_id:order.ref_id,p_amount:order.sell_price,p_reason:"iak_prepaid_failed"});if(rr.error)throw rr.error;patch.status="refunded";patch.refunded_at=now}
  else patch.status="pending"
  const uq=await db.from("dlavie_digital_orders").update(patch).eq("id",order.id);if(uq.error)throw uq.error
  return Response.json({ok:true})
 }catch(e){console.error("dlavie-iak-callback",e);return Response.json({ok:false,error:e instanceof Error?e.message:"callback_error"},{status:500})}
}));
