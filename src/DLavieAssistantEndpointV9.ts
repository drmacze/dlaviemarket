const OLD_ENDPOINT='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-assistant'
const V9_ENDPOINT='https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-assistant-v9'

declare global{interface Window{__dlavieAssistantV9Fetch?:boolean}}

if(typeof window!=='undefined'&&!window.__dlavieAssistantV9Fetch){
 window.__dlavieAssistantV9Fetch=true
 const nativeFetch=window.fetch.bind(window)
 window.fetch=(input:RequestInfo|URL,init?:RequestInit)=>{
  if(typeof input==='string'&&input===OLD_ENDPOINT)return nativeFetch(V9_ENDPOINT,init)
  if(input instanceof URL&&input.href===OLD_ENDPOINT)return nativeFetch(V9_ENDPOINT,init)
  return nativeFetch(input,init)
 }
}

export {}
