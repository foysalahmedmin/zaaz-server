import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as NotificationRecipientControllers from './notification-recipient.controller';
import * as NotificationRecipientValidations from './notification-recipient.validation';

const router = express.Router();

// GET
router.get(
  '/self',
  auth('admin', 'user'),
  NotificationRecipientControllers.getSelfNotificationRecipients,
);

router.get(
  '/',
  auth('admin'),
  NotificationRecipientControllers.getNotificationRecipients,
);

router.get(
  '/:id/self',
  auth('admin', 'user'),
  validation(
    NotificationRecipientValidations.notificationRecipientOperationValidationSchema,
  ),
  NotificationRecipientControllers.getSelfNotificationRecipient,
);

router.get(
  '/:id',
  auth('admin'),
  validation(
    NotificationRecipientValidations.notificationRecipientOperationValidationSchema,
  ),
  NotificationRecipientControllers.getNotificationRecipient,
);

// PATCH
router.patch(
  '/read-all/self',
  auth('admin', 'user'),
  NotificationRecipientControllers.readAllNotificationRecipients,
);

router.patch(
  '/bulk/self',
  auth('admin', 'user'),
  validation(
    NotificationRecipientValidations.updateSelfNotificationRecipientsValidationSchema,
  ),
  NotificationRecipientControllers.updateNotificationRecipients,
);

router.patch(
  '/:id/self',
  auth('admin', 'user'),
  validation(
    NotificationRecipientValidations.updateSelfNotificationRecipientValidationSchema,
  ),
  NotificationRecipientControllers.updateSelfNotificationRecipient,
);

router.patch(
  '/bulk',
  auth('admin'),
  validation(
    NotificationRecipientValidations.updateNotificationRecipientsValidationSchema,
  ),
  NotificationRecipientControllers.updateNotificationRecipients,
);

router.patch(
  '/:id',
  auth('admin'),
  validation(
    NotificationRecipientValidations.updateNotificationRecipientValidationSchema,
  ),
  NotificationRecipientControllers.updateNotificationRecipient,
);

// DELETE
router.delete(
  '/bulk/self',
  auth('admin', 'user'),
  validation(
    NotificationRecipientValidations.notificationRecipientsOperationValidationSchema,
  ),
  NotificationRecipientControllers.deleteSelfNotificationRecipients,
);

router.delete(
  '/all/self',
  auth('admin', 'user'),
  NotificationRecipientControllers.deleteAllSelfNotificationRecipients,
);

router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(
    NotificationRecipientValidations.notificationRecipientsOperationValidationSchema,
  ),
  NotificationRecipientControllers.deleteNotificationRecipientsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(
    NotificationRecipientValidations.notificationRecipientsOperationValidationSchema,
  ),
  NotificationRecipientControllers.deleteNotificationRecipients,
);

router.delete(
  '/:id/self',
  auth('admin', 'user'),
  validation(
    NotificationRecipientValidations.notificationRecipientOperationValidationSchema,
  ),
  NotificationRecipientControllers.deleteSelfNotificationRecipient,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(
    NotificationRecipientValidations.notificationRecipientOperationValidationSchema,
  ),
  NotificationRecipientControllers.deleteNotificationRecipientPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(
    NotificationRecipientValidations.notificationRecipientOperationValidationSchema,
  ),
  NotificationRecipientControllers.deleteNotificationRecipient,
);

// POST
router.post(
  '/',
  auth('admin', 'user'),
  validation(
    NotificationRecipientValidations.createNotificationRecipientValidationSchema,
  ),
  NotificationRecipientControllers.createNotificationRecipient,
);

router.post(
  '/bulk/restore/self',
  auth('admin', 'user'),
  validation(
    NotificationRecipientValidations.notificationRecipientsOperationValidationSchema,
  ),
  NotificationRecipientControllers.restoreSelfNotificationRecipients,
);

router.post(
  '/bulk/restore',
  auth('admin'),
  validation(
    NotificationRecipientValidations.notificationRecipientsOperationValidationSchema,
  ),
  NotificationRecipientControllers.restoreNotificationRecipients,
);

router.post(
  '/:id/restore/self',
  auth('admin', 'user'),
  validation(
    NotificationRecipientValidations.notificationRecipientOperationValidationSchema,
  ),
  NotificationRecipientControllers.restoreSelfNotificationRecipient,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(
    NotificationRecipientValidations.notificationRecipientOperationValidationSchema,
  ),
  NotificationRecipientControllers.restoreNotificationRecipient,
);

const NotificationRecipientRoutes = router;

export default NotificationRecipientRoutes;
