import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ThemeSystem from './ThemeSystem'
import PageNavigation from './PageNavigation'
import CopyRefinement from './CopyRefinementV2'
import LanguageSystem from './LanguageSystem'
import NavUtilityMenu from './NavUtilityMenu'
import AccountSystem from './AccountSystem'
import MarketFlow from './MarketFlow'
import OrderCenter from './OrderCenter'
import StateBridge from './StateBridge'
import DLavieRadio from './DLavieRadio'
import ActivityViewEnhancer from './ActivityViewEnhancer'
import ActivityMetadataEnhancer from './ActivityMetadataEnhancer'
import MidtransPaymentSystem from './MidtransPaymentSystem'
import WalletHistoryEnhancer from './WalletHistoryEnhancer'
import SiteDetailSystem from './SiteDetailSystem'
import MarketPolicies from './MarketPolicies'
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
import './order-center.css'
import './service-brand-polish.css'
import './provider-logo-card.css'
import './microsoft-otp-polish.css'
import './ambient-player.css'
import './ambient-mobile-safe.css'
import './market-route-compact.css'
import './activity-view-polish.css'
import './nav-utility.css'
import './midtrans-payment.css'
import './dlavie-core-pay.css'
import './dlavie-core-pay-fix.css'
import './wallet-history-enhancer.css'
import './activity-metadata.css'
import './site-detail-system.css'
import './market-policies.css'
import './market-policies-route.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StateBridge />
    <ThemeSystem />
    <PageNavigation />
    <CopyRefinement />
    <LanguageSystem />
    <NavUtilityMenu />
    <AccountSystem />
    <MarketFlow />
    <OrderCenter />
    <ActivityViewEnhancer />
    <ActivityMetadataEnhancer />
    <MidtransPaymentSystem />
    <WalletHistoryEnhancer />
    <SiteDetailSystem />
    <MarketPolicies />
    <DLavieRadio />
    <App />
  </StrictMode>,
)
