import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as DashboardControllers from './dashboard.controller';
import * as DashboardValidations from './dashboard.validation';

const router = express.Router();

router.get(
  '/statistics',
  auth('admin', 'super-admin'),
  DashboardControllers.getDashboardStatistics,
);

router.get(
  '/revenue',
  auth('admin', 'super-admin'),
  validation(DashboardValidations.dashboardPeriodValidationSchema),
  DashboardControllers.getDashboardRevenue,
);

router.get(
  '/transactions',
  auth('admin', 'super-admin'),
  DashboardControllers.getDashboardTransactions,
);

router.get(
  '/payment-methods',
  auth('admin', 'super-admin'),
  DashboardControllers.getDashboardPaymentMethods,
);

router.get(
  '/token-flow',
  auth('admin', 'super-admin'),
  validation(DashboardValidations.dashboardPeriodValidationSchema),
  DashboardControllers.getDashboardTokenFlow,
);

router.get(
  '/user-growth',
  auth('admin', 'super-admin'),
  validation(DashboardValidations.dashboardPeriodValidationSchema),
  DashboardControllers.getDashboardUserGrowth,
);

router.get(
  '/packages',
  auth('admin', 'super-admin'),
  DashboardControllers.getDashboardPackages,
);

router.get(
  '/features',
  auth('admin', 'super-admin'),
  DashboardControllers.getDashboardFeatures,
);

const DashboardRoutes = router;

export default DashboardRoutes;

