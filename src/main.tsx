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
import DLavieDigitalMarket from './DLavieDigitalMarket'
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
import './DLavieAssistantEndpointV9'
import DLavieAssistant from './DLavieAssistant'
import DLavieAssistantHaptics from './DLavieAssistantHaptics'
import DLavieAssistantKnowledgeLinks from './DLavieAssistantKnowledgeLinks'
import DLavieAssistantSessionReconciler from './DLavieAssistantSessionReconciler'
import DLavieAssistantUIV2 from './DLavieAssistantUIV2'
import DLavieAssistantFastComposer from './DLavieAssistantFastComposer'
import DLavieAssistantReceiptPolish from './DLavieAssistantReceiptPolish'
import DLavieAdminSupport from './DLavieAdminSupport'
import DLavieDigiflazzAdmin from './DLavieDigiflazzAdmin'
import RefundCenter from './RefundCenter'
import DLavieRefundAdminQueue from './DLavieRefundAdminQueue'
import DLavieOrderEvidenceBridge from './DLavieOrderEvidenceBridge'
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
import './digital-market.css'
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
import './dlavie-assistant-ui-v2.css'
import './dlavie-assistant-ui-v3.css'
import './dlavie-assistant-ui-v3-links.css'
import './dlavie-assistant-fast-composer.css'
import './dlavie-admin-support.css'
import './digiflazz-admin.css'
import './refund-center.css'
import './refund-admin-queue.css'
import './refund-investigation-v2.css'
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
    <DLavieDigitalMarket />
    <OrderCenter />
    <DLavieOrderEvidenceBridge />
    <ActivityViewEnhancer />
    <ActivityMetadataEnhancer />
    <MidtransPaymentSystem />
    <WalletHistoryEnhancer />
    <SiteDetailSystem />
    <MarketPolicies />
    <AccessExperience />
    <RefundCenter />
    <DLavieAssistant />
    <DLavieAssistantHaptics />
    <DLavieAssistantKnowledgeLinks />
    <DLavieAssistantSessionReconciler />
    <DLavieAssistantUIV2 />
    <DLavieAssistantFastComposer />
    <DLavieAssistantReceiptPolish />
    <DLavieAdminSupport />
    <DLavieDigiflazzAdmin />
    <DLavieRefundAdminQueue />
    <DLavieRadio />
    <App />
  </StrictMode>,
)
