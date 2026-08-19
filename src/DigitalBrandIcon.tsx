import { useMemo, useState } from 'react'

const normalize=(value='')=>value.toLowerCase().replace(/[^a-z0-9]+/g,' ')
type CategoryIconType='phone'|'network'|'bolt'|'wallet'|'game'|'receipt'|'sim'

const domainRules:Array<[RegExp,string]>=[
 [/telkomsel|simpati|kartu as|loop|by u|byu/,'telkomsel.com'],
 [/indosat|im3|mentari/,'im3.id'],
 [/\bxl\b|xl axiata/,'xl.co.id'],
 [/axis/,'axis.co.id'],
 [/\btri\b|three|3 indonesia/,'tri.co.id'],
 [/smartfren/,'smartfren.com'],
 [/pln/,'pln.co.id'],
 [/dana/,'dana.id'],
 [/\bovo\b/,'ovo.id'],
 [/gopay|go pay/,'gopay.co.id'],
 [/shopeepay|shopee pay/,'shopeepay.co.id'],
 [/linkaja|link aja/,'linkaja.id'],
 [/bpjs/,'bpjs-kesehatan.go.id'],
 [/mobile legends|mlbb/,'mobilelegends.com'],
 [/free fire|garena ff/,'ff.garena.com'],
 [/pubg/,'pubgmobile.com'],
 [/steam/,'steampowered.com'],
 [/google play/,'play.google.com'],
 [/playstation|psn/,'playstation.com'],
 [/xbox/,'xbox.com'],
 [/garena/,'garena.com'],
 [/valorant/,'playvalorant.com'],
 [/genshin|honkai|hoyoverse/,'hoyoverse.com'],
 [/tiktok/,'tiktok.com'],
 [/netflix/,'netflix.com'],
 [/spotify/,'spotify.com'],
 [/vidio/,'vidio.com'],
 [/youtube/,'youtube.com'],
 [/telegram/,'telegram.org'],
 [/whatsapp/,'whatsapp.com'],
 [/discord/,'discord.com'],
 [/instagram/,'instagram.com'],
 [/microsoft/,'microsoft.com'],
 [/google/,'google.com'],
]

export function brandDomain(brand=''){
 const value=normalize(brand)
 return domainRules.find(([rule])=>rule.test(value))?.[1]||''
}

function iconType(value=''):CategoryIconType{
 const x=normalize(value)
 if(x.includes('data')||x.includes('internet')||x.includes('kuota'))return'network'
 if(x.includes('pln')||x.includes('listrik'))return'bolt'
 if(x.includes('wallet')||x.includes('money')||x.includes('saldo'))return'wallet'
 if(x.includes('game')||x.includes('voucher'))return'game'
 if(x.includes('tagihan')||x.includes('postpaid')||x.includes('pdam')||x.includes('bpjs')||x.includes('pbb'))return'receipt'
 if(x.includes('nomor virtual')||x.includes('virtual number')||x.includes('sms')||x.includes('otp'))return'sim'
 return'phone'
}

export function DigitalCategoryIcon({value,className=''}:{value:string;className?:string}){
 const type=iconType(value)
 const paths:Record<CategoryIconType,React.ReactNode>={
  phone:<><rect x="7" y="2.7" width="10" height="18.6" rx="2.5"/><path d="M10.5 5.5h3"/><path d="M11 18.2h2"/></>,
  network:<><path d="M4.4 9.3a11 11 0 0 1 15.2 0"/><path d="M7.2 12.3a7 7 0 0 1 9.6 0"/><path d="M10 15.2a3 3 0 0 1 4 0"/><circle cx="12" cy="18.1" r=".9" fill="currentColor" stroke="none"/></>,
  bolt:<><path d="m13.3 2.8-7 10h5l-.8 8.4 7.2-11.2h-5.1z"/></>,
  wallet:<><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 8h15"/><path d="M15 12h6v5h-6a2.5 2.5 0 0 1 0-5Z"/><circle cx="16.6" cy="14.5" r=".6" fill="currentColor" stroke="none"/></>,
  game:<><path d="M7.2 8h9.6a4 4 0 0 1 3.8 5.3l-1.5 4.1a2 2 0 0 1-3.3.8l-1.7-1.7H9.9l-1.7 1.7a2 2 0 0 1-3.3-.8l-1.5-4.1A4 4 0 0 1 7.2 8Z"/><path d="M8 11v4M6 13h4"/><circle cx="16" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="18" cy="14" r=".7" fill="currentColor" stroke="none"/></>,
  receipt:<><path d="M6 3h12v18l-3-1.7-3 1.7-3-1.7L6 21z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
  sim:<><path d="M8 3h6l4 4v14H6V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h4"/><rect x="9" y="11" width="6" height="6" rx="1"/><path d="M12 11v6M9 14h6"/></>,
 }
 return <span className={`dlv-category-symbol ${className}`} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg></span>
}

export default function DigitalBrandIcon({brand,category='',className=''}:{brand:string;category?:string;className?:string}){
 const domain=useMemo(()=>brandDomain(brand),[brand])
 const [failed,setFailed]=useState(false)
 const label=(brand||category||'Digital').trim()
 if(!domain||failed)return <span className={`dlv-brand-icon is-fallback ${className}`} title={label}><DigitalCategoryIcon value={`${category} ${brand}`}/></span>
 const src=`https://www.google.com/s2/favicons?sz=128&domain_url=https://${domain}`
 return <span className={`dlv-brand-icon ${className}`} title={label}><img src={src} alt={`${label} logo`} referrerPolicy="no-referrer" loading="lazy" onError={()=>setFailed(true)}/></span>
}
