import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ThemeSystem from './ThemeSystem'
import PageNavigation from './PageNavigation'
import CopyRefinement from './CopyRefinement'
import AccountSystem from './AccountSystem'
import MarketFlow from './MarketFlow'
import './styles.css'
import './brand-logos.css'
import './mobile-polish.css'
import './theme-system.css'
import './polish-v2.css'
import './page-navigation.css'
import './nav-copy-fix.css'
import './account-system.css'
import './avatar-collection.css'
import './avatar-effects-v2.css'
import './market-flow.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeSystem />
    <PageNavigation />
    <CopyRefinement />
    <AccountSystem />
    <MarketFlow />
    <App />
  </StrictMode>,
)
