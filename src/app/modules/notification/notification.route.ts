import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as NotificationControllers from './notification.controller';
import * as NotificationValidations from './notification.validation';

const router = express.Router();

// GET
router.get('/', auth('admin'), NotificationControllers.getNotifications);

router.get(
  '/:id',
  auth('admin'),
  validation(NotificationValidations.notificationOperationValidationSchema),
  NotificationControllers.getNotification,
);

// PATCH
router.patch(
  '/bulk',
  auth('admin'),
  validation(NotificationValidations.updateNotificationsValidationSchema),
  NotificationControllers.updateNotifications,
);

router.patch(
  '/:id',
  auth('admin'),
  validation(NotificationValidations.updateNotificationValidationSchema),
  NotificationControllers.updateNotification,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(NotificationValidations.notificationsOperationValidationSchema),
  NotificationControllers.deleteNotificationsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(NotificationValidations.notificationsOperationValidationSchema),
  NotificationControllers.deleteNotifications,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(NotificationValidations.notificationOperationValidationSchema),
  NotificationControllers.deleteNotificationPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(NotificationValidations.notificationOperationValidationSchema),
  NotificationControllers.deleteNotification,
);

// POST
router.post(
  '/',
  auth('admin'),
  validation(NotificationValidations.createNotificationValidationSchema),
  NotificationControllers.createNotification,
);

router.post(
  '/bulk/restore',
  auth('admin'),
  validation(NotificationValidations.notificationsOperationValidationSchema),
  NotificationControllers.restoreNotifications,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(NotificationValidations.notificationOperationValidationSchema),
  NotificationControllers.restoreNotification,
);

const NotificationRoutes = router;

export default NotificationRoutes;
