import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ThemeSystem from './ThemeSystem'
import PageNavigation from './PageNavigation'
import CopyRefinement from './CopyRefinementV2'
import LanguageSystem from './LanguageSystem'
import NavUtilityMenu from './NavUtilityMenu'
import AccountSystem from './AccountSystem'
import LegacyNokosMarket from './LegacyNokosMarket'
import DLavieDigitalMarketV23 from './DLavieDigitalMarketV23'
import DigitalPostpaidPaymentGuard from './DigitalPostpaidPaymentGuard'
import DigitalHomeMarket from './DigitalHomeMarket'
import DLaviePromoBanners from './DLaviePromoBanners'
import DLavieFeedback from './DLavieFeedback'
import DLavieFeedbackAdmin from './DLavieFeedbackAdmin'
import OrderCenter from './OrderCenter'
import DigitalActivityFeed from './DigitalActivityFeed'
import DigitalActivityPageSync from './DigitalActivityPageSync'
import StateBridge from './StateBridge'
import DLavieRadio from './DLavieRadio'
import DLavieUtilityOrb from './DLavieUtilityOrb'
import ActivityViewEnhancer from './ActivityViewEnhancer'
import ActivityMetadataEnhancer from './ActivityMetadataEnhancer'
import MidtransPaymentSystem from './MidtransPaymentSystem'
import WalletHistoryEnhancer from './WalletHistoryEnhancer'
import SiteDetailSystem from './SiteDetailSystem'
import DigitalRouteContextV2 from './DigitalRouteContextV2'
import MarketPolicies from './MarketPolicies'
import DigitalPolicyCenterV2 from './DigitalPolicyCenterV2'
import AccessExperience from './AccessExperience'
import DigitalGuestDocumentationV2 from './DigitalGuestDocumentationV2'
import DLavieGuestDocsV36 from './DLavieGuestDocsV36'
import DigitalPositioningEnhancer from './DigitalPositioningEnhancer'
import LoginRedirectEnhancer from './LoginRedirectEnhancer'
import './DLavieAssistantEndpointV9'
import DLavieAssistant from './DLavieAssistant'
import DLavieAssistantHaptics from './DLavieAssistantHaptics'
import DLavieAssistantKnowledgeLinks from './DLavieAssistantKnowledgeLinks'
import DLavieAssistantSessionReconciler from './DLavieAssistantSessionReconciler'
import DLavieAssistantUIV2 from './DLavieAssistantUIV2'
import DLavieAssistantFastComposer from './DLavieAssistantFastComposer'
import DLavieAssistantReceiptPolish from './DLavieAssistantReceiptPolish'
import DLavieLiveSupportV34 from './DLavieLiveSupportV34'
import DLavieAdminSupport from './DLavieAdminSupport'
import DLavieH2HAdmin from './DLavieH2HAdmin'
import DLavieVIPaymentAdmin from './DLavieVIPaymentAdmin'
import RefundCenter from './RefundCenter'
import DLavieRefundAdminQueue from './DLavieRefundAdminQueue'
import DLavieOrderEvidenceBridge from './DLavieOrderEvidenceBridge'
import GoPayInspiredShell from './GoPayInspiredShell'
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
import './digital-market-v2.css'
import './digital-market-route-hardening.css'
import './digital-market-ui-v3.css'
import './digital-market-ui-v3-fix.css'
import './digital-market-ui-v4.css'
import './digital-market-mobile-v5.css'
import './digital-market-mobile-v6.css'
import './digital-market-v21.css'
import './digital-market-v22.css'
import './digital-market-v23.css'
import './digital-postpaid-payguard-v22.css'
import './dlavie-promo-banners-v24.css'
import './order-center.css'
import './service-brand-polish.css'
import './provider-logo-card.css'
import './microsoft-otp-polish.css'
import './ambient-player.css'
import './ambient-mobile-safe.css'
import './market-route-compact.css'
import './activity-view-polish.css'
import './digital-activity.css'
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
import './dlavie-live-support-v34.css'
import './digiflazz-admin.css'
import './digiflazz-admin-console-v15.css'
import './h2h-admin-ui-v18.css'
import './provider-admin-dock-v33.css'
import './refund-center.css'
import './refund-admin-queue.css'
import './refund-investigation-v2.css'
import './ios-form-zoom-fix.css'
import './route-height-fix-v2.css'
import './digital-content-sync-v7.css'
import './digital-context-sync-v7.css'
import './digital-guest-doc-v8.css'
import './professional-polish-v25.css'
import './theme-market-coherence-v26.css'
import './banner-logo-polish-v27.css'
import './transaction-banner-polish-v28.css'
import './receipt-action-dock-v28.css'
import './dlavie-utility-orb-v29.css'
import './dlavie-utility-orb-fix-v29-1.css'
import './dlavie-market-polish-v35.css'
import './dlavie-market-polish-v35-1.css'
import './dlavie-live-support-intake-v35-2.css'
import './dlavie-guest-docs-v36-visible.css'
import './gopay-inspired-v37.css'

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
    <LegacyNokosMarket />
    <DLavieDigitalMarketV23 />
    <DigitalPostpaidPaymentGuard />
    <DigitalHomeMarket />
    <DLaviePromoBanners />
    <DLavieFeedback />
    <OrderCenter />
    <DigitalActivityFeed />
    <DigitalActivityPageSync />
    <DLavieOrderEvidenceBridge />
    <ActivityViewEnhancer />
    <ActivityMetadataEnhancer />
    <MidtransPaymentSystem />
    <WalletHistoryEnhancer />
    <SiteDetailSystem />
    <DigitalRouteContextV2 />
    <MarketPolicies />
    <DigitalPolicyCenterV2 />
    <AccessExperience />
    <DigitalGuestDocumentationV2 />
    <DLavieGuestDocsV36 />
    <DigitalPositioningEnhancer />
    <RefundCenter />
    <DLavieAssistant />
    <DLavieAssistantHaptics />
    <DLavieAssistantKnowledgeLinks />
    <DLavieAssistantSessionReconciler />
    <DLavieAssistantUIV2 />
    <DLavieAssistantFastComposer />
    <DLavieAssistantReceiptPolish />
    <DLavieLiveSupportV34 />
    <DLavieAdminSupport />
    <DLavieH2HAdmin />
    <DLavieVIPaymentAdmin />
    <DLavieRefundAdminQueue />
    <DLavieFeedbackAdmin />
    <DLavieRadio />
    <DLavieUtilityOrb />
    <App />
    <GoPayInspiredShell />
  </StrictMode>,
)
