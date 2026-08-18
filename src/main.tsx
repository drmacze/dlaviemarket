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
import AccessExperience from './AccessExperience'
import LoginRedirectEnhancer from './LoginRedirectEnhancer'
import DLavieAssistant from './DLavieAssistant'
import DLavieAssistantHaptics from './DLavieAssistantHaptics'
import DLavieAssistantKnowledgeLinks from './DLavieAssistantKnowledgeLinks'
import DLavieAdminSupport from './DLavieAdminSupport'
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
import './access-experience.css'
import './dlavie-assistant.css'
import './dlavie-assistant-motion.css'
import './dlavie-assistant-hybrid.css'
import './dlavie-assistant-knowledge.css'
import './dlavie-assistant-intake-v2.css'
import './dlavie-assistant-performance.css'
import './dlavie-admin-support.css'
import './ios-form-zoom-fix.css'
import './route-height-fix-v2.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StateBridge />
    <ThemeSystem />
    <PageNavigation />
    <CopyRefinement />
    <LanguageSystem />
    <NavUtilityMenu />
    <AccountSystem />
    <LoginRedirectEnhancer />
    <MarketFlow />
    <OrderCenter />
    <ActivityViewEnhancer />
    <ActivityMetadataEnhancer />
    <MidtransPaymentSystem />
    <WalletHistoryEnhancer />
    <SiteDetailSystem />
    <MarketPolicies />
    <AccessExperience />
    <DLavieAssistant />
    <DLavieAssistantHaptics />
    <DLavieAssistantKnowledgeLinks />
    <DLavieAdminSupport />
    <DLavieRadio />
    <App />
  </StrictMode>,
)
