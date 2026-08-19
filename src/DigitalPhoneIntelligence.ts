export type IndonesianOperator='Telkomsel'|'IM3'|'XL'|'AXIS'|'Tri'|'Smartfren'|null
const MANUAL_PREFIX='dlavie-manual-operator-v22:'
const operators=['Telkomsel','IM3','XL','AXIS','Tri','Smartfren'] as const

export function phoneDigits(value=''){
  let x=value.replace(/\D/g,'')
  if(x.startsWith('62'))x=x.slice(2)
  if(x.startsWith('0'))x=x.slice(1)
  return x.slice(0,13)
}

export function localPhone(value=''){
  const x=phoneDigits(value)
  return x?`0${x}`:''
}

export function internationalPhone(value=''){
  const x=phoneDigits(value)
  return x?`+62${x}`:'+62'
}

export function maskPhone(value=''){
  const x=value.replace(/\D/g,'')
  if(x.length<7)return value||'—'
  return `${x.slice(0,4)}••••${x.slice(-3)}`
}

export function setManualOperator(value:string,operator:Exclude<IndonesianOperator,null>){
  const d=phoneDigits(value);if(!d)return
  sessionStorage.setItem(`${MANUAL_PREFIX}${d}`,operator)
}

export function detectIndonesianOperator(value=''):IndonesianOperator{
  const digits=phoneDigits(value),x=localPhone(value)
  if(!x)return null
  const manual=sessionStorage.getItem(`${MANUAL_PREFIX}${digits}`)
  if(manual&&operators.includes(manual as any))return manual as Exclude<IndonesianOperator,null>
  const p=x.slice(0,4)
  if(['0811','0812','0813','0821','0822','0823','0851','0852','0853'].includes(p))return'Telkomsel'
  if(['0814','0815','0816','0855','0856','0857','0858'].includes(p))return'IM3'
  if(['0817','0818','0819','0877','0878'].includes(p))return'XL'
  if(['0831','0832','0833','0838'].includes(p))return'AXIS'
  if(['0895','0896','0897','0898','0899'].includes(p))return'Tri'
  if(['0881','0882','0883','0884','0885','0886','0887','0888','0889'].includes(p))return'Smartfren'
  return null
}

export function isTelcoCategory(category=''){
  const x=category.toLowerCase()
  return x==='pulsa'||x==='paket data'
}

export function isPhoneCategory(category=''){
  const x=category.toLowerCase()
  return isTelcoCategory(category)||x==='e-wallet'
}

const phoneWalletBrands=['dana','ovo','gopay','shopeepay','linkaja','isaku','astrapay','doku','grab','indrive','maxim']
export function isPhoneTarget(category='',brand=''){
  if(isTelcoCategory(category))return true
  const c=category.toLowerCase(),b=brand.toLowerCase().replace(/[^a-z0-9]+/g,'')
  if(c==='e-wallet'||c.includes('wallet'))return phoneWalletBrands.some(x=>b.includes(x))
  return false
}

export function targetInputMode(category='',brand=''):'numeric'|'text'{
  const x=`${category} ${brand}`.toLowerCase()
  if(isPhoneTarget(category,brand)||x.includes('wallet')||x.includes('pln')||x.includes('bpjs')||x.includes('pdam')||x.includes('pbb')||x.includes('samsat')||x.includes('e-money')||x.includes('flazz')||x.includes('brizzi')||x.includes('tapcash'))return'numeric'
  return'text'
}
