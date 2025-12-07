import express from 'express';
import auth from '../../middlewares/auth.middleware';
import serverAuth from '../../middlewares/server-auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as UserWalletControllers from './user-wallet.controller';
import * as UserWalletValidations from './user-wallet.validation';

const router = express.Router();

// GET
router.get('/self', auth('user', 'admin'), UserWalletControllers.getSelfWallet);
router.get(
  '/',
  auth('admin'),
  UserWalletControllers.getUserWallets,
);
router.get(
  '/user/:user_id',
  auth('admin'),
  validation(UserWalletValidations.getUserWalletValidationSchema),
  UserWalletControllers.getUserWallet,
);
router.get(
  '/:id',
  auth('admin'),
  validation(UserWalletValidations.userWalletOperationValidationSchema),
  UserWalletControllers.getUserWalletById,
);

// POST
router.post(
  '/',
  auth('admin'),
  validation(UserWalletValidations.createUserWalletValidationSchema),
  UserWalletControllers.createUserWallet,
);

router.post(
  '/give-initial-package/self',
  auth('admin', 'user'),
  UserWalletControllers.giveSelfInitialPackage,
);

router.post(
  '/give-initial-package',
  serverAuth(),
  validation(UserWalletValidations.giveInitialPackageValidationSchema),
  UserWalletControllers.giveInitialPackage,
);

router.post(
  '/give-initial-token',
  serverAuth(),
  validation(UserWalletValidations.giveInitialTokenValidationSchema),
  UserWalletControllers.giveInitialToken,
);

router.post(
  '/give-bonus-token',
  serverAuth(),
  validation(UserWalletValidations.giveBonusTokenValidationSchema),
  UserWalletControllers.giveBonusToken,
);

// PATCH
router.patch(
  '/:id',
  auth('admin'),
  validation(UserWalletValidations.updateUserWalletValidationSchema),
  UserWalletControllers.updateUserWallet,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(UserWalletValidations.userWalletsOperationValidationSchema),
  UserWalletControllers.deleteUserWalletsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(UserWalletValidations.userWalletsOperationValidationSchema),
  UserWalletControllers.deleteUserWallets,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(UserWalletValidations.userWalletOperationValidationSchema),
  UserWalletControllers.deleteUserWalletPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(UserWalletValidations.userWalletOperationValidationSchema),
  UserWalletControllers.deleteUserWallet,
);

// POST - Restore
router.post(
  '/bulk/restore',
  auth('admin'),
  validation(UserWalletValidations.userWalletsOperationValidationSchema),
  UserWalletControllers.restoreUserWallets,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(UserWalletValidations.userWalletOperationValidationSchema),
  UserWalletControllers.restoreUserWallet,
);

const UserWalletRoutes = router;

export default UserWalletRoutes;
