import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";

async function hmacSha1(secret:string,v:string){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-1"},false,["sign"]);const d=await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(v));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("")}
function eq(a:string,b:string){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
async function secret(db:any){const q=await db.rpc("dlavie_get_vault_secret",{p_name:"dlavie_digiflazz_webhook_secret"});if(q.error)throw q.error;return String(q.data||"")}
function norm(v:unknown){const s=String(v||"").toLowerCase();if(["sukses","success","successful"].includes(s))return"success";if(["gagal","failed","failure"].includes(s))return"failed";return"pending"}
function clean(v:unknown,n=700){return String(v??"").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,n)}

Deno.serve(withSupabase({auth:"none"},async(req,ctx)=>{
  if(req.method!=="POST")return Response.json({error:"method_not_allowed"},{status:405});
  try{
    const raw=await req.text(),db=ctx.supabaseAdmin.schema("api"),sec=await secret(db);
    if(!sec)return Response.json({error:"webhook_secret_not_configured"},{status:503});
    const expected=`sha1=${await hmacSha1(sec,raw)}`,provided=String(req.headers.get("x-hub-signature")||"").toLowerCase();
    if(!provided||!eq(expected.toLowerCase(),provided))return Response.json({error:"bad_signature"},{status:403});

    const event=String(req.headers.get("x-digiflazz-event")||"").toLowerCase(),agent=String(req.headers.get("user-agent")||"");
    const payload=JSON.parse(raw||"{}") as any;
    if(event==="ping")return Response.json({ok:true,pong:true});
    const d=payload?.data||payload,ref=String(d?.ref_id||"").trim();
    if(!ref)return Response.json({error:"ref_id_required"},{status:400});

    const oq=await db.from("dlavie_digital_orders").select("*").eq("ref_id",ref).maybeSingle();
    if(oq.error)throw oq.error;const order:any=oq.data;
    if(!order)return Response.json({ok:true,ignored:true});

    const status=norm(d.status),now=new Date().toISOString();
    const patch:any={supplier_status:clean(d.status,50)||null,rc:clean(d.rc,50)||null,supplier_price:Number.isFinite(Number(d.price))?Math.round(Number(d.price)):null,buyer_last_saldo:Number.isFinite(Number(d.buyer_last_saldo))?Number(d.buyer_last_saldo):null,raw_response:{...payload,_webhook:{event,user_agent:agent,received_at:now}},last_checked_at:now,updated_at:now,gateway_forwarded:true};
    if(d.message!=null)patch.message=clean(d.message)||null;
    if(d.sn!=null)patch.serial_number=clean(d.sn,600)||null;
    if(d.customer_name)patch.customer_name=clean(d.customer_name,220);
    if(d.periode!=null)patch.period=clean(Array.isArray(d.periode)?d.periode.join(", "):d.periode,240);
    if(d.desc!=null)patch.inquiry_detail=d.desc;

    const terminal=["success","refunded","failed"].includes(order.status);
    if(terminal){
      const uq=await db.from("dlavie_digital_orders").update(patch).eq("id",order.id);
      if(uq.error)throw uq.error;
      return Response.json({ok:true,status:order.status,event,kind:order.product_kind,ignored_terminal:true,supplier_status:status});
    }

    let paymentStarted=["reserved","pending"].includes(order.status);
    if(!paymentStarted){
      const lq=await db.from("dlavie_wallet_ledger").select("id").eq("wallet_id",order.wallet_id).eq("idempotency_key",`digital:debit:${order.ref_id}`).maybeSingle();
      if(lq.error)throw lq.error;paymentStarted=!!lq.data;
    }

    const inquiryOnly=order.product_kind==="postpaid"&&!paymentStarted;
    if(inquiryOnly){
      patch.status=order.status;
    }else if(status==="success"){
      patch.status="success";patch.completed_at=now;
    }else if(status==="failed"){
      if(paymentStarted&&Number(order.sell_price)>0){
        const rr=await db.rpc("dlavie_digital_refund_wallet",{p_wallet_id:order.wallet_id,p_ref_id:order.ref_id,p_amount:order.sell_price,p_reason:order.product_kind==="postpaid"?"digiflazz_postpaid_webhook_failed":"digiflazz_webhook_failed"});
        if(rr.error)throw rr.error;patch.status="refunded";patch.refunded_at=now;
      }else patch.status="failed";
    }else if(paymentStarted)patch.status="pending";

    const uq=await db.from("dlavie_digital_orders").update(patch).eq("id",order.id);
    if(uq.error)throw uq.error;
    return Response.json({ok:true,status:patch.status||order.status,event,kind:order.product_kind,payment_started:paymentStarted,inquiry_only:inquiryOnly});
  }catch(e){
    console.error("dlavie-digiflazz-webhook",e);
    return Response.json({error:"webhook_error"},{status:500});
  }
}));
