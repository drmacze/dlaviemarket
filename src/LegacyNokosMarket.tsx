import { useEffect, useState } from 'react'
import MarketFlow from './MarketFlow'

function isLegacyNokosRoute() {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [name, query = ''] = raw.split('?')
  return name.toLowerCase() === 'market' && new URLSearchParams(query).get('mode') === 'nokos'
}

export default function LegacyNokosMarket() {
  const [active, setActive] = useState(isLegacyNokosRoute)

  useEffect(() => {
    const sync = () => setActive(isLegacyNokosRoute())
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  return active ? <MarketFlow /> : null
}
