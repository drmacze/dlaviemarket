import http from 'node:http'
import crypto from 'node:crypto'

const PORT=Math.max(1,Number(process.env.PORT||8080))
const SECRET=String(process.env.DLAVIE_GATEWAY_SECRET||'').trim()
const DIGI_BASE='https://api.digiflazz.com/v1'
const MAX_BODY=128*1024
const MAX_SKEW_SECONDS=90

function json(res,status,data){
 const body=JSON.stringify(data)
 res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','content-length':Buffer.byteLength(body)})
 res.end(body)
}
function md5(value){return crypto.createHash('md5').update(value).digest('hex')}
function hmac(value){return crypto.createHmac('sha256',SECRET).update(value).digest('hex')}
function safeEqual(a,b){
 const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''))
 return aa.length===bb.length&&aa.length>0&&crypto.timingSafeEqual(aa,bb)
}
async function read(req){
 let size=0;const chunks=[]
 for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw new Error('body_too_large');chunks.push(chunk)}
 const raw=Buffer.concat(chunks).toString('utf8')
 return {raw,data:JSON.parse(raw||'{}')}
}
function verify(req,raw){
 if(!SECRET)throw new Error('gateway_secret_missing')
 const ts=String(req.headers['x-dlavie-timestamp']||'')
 const sig=String(req.headers['x-dlavie-signature']||'')
 const num=Number(ts)
 if(!Number.isFinite(num)||Math.abs(Math.floor(Date.now()/1000)-num)>MAX_SKEW_SECONDS)throw new Error('stale_request')
 const expected=hmac(`${ts}\n${raw}`)
 if(!safeEqual(expected,sig))throw new Error('invalid_signature')
}
function credentials(data){
 const username=String(data.username||'').trim(),apiKey=String(data.api_key||'').trim()
 if(username.length<2||apiKey.length<8)throw new Error('missing_digiflazz_credentials')
 return {username,apiKey}
}
async function upstream(path,payload){
 let response
 try{
  response=await fetch(`${DIGI_BASE}${path}`,{method:'POST',headers:{'content-type':'application/json','accept':'application/json','user-agent':'DLavie-Digiflazz-Gateway/1.0'},body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)})
 }catch(error){
  return {network_error:true,forwarded:false,message:error instanceof Error?error.message:'upstream_network_error'}
 }
 const text=await response.text()
 let body={}
 try{body=text?JSON.parse(text):{}}catch{body={message:text.slice(0,1000)}}
 return {network_error:false,forwarded:true,status:response.status,ok:response.ok,body}
}
async function priceList(data){
 const {username,apiKey}=credentials(data)
 const cmd=data.cmd==='pasca'?'pasca':'prepaid'
 const request={cmd,username,sign:md5(`${username}${apiKey}pricelist`)}
 const result=await upstream('/price-list',request)
 if(result.network_error)return {http:502,body:{ok:false,forwarded:false,error:'digiflazz_unreachable',message:result.message}}
 const response=result.body||{}
 if(!result.ok)return {http:502,body:{ok:false,forwarded:true,error:'digiflazz_http_error',upstream_http_status:result.status,response}}
 return {http:200,body:{ok:true,forwarded:true,upstream_http_status:result.status,data:Array.isArray(response.data)?response.data:[],response}}
}
async function transaction(data){
 const {username,apiKey}=credentials(data)
 const refId=String(data.ref_id||'').trim(),sku=String(data.buyer_sku_code||'').trim(),customerNo=String(data.customer_no||'').trim()
 if(!refId||!sku||!customerNo)throw new Error('invalid_transaction_payload')
 const request={username,buyer_sku_code:sku,customer_no:customerNo,ref_id:refId,sign:md5(`${username}${apiKey}${refId}`)}
 if(data.commands)request.commands=String(data.commands)
 if(data.testing===true||data.testing==='true')request.testing=true
 if(Number.isFinite(Number(data.max_price))&&Number(data.max_price)>0)request.max_price=Math.round(Number(data.max_price))
 if(Number.isFinite(Number(data.amount))&&Number(data.amount)>0)request.amount=Math.round(Number(data.amount))
 if(Number.isInteger(Number(data.year))&&Number(data.year)>=2000&&Number(data.year)<=2100)request.year=Number(data.year)
 const result=await upstream('/transaction',request)
 if(result.network_error)return {http:502,body:{ok:false,forwarded:false,error:'digiflazz_unreachable',message:result.message}}
 const response=result.body||{}
 // A response from Digiflazz means the request was forwarded. Keep that distinction
 // even for non-2xx upstream responses so DLavie never assumes a safe refund when
 // supplier-side state is uncertain.
 return {http:200,body:{ok:true,forwarded:true,upstream_http_status:result.status,response,data:response.data||null}}
}

const server=http.createServer(async(req,res)=>{
 if(req.method==='GET'&&(req.url==='/'||req.url==='/health'))return json(res,200,{ok:true,service:'dlavie-digiflazz-static-egress',secret_configured:!!SECRET})
 if(req.method!=='POST')return json(res,405,{ok:false,error:'method_not_allowed'})
 try{
  const {raw,data}=await read(req);verify(req,raw)
  const op=String(data.op||'')
  if(op==='ping')return json(res,200,{ok:true,service:'dlavie-digiflazz-static-egress',timestamp:new Date().toISOString()})
  const result=op==='price_list'?await priceList(data):op==='transaction'?await transaction(data):null
  if(!result)return json(res,400,{ok:false,error:'invalid_operation'})
  return json(res,result.http,result.body)
 }catch(error){
  const message=error instanceof Error?error.message:'gateway_error'
  const status=['invalid_signature','stale_request'].includes(message)?401:message==='body_too_large'?413:400
  return json(res,status,{ok:false,forwarded:false,error:message})
 }
})
server.listen(PORT,'0.0.0.0',()=>console.log(`DLavie Digiflazz gateway listening on :${PORT}`))
