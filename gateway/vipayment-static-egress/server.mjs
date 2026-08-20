import http from 'node:http'
import crypto from 'node:crypto'

const PORT=Number(process.env.PORT||8787)
const SECRET=String(process.env.DLAVIE_GATEWAY_SECRET||'')
const PUBLIC_EGRESS_IP=String(process.env.PUBLIC_EGRESS_IP||'')
const VIP_BASE='https://vip-reseller.co.id'
const ALLOWED=new Set(['/api/profile','/api/prepaid'])

function json(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data))}
function safeEqual(a,b){const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb)}
async function body(req){return await new Promise((resolve,reject)=>{let raw='';req.on('data',c=>{raw+=c;if(raw.length>65536){reject(new Error('payload_too_large'));req.destroy()}});req.on('end',()=>resolve(raw));req.on('error',reject)})}
async function detectIp(){if(PUBLIC_EGRESS_IP)return PUBLIC_EGRESS_IP;try{const r=await fetch('https://api.ipify.org?format=json',{signal:AbortSignal.timeout(5000)});const d=await r.json();return String(d.ip||'')}catch{return''}}

const server=http.createServer(async(req,res)=>{
 try{
  if(req.method!=='POST')return json(res,405,{ok:false,error:'method_not_allowed'})
  if(!SECRET||!safeEqual(req.headers['x-dlavie-gateway-secret'],SECRET))return json(res,401,{ok:false,error:'unauthorized'})
  if(req.url==='/health'){const ip=await detectIp();return json(res,200,{ok:true,service:'dlavie-vipayment-static-egress',ip})}
  if(req.url!=='/forward')return json(res,404,{ok:false,error:'not_found'})
  const raw=await body(req);let payload;try{payload=JSON.parse(raw)}catch{return json(res,400,{ok:false,error:'invalid_json'})}
  const path=String(payload?.path||'');if(!ALLOWED.has(path))return json(res,403,{ok:false,error:'path_not_allowed'})
  const form=payload?.form&&typeof payload.form==='object'?payload.form:{}
  const encoded=new URLSearchParams();for(const [k,v] of Object.entries(form))encoded.set(k,String(v??''))
  const upstream=await fetch(`${VIP_BASE}${path}`,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',accept:'application/json','user-agent':'DLavie-Static-Egress/1.0'},body:encoded,signal:AbortSignal.timeout(20000)})
  const text=await upstream.text();let data;try{data=JSON.parse(text)}catch{data={raw:text.slice(0,4000)}}
  return json(res,200,{ok:true,upstream_status:upstream.status,data})
 }catch(err){return json(res,500,{ok:false,error:err instanceof Error?err.message:'gateway_error'})}
})
server.listen(PORT,'0.0.0.0',()=>console.log(`DLavie VIPayment gateway listening on ${PORT}`))
