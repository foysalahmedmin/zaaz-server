import express from 'express';
import ContactRoutes from '../modules/contact/contact.route';
import FeatureEndpointRoutes from '../modules/feature-endpoint/feature-endpoint.route';
import FeatureRoutes from '../modules/feature/feature.route';
import PackageHistoryRoutes from '../modules/package-history/package-history.route';
import PackageRoutes from '../modules/package/package.route';
import PaymentMethodRoutes from '../modules/payment-method/payment-method.route';
import PaymentTransactionRoutes from '../modules/payment-transaction/payment-transaction.route';
import TokenProfitHistoryRoutes from '../modules/token-profit-history/token-profit-history.route';
import TokenProfitRoutes from '../modules/token-profit/token-profit.route';
import TokenTransactionRoutes from '../modules/token-transaction/token-transaction.route';
import UserWalletRoutes from '../modules/user-wallet/user-wallet.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/contact',
    route: ContactRoutes,
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
    path: '/packages',
    route: PackageRoutes,
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
    path: '/token-profits',
    route: TokenProfitRoutes,
  },
  {
    path: '/token-profit-histories',
    route: TokenProfitHistoryRoutes,
  },
  {
    path: '/token-transactions',
    route: TokenTransactionRoutes,
  },
  {
    path: '/user-wallets',
    route: UserWalletRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
