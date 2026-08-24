import { useEffect } from 'react'

function clampHorizontal() {
  const scrolling = document.scrollingElement as HTMLElement | null
  if (document.documentElement.scrollLeft) document.documentElement.scrollLeft = 0
  if (document.body.scrollLeft) document.body.scrollLeft = 0
  if (scrolling?.scrollLeft) scrolling.scrollLeft = 0
}

export default function AppShellRouteStabilizer() {
  useEffect(() => {
    document.documentElement.classList.add('dlv42-app-shell')
    const previousRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'

    const onHash = () => requestAnimationFrame(clampHorizontal)
    const onPageShow = () => requestAnimationFrame(clampHorizontal)
    const onOrientation = () => window.setTimeout(clampHorizontal, 120)

    window.addEventListener('hashchange', onHash)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('orientationchange', onOrientation)
    requestAnimationFrame(clampHorizontal)

    return () => {
      document.documentElement.classList.remove('dlv42-app-shell')
      history.scrollRestoration = previousRestoration
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('orientationchange', onOrientation)
    }
  }, [])

  return null
}
