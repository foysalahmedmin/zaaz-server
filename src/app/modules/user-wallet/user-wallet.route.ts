import express from 'express';
import auth from '../../middlewares/auth.middleware';
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

// PATCH
router.patch(
  '/:id',
  auth('admin'),
  validation(UserWalletValidations.updateUserWalletValidationSchema),
  UserWalletControllers.updateUserWallet,
);

// DELETE
router.delete(
  '/:id',
  auth('admin'),
  validation(UserWalletValidations.userWalletOperationValidationSchema),
  UserWalletControllers.deleteUserWallet,
);

const UserWalletRoutes = router;

export default UserWalletRoutes;
