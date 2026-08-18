const OLD_ENDPOINT='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-assistant'
const V11_ENDPOINT='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-assistant-v11'

declare global{interface Window{__dlavieAssistantV11Fetch?:boolean}}

if(typeof window!=='undefined'&&!window.__dlavieAssistantV11Fetch){
 window.__dlavieAssistantV11Fetch=true
 const nativeFetch=window.fetch.bind(window)
 window.fetch=(input:RequestInfo|URL,init?:RequestInit)=>{
  if(typeof input==='string'&&input===OLD_ENDPOINT)return nativeFetch(V11_ENDPOINT,init)
  if(input instanceof URL&&input.href===OLD_ENDPOINT)return nativeFetch(V11_ENDPOINT,init)
  return nativeFetch(input,init)
 }
}

export {}
