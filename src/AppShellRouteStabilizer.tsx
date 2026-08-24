import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

function clampHorizontal() {
  const scrolling = document.scrollingElement as HTMLElement | null
  if (document.documentElement.scrollLeft) document.documentElement.scrollLeft = 0
  if (document.body.scrollLeft) document.body.scrollLeft = 0
  if (scrolling?.scrollLeft) scrolling.scrollLeft = 0
}

function quiesceLegacyMotion() {
  const html = document.documentElement
  if (html.dataset.dlvLayout !== 'app-v37' || html.dataset.access === 'guest' || html.dataset.access === 'onboarding') return
  const legacyMain = document.querySelector<HTMLElement>('.app > main')
  if (!legacyMain || getComputedStyle(legacyMain).display !== 'none') return

  const hiddenTargets = gsap.utils.toArray<HTMLElement>('.app > main *')
  if (hiddenTargets.length) gsap.killTweensOf(hiddenTargets)
  ScrollTrigger.getAll().forEach((trigger) => {
    const element = trigger.trigger
    if (element instanceof Element && legacyMain.contains(element)) trigger.kill()
  })
}

export default function AppShellRouteStabilizer() {
  useEffect(() => {
    document.documentElement.classList.add('dlv42-app-shell')
    const previousRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'

    let motionFrame = 0
    let motionTimer = 0
    const settleLegacyMotion = () => {
      cancelAnimationFrame(motionFrame)
      window.clearTimeout(motionTimer)
      motionFrame = requestAnimationFrame(() => {
        quiesceLegacyMotion()
        motionTimer = window.setTimeout(quiesceLegacyMotion, 120)
      })
    }
    const onHash = () => requestAnimationFrame(clampHorizontal)
    const onPageShow = () => requestAnimationFrame(clampHorizontal)
    const onOrientation = () => window.setTimeout(clampHorizontal, 120)
    const attributes = new MutationObserver(settleLegacyMotion)

    attributes.observe(document.documentElement, { attributes: true, attributeFilter: ['data-dlv-layout', 'data-access'] })
    window.addEventListener('hashchange', onHash)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('orientationchange', onOrientation)
    requestAnimationFrame(clampHorizontal)
    settleLegacyMotion()

    return () => {
      document.documentElement.classList.remove('dlv42-app-shell')
      history.scrollRestoration = previousRestoration
      attributes.disconnect()
      cancelAnimationFrame(motionFrame)
      window.clearTimeout(motionTimer)
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('orientationchange', onOrientation)
    }
  }, [])

  return null
}
