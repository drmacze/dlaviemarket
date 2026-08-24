import { useEffect } from 'react'

export default function MobilePolishV45() {
  useEffect(() => {
    document.documentElement.dataset.dlvUiPolish = 'v45'
    return () => {
      delete document.documentElement.dataset.dlvUiPolish
    }
  }, [])

  return null
}
