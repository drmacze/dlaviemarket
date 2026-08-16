import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ThemeSystem from './ThemeSystem'
import './styles.css'
import './brand-logos.css'
import './mobile-polish.css'
import './theme-system.css'
import './polish-v2.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeSystem />
    <App />
  </StrictMode>,
)
