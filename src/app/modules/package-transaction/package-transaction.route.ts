import express from 'express';
import auth from '../../middlewares/auth.middleware';
import * as PackageTransactionControllers from './package-transaction.controller';

const router = express.Router();

// GET
router.get(
  '/self',
  auth('admin', 'user'),
  PackageTransactionControllers.getSelfPackageTransactions,
);

router.get(
  '/',
  auth('admin', 'super-admin'),
  PackageTransactionControllers.getPackageTransactions,
);

router.get(
  '/:id',
  auth('admin', 'super-admin'),
  PackageTransactionControllers.getPackageTransactionById,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin', 'super-admin'),
  PackageTransactionControllers.deletePackageTransactionsPermanent,
);

router.delete(
  '/bulk',
  auth('admin', 'super-admin'),
  PackageTransactionControllers.deletePackageTransactions,
);

router.delete(
  '/:id/permanent',
  auth('admin', 'super-admin'),
  PackageTransactionControllers.deletePackageTransactionPermanent,
);

router.delete(
  '/:id',
  auth('admin', 'super-admin'),
  PackageTransactionControllers.deletePackageTransaction,
);

// POST - Restore
router.post(
  '/bulk/restore',
  auth('admin', 'super-admin'),
  PackageTransactionControllers.restorePackageTransactions,
);

router.post(
  '/:id/restore',
  auth('admin', 'super-admin'),
  PackageTransactionControllers.restorePackageTransaction,
);

const PackageTransactionRoutes = router;

export { PackageTransactionRoutes };
export default PackageTransactionRoutes;
