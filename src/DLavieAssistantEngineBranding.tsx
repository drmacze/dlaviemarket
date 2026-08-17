import { useEffect } from 'react'

export default function DLavieAssistantEngineBranding() {
  useEffect(() => {
    const patch = () => {
      document.querySelectorAll('.dlv-assistant-ready-meta div').forEach((item) => {
        const label = item.querySelector('small')?.textContent?.trim().toUpperCase()
        const value = item.querySelector('strong')
        if (label === 'AI' && value && value.textContent !== 'DLavie Engine') value.textContent = 'DLavie Engine'
      })
      document.querySelectorAll('.dlv-assistant-identity small').forEach((item) => {
        const text = item.textContent || ''
        if (text.includes('AI support')) item.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent?.includes('AI support')) node.textContent = node.textContent.replace('AI support', 'DLavie Engine')
        })
      })
    }
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.type === 'childList')) patch()
    })
    observer.observe(document.body, { childList: true, subtree: true })
    patch()
    return () => observer.disconnect()
  }, [])
  return null
}
