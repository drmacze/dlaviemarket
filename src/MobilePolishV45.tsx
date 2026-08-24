import { useEffect } from 'react'
import AmbientParticlesV46 from './AmbientParticlesV46'
import VisualPolishV46 from './VisualPolishV46'
import './app-polish-v45-1.css'
import './ambient-particles-v46.css'

export default function MobilePolishV45() {
  useEffect(() => {
    document.documentElement.dataset.dlvUiPolish = 'v45'
    return () => {
      delete document.documentElement.dataset.dlvUiPolish
    }
  }, [])

  return (
    <>
      <AmbientParticlesV46 />
      <VisualPolishV46 />
    </>
  )
}
