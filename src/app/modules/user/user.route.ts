import express from 'express';
import auth from '../../middlewares/auth.middleware';
import file from '../../middlewares/file.middleware';
import validation from '../../middlewares/validation.middleware';
import * as UserControllers from './user.controller';
import * as UserValidations from './user.validation';

const router = express.Router();

// GET
router.get('/self', auth('admin', 'user'), UserControllers.getSelf);

router.get('/writers', UserControllers.getWritersUsers);

router.get('/', auth('admin'), UserControllers.getUsers);

router.get(
  '/:id',
  auth('admin'),
  validation(UserValidations.userOperationValidationSchema),
  UserControllers.getUser,
);

// PATCH
router.patch(
  '/self',
  auth('admin', 'user'),
  file({
    name: 'image',
    folder: '/users',
    size: 5_000_000,
    maxCount: 1,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  }),
  validation(UserValidations.updateSelfValidationSchema),
  UserControllers.updateSelf,
);

router.patch(
  '/bulk',
  auth('admin'),
  validation(UserValidations.updateUsersValidationSchema),
  UserControllers.updateUsers,
);

router.patch(
  '/:id',
  auth('admin'),
  file({
    name: 'image',
    folder: '/users',
    size: 5_000_000,
    maxCount: 1,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  }),
  validation(UserValidations.updateUserValidationSchema),
  UserControllers.updateUser,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(UserValidations.usersOperationValidationSchema),
  UserControllers.deleteUsersPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(UserValidations.usersOperationValidationSchema),
  UserControllers.deleteUsers,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(UserValidations.userOperationValidationSchema),
  UserControllers.deleteUserPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(UserValidations.userOperationValidationSchema),
  UserControllers.deleteUser,
);

// POST
router.post(
  '/bulk/restore',
  auth('admin'),
  validation(UserValidations.usersOperationValidationSchema),
  UserControllers.restoreUsers,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(UserValidations.userOperationValidationSchema),
  UserControllers.restoreUser,
);

const UserRoutes = router;

export default UserRoutes;
