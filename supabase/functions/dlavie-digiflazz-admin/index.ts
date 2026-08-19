import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";

const ORIGIN="https://drmacze.github.io";
const cors=()=>({"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Max-Age":"86400","Vary":"Origin"});
async function body(req:Request){const t=(req.headers.get("content-type")||"").toLowerCase();if(t.includes("application/x-www-form-urlencoded"))return Object.fromEntries(new URLSearchParams(await req.text()).entries());return await req.json().catch(()=>({}))}
function safe(v:unknown,n=500){return String(v??"").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,n)}
async function sha256(v:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("")}
async function hmac(secret:string,v:string){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const d=await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(v));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,"0")).join("")}
async function secret(db:any,name:string){const q=await db.rpc("dlavie_get_vault_secret",{p_name:name});if(q.error)throw q.error;return String(q.data||"")}
async function setSecret(db:any,name:string,value:string){const q=await db.rpc("dlavie_set_vault_secret",{p_name:name,p_value:value});if(q.error)throw q.error}
function randomSecret(){const a=crypto.getRandomValues(new Uint8Array(32));return Array.from(a,b=>b.toString(16).padStart(2,"0")).join("")}
async function auth(db:any,token:string){if(!token)return null;const q=await db.from("dlavie_assistant_admin_sessions").select("admin_name,expires_at").eq("token_hash",await sha256(token)).maybeSingle();if(q.error)throw q.error;if(!q.data||new Date(q.data.expires_at).getTime()<=Date.now())return null;return q.data}
async function getSettings(db:any){const q=await db.from("dlavie_digiflazz_settings").select("*").eq("id",1).single();if(q.error)throw q.error;return q.data}
async function getReadiness(db:any,s:any){
  const [u,k,g,w]=await Promise.all([secret(db,"dlavie_digiflazz_username"),secret(db,"dlavie_digiflazz_api_key"),secret(db,"dlavie_digiflazz_gateway_secret"),secret(db,"dlavie_digiflazz_webhook_secret")]);
  const credentials=!!u&&!!k,gateway=credentials&&!!g&&!!s.gateway_url,webhook=!!w,catalog=Number(s.catalog_count||0)>0;
  return {credentials,gateway,webhook,catalog,testing_safe:gateway&&catalog,production_safe:gateway&&webhook&&catalog,secrets:{username:!!u,api_key:!!k,gateway_secret:!!g,webhook_secret:!!w}};
}
async function gateway(db:any,s:any,payload:any){const [gw,user,key]=await Promise.all([secret(db,"dlavie_digiflazz_gateway_secret"),secret(db,"dlavie_digiflazz_username"),secret(db,"dlavie_digiflazz_api_key")]);if(!s.gateway_url||!gw||!user||!key)throw new Error("integration_not_ready");const raw=JSON.stringify({...payload,username:user,api_key:key}),ts=String(Math.floor(Date.now()/1000)),sig=await hmac(gw,`${ts}\n${raw}`);const r=await fetch(String(s.gateway_url),{method:"POST",headers:{"content-type":"application/json","x-dlavie-timestamp":ts,"x-dlavie-signature":sig},body:raw});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.message||d.error||`gateway_http_${r.status}`);return d}
function sell(base:number,s:any){const min=Math.max(0,Number(s.minimum_markup||0)),v=Number(s.markup_value||0),m=s.markup_mode==="percent"?Math.max(min,Math.round(base*v/100)):Math.max(min,Math.round(v));return Math.max(base,base+m)}
function compact(...values:unknown[]){return values.map(v=>safe(v,300)).join(" ").toLowerCase().replace(/[^a-z0-9]+/g,"")}
function extended(...values:unknown[]){const x=compact(...values);return x.includes("pbb")||x.includes("pajakbumibangunan")||x.includes("emoney")||x.includes("etoll")||x.includes("brizzi")||x.includes("flazz")||x.includes("tapcash")||x.includes("samsat")}
function normalizeCategory(kind:string,rawCategory:string,brand:string,name:string,type:string,sku:string){
  const all=compact(rawCategory,brand,name,type,sku),cat=compact(rawCategory),br=compact(brand);
  if(kind==="postpaid"){
    if(all.includes("samsat"))return "SAMSAT";
    if(all.includes("pbb")||all.includes("pajakbumibangunan"))return "PBB";
    if(all.includes("bpjs"))return "BPJS";
    if(all.includes("pdam")||all.includes("airminum"))return "PDAM";
    if(all.includes("pln")||all.includes("listrik"))return "PLN & Listrik";
    if(all.includes("emoney")||all.includes("etoll")||all.includes("brizzi")||all.includes("flazz")||all.includes("tapcash"))return "E-Money";
    if(all.includes("internet")||all.includes("indihome")||all.includes("telkom")||all.includes("tvkabel")||all.includes("televisi"))return "Internet & TV";
    if(all.includes("multifinance")||all.includes("finance")||all.includes("leasing"))return "Multifinance";
    if(all.includes("gas")||all.includes("pgn"))return "Gas";
    if(all.includes("pajak"))return "Pajak";
    return "Tagihan Lainnya";
  }
  if(["pulsa","pulsaoperator","mobile"].includes(cat)||all.includes("pulsa"))return "Pulsa";
  if(["data","paketdata","internet"].includes(cat)||all.includes("paketdata")||all.includes("kuota"))return "Paket Data";
  if(["pln","listrik"].includes(cat)||all.includes("pln")||all.includes("tokenlistrik"))return "PLN";
  if(["emoney","ewallet","dompetdigital"].includes(cat)||all.includes("ewallet")||all.includes("emoney")||["dana","ovo","gopay","shopeepay","linkaja"].includes(br))return "E-Wallet";
  if(["games","game","voucher","vouchergame"].includes(cat)||all.includes("games")||all.includes("voucher"))return "Voucher & Game";
  if(["aktivasi","aktivasivoucher"].includes(cat))return "Aktivasi & Voucher";
  return rawCategory||"Produk Digital Lainnya";
}

Deno.serve(withSupabase({auth:"none"},async(req,ctx)=>{
  const headers=cors();if(req.method==="OPTIONS")return new Response(null,{status:204,headers});if(req.method!=="POST")return Response.json({error:"method_not_allowed"},{status:405,headers});
  try{
    const b:any=await body(req),db=ctx.supabaseAdmin.schema("api"),admin=await auth(db,safe(b.admin_token,180));
    if(!admin)return Response.json({error:"admin_auth_required"},{status:401,headers});
    const action=safe(b.action,40),s=await getSettings(db);

    if(action==="status"){
      const readiness=await getReadiness(db,s);
      return Response.json({ok:true,settings:s,secrets:readiness.secrets,readiness:{credentials:readiness.credentials,gateway:readiness.gateway,webhook:readiness.webhook,catalog:readiness.catalog,testing_safe:readiness.testing_safe,production_safe:readiness.production_safe},admin_name:admin.admin_name},{headers});
    }

    if(action==="save_credentials"){
      const user=safe(b.username,160),key=safe(b.api_key,400);if(user.length<2||key.length<8)return Response.json({error:"invalid_credentials_format"},{status:400,headers});
      await Promise.all([setSecret(db,"dlavie_digiflazz_username",user),setSecret(db,"dlavie_digiflazz_api_key",key)]);return Response.json({ok:true},{headers});
    }

    if(action==="generate_gateway_secret"){
      const value=randomSecret();await setSecret(db,"dlavie_digiflazz_gateway_secret",value);return Response.json({ok:true,secret:value,message:"Simpan nilai ini sebagai DLAVIE_GATEWAY_SECRET pada layanan Static Egress Gateway Anda."},{headers});
    }

    if(action==="generate_webhook_secret"){
      const value=randomSecret();await setSecret(db,"dlavie_digiflazz_webhook_secret",value);return Response.json({ok:true,secret:value,message:"Masukkan secret ini saat mengatur Webhook Digiflazz."},{headers});
    }

    if(action==="save_gateway"){
      const url=safe(b.gateway_url,500);if(url&&!/^https:\/\//i.test(url))return Response.json({error:"https_gateway_required"},{status:400,headers});
      const q=await db.from("dlavie_digiflazz_settings").update({gateway_url:url||null,updated_at:new Date().toISOString()}).eq("id",1).select("*").single();if(q.error)throw q.error;return Response.json({ok:true,settings:q.data},{headers});
    }

    if(action==="save_settings"){
      const env=safe(b.environment,20)==="production"?"production":"testing",mode=safe(b.markup_mode,20)==="percent"?"percent":"fixed",value=Math.max(0,Number(b.markup_value||0)),minimum=Math.max(0,Math.round(Number(b.minimum_markup||0))),enabled=String(b.live_enabled)==="true",postpaid=String(b.postpaid_enabled)==="true";
      if(!Number.isFinite(value)||value>1000000||minimum>1000000)return Response.json({error:"invalid_markup"},{status:400,headers});
      if(enabled){
        const readiness=await getReadiness(db,s),ready=env==="production"?readiness.production_safe:readiness.testing_safe;
        if(!ready)return Response.json({error:env==="production"?"production_not_ready":"market_not_ready",message:env==="production"?"Production membutuhkan credential, static egress gateway, webhook secret, dan katalog tersinkron.":"Aktivasi testing membutuhkan credential, static egress gateway, dan katalog tersinkron."},{status:409,headers});
      }
      if(postpaid&&env==="production"){
        const readiness=await getReadiness(db,s);if(!readiness.webhook)return Response.json({error:"postpaid_webhook_required",message:"Postpaid production membutuhkan webhook secret aktif."},{status:409,headers});
      }
      const q=await db.from("dlavie_digiflazz_settings").update({environment:env,markup_mode:mode,markup_value:value,minimum_markup:minimum,live_enabled:enabled,postpaid_enabled:postpaid,updated_at:new Date().toISOString()}).eq("id",1).select("*").single();if(q.error)throw q.error;return Response.json({ok:true,settings:q.data},{headers});
    }

    if(action==="test_gateway"){const d=await gateway(db,s,{op:"ping"});return Response.json({ok:true,gateway:d},{headers})}

    if(action==="sync_catalog"){
      const started=new Date().toISOString();
      try{
        const kinds=s.postpaid_enabled?["prepaid","pasca"]:["prepaid"];
        for(const cmd of kinds){
          const d=await gateway(db,s,{op:"price_list",cmd}),rows=Array.isArray(d.data)?d.data:Array.isArray(d.response?.data)?d.response.data:[];
          if(!Array.isArray(rows))throw new Error("invalid_pricelist_response");
          const productKind=cmd==="prepaid"?"prepaid":"postpaid";
          const mapped=rows.map((x:any)=>{
            const rawCategory=safe(x.category,120)||"Lainnya",brand=safe(x.brand,120)||"Lainnya",name=safe(x.product_name,220)||safe(x.buyer_sku_code,160),type=safe(x.type,120)||"",sku=safe(x.buyer_sku_code,160),category=normalizeCategory(productKind,rawCategory,brand,name,type,sku),base=productKind==="prepaid"?Math.max(0,Math.round(Number(x.price||0))):0;
            return{source:"digiflazz",product_kind:productKind,sku,product_name:name,category,brand,product_type:type||null,seller_name:safe(x.seller_name,160)||null,base_price:base,sell_price:productKind==="prepaid"?sell(base,s):0,admin_fee:x.admin==null?null:Math.round(Number(x.admin||0)),commission:x.commission==null?null:Math.round(Number(x.commission||0)),buyer_product_status:Boolean(x.buyer_product_status),seller_product_status:Boolean(x.seller_product_status),unlimited_stock:productKind==="postpaid"?true:x.unlimited_stock!==false,stock:productKind==="postpaid"?0:Math.max(0,Math.round(Number(x.stock||0))),multi:productKind==="postpaid"?false:Boolean(x.multi),start_cut_off:safe(x.start_cut_off,30)||null,end_cut_off:safe(x.end_cut_off,30)||null,description:safe(x.desc,1200)||null,requires_extended_input:productKind==="postpaid"&&extended(rawCategory,brand,name,type,sku),raw:x,synced_at:started,updated_at:started};
          }).filter((x:any)=>x.sku);
          for(let i=0;i<mapped.length;i+=300){const uq=await db.from("dlavie_digital_products").upsert(mapped.slice(i,i+300),{onConflict:"sku"});if(uq.error)throw uq.error}
          const stale=await db.from("dlavie_digital_products").update({buyer_product_status:false,seller_product_status:false,updated_at:started}).eq("product_kind",productKind).lt("synced_at",started);if(stale.error)throw stale.error;
        }
        const cq=await db.from("dlavie_digital_products").select("id",{count:"exact",head:true}).eq("buyer_product_status",true).eq("seller_product_status",true);if(cq.error)throw cq.error;
        const count=Number(cq.count||0),q=await db.from("dlavie_digiflazz_settings").update({catalog_count:count,last_catalog_sync_at:started,last_catalog_sync_status:"success",last_catalog_sync_message:`${count} SKU aktif tersinkron`,updated_at:new Date().toISOString()}).eq("id",1).select("*").single();if(q.error)throw q.error;
        return Response.json({ok:true,count,settings:q.data},{headers});
      }catch(e){
        const msg=e instanceof Error?e.message:"sync_failed";await db.from("dlavie_digiflazz_settings").update({last_catalog_sync_at:started,last_catalog_sync_status:"failed",last_catalog_sync_message:msg,updated_at:new Date().toISOString()}).eq("id",1);throw e;
      }
    }

    return Response.json({error:"invalid_action"},{status:400,headers});
  }catch(e){
    console.error("dlavie-digiflazz-admin",e);const msg=e instanceof Error?e.message:"digiflazz_admin_error";
    return Response.json({error:msg,message:msg},{status:msg==="integration_not_ready"?503:500,headers:cors()});
  }
}));