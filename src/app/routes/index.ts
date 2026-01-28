import express from 'express';
import { authRateLimiter } from '../middlewares/rate-limit.middleware';
import AuthRoutes from '../modules/auth/auth.route';
import ContactRoutes from '../modules/contact/contact.route';
import CouponRoutes from '../modules/coupon/coupon.route';
import CreditsProcessRoutes from '../modules/credits-process/credits-process.route';
import CreditsProfitHistoryRoutes from '../modules/credits-profit-history/credits-profit-history.route';
import CreditsProfitRoutes from '../modules/credits-profit/credits-profit.route';
import CreditsTransactionRoutes from '../modules/credits-transaction/credits-transaction.route';
import { CreditsUsageRoutes } from '../modules/credits-usage/credits-usage.route';
import DashboardRoutes from '../modules/dashboard/dashboard.route';
import FeatureEndpointRoutes from '../modules/feature-endpoint/feature-endpoint.route';
import FeaturePopupRoutes from '../modules/feature-popup/feature-popup.route';
import FeatureUsageLogRoutes from '../modules/feature-usage-log/feature-usage-log.route';
import FeatureRoutes from '../modules/feature/feature.route';
import NotificationRecipientRoutes from '../modules/notification-recipient/notification-recipient.route';
import NotificationRoutes from '../modules/notification/notification.route';
import PackageHistoryRoutes from '../modules/package-history/package-history.route';
import PackagePlanRoutes from '../modules/package-plan/package-plan.route';
import PackageRoutes from '../modules/package/package.route';
import PaymentMethodRoutes from '../modules/payment-method/payment-method.route';
import PaymentTransactionRoutes from '../modules/payment-transaction/payment-transaction.route';
import PlanRoutes from '../modules/plan/plan.route';
import { StorageRoutes } from '../modules/storage/storage.route';
import UserWalletRoutes from '../modules/user-wallet/user-wallet.route';
import UserRoutes from '../modules/user/user.route';

import { PackageTransactionRoutes } from '../modules/package-transaction/package-transaction.route';

import AiModelHistoryRoutes from '../modules/ai-model-history/ai-model-history.route';
import { AiModelRoutes } from '../modules/ai-model/ai-model.route';
import { BillingSettingHistoryRoutes } from '../modules/billing-setting-history/billing-setting-history.route';
import { BillingSettingRoutes } from '../modules/billing-setting/billing-setting.route';
import { PackageFeatureConfigRoutes } from '../modules/package-feature-config/package-feature-config.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/package-feature-configs',
    route: PackageFeatureConfigRoutes,
  },
  {
    path: '/auth',
    route: [authRateLimiter, AuthRoutes],
  },
  {
    path: '/dashboard',
    route: DashboardRoutes,
  },
  {
    path: '/ai-models',
    route: AiModelRoutes,
  },
  {
    path: '/ai-model-histories',
    route: AiModelHistoryRoutes,
  },
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/user-wallets',
    route: UserWalletRoutes,
  },
  {
    path: '/feature-usage-logs',
    route: FeatureUsageLogRoutes,
  },

  {
    path: '/features',
    route: FeatureRoutes,
  },
  {
    path: '/feature-endpoints',
    route: FeatureEndpointRoutes,
  },
  {
    path: '/feature-popups',
    route: FeaturePopupRoutes,
  },
  {
    path: '/plans',
    route: PlanRoutes,
  },
  {
    path: '/packages',
    route: PackageRoutes,
  },
  {
    path: '/package-plans',
    route: PackagePlanRoutes,
  },
  {
    path: '/coupons',
    route: CouponRoutes,
  },
  {
    path: '/package-histories',
    route: PackageHistoryRoutes,
  },
  {
    path: '/payment-methods',
    route: PaymentMethodRoutes,
  },
  {
    path: '/payment-transactions',
    route: PaymentTransactionRoutes,
  },
  {
    path: '/credits-profits',
    route: CreditsProfitRoutes,
  },
  {
    path: '/credits-profit-histories',
    route: CreditsProfitHistoryRoutes,
  },
  {
    path: '/credits-transactions',
    route: CreditsTransactionRoutes,
  },
  {
    path: '/contact',
    route: ContactRoutes,
  },
  {
    path: '/notifications',
    route: NotificationRoutes,
  },
  {
    path: '/notification-recipients',
    route: NotificationRecipientRoutes,
  },
  {
    path: '/credits-process',
    route: CreditsProcessRoutes,
  },
  {
    path: '/token-process',
    route: CreditsProcessRoutes,
  },
  {
    path: '/storage',
    route: StorageRoutes,
  },
  {
    path: '/package-transactions',
    route: PackageTransactionRoutes,
  },
  {
    path: '/billing-settings',
    route: BillingSettingRoutes,
  },
  {
    path: '/billing-setting-histories',
    route: BillingSettingHistoryRoutes,
  },
  {
    path: '/credits-usages',
    route: CreditsUsageRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
