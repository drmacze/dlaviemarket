const OLD_ENDPOINT='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-assistant'
const V10_ENDPOINT='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-assistant-v10'

declare global{interface Window{__dlavieAssistantV10Fetch?:boolean}}

if(typeof window!=='undefined'&&!window.__dlavieAssistantV10Fetch){
 window.__dlavieAssistantV10Fetch=true
 const nativeFetch=window.fetch.bind(window)
 window.fetch=(input:RequestInfo|URL,init?:RequestInit)=>{
  if(typeof input==='string'&&input===OLD_ENDPOINT)return nativeFetch(V10_ENDPOINT,init)
  if(input instanceof URL&&input.href===OLD_ENDPOINT)return nativeFetch(V10_ENDPOINT,init)
  return nativeFetch(input,init)
 }
}

export {}
