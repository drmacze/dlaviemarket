import { useEffect } from 'react'

const APP_ROUTES = new Set(['home', 'market', 'activity', 'help', 'guide', 'security', 'legal'])

function routeKey() {
  const value = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase()
  return value || 'home'
}

function isAppRoute() {
  return APP_ROUTES.has(routeKey()) && document.documentElement.dataset.access !== 'guest' && document.documentElement.dataset.access !== 'onboarding'
}

function clampHorizontal() {
  document.documentElement.scrollLeft = 0
  document.body.scrollLeft = 0
  const scrolling = document.scrollingElement as HTMLElement | null
  if (scrolling) scrolling.scrollLeft = 0
}

function restoreTop() {
  clampHorizontal()
  if (!isAppRoute()) return
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 60)
  window.setTimeout(clampHorizontal, 180)
}

export default function AppShellRouteStabilizer() {
  useEffect(() => {
    document.documentElement.classList.add('dlv42-app-shell')
    const onHash = () => requestAnimationFrame(restoreTop)
    const onPageShow = () => requestAnimationFrame(() => {
      clampHorizontal()
      if (isAppRoute() && window.scrollY < 24) restoreTop()
    })
    const onScroll = () => clampHorizontal()
    const onResize = () => requestAnimationFrame(clampHorizontal)

    window.addEventListener('hashchange', onHash)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('resize', onResize, { passive: true })
    document.addEventListener('scroll', onScroll, { passive: true, capture: true })
    requestAnimationFrame(() => {
      clampHorizontal()
      if (isAppRoute() && (routeKey() === 'home' || routeKey() === 'market')) restoreTop()
    })

    return () => {
      document.documentElement.classList.remove('dlv42-app-shell')
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('scroll', onScroll, true)
    }
  }, [])

  return null
}
