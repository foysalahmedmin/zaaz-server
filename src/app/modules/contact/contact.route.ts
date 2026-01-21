import express from 'express';
import auth from '../../middlewares/auth.middleware';
import { rateLimiter } from '../../middlewares/rate-limit.middleware';
import validation from '../../middlewares/validation.middleware';
import * as ContactControllers from './contact.controller';
import * as ContactValidations from './contact.validation';

const router = express.Router();

const contactRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many contact requests, please try again after an hour',
});

// GET
// ... (lines 10-23)
router.get(
  '/',
  auth('admin'),
  validation(ContactValidations.getContactsValidationSchema),
  ContactControllers.getContacts,
);

router.get(
  '/:id',
  auth('admin'),
  validation(ContactValidations.contactOperationValidationSchema),
  ContactControllers.getContact,
);

// POST
router.post(
  '/',
  contactRateLimiter,
  validation(ContactValidations.createContactValidationSchema),
  ContactControllers.createContact,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(ContactValidations.contactsOperationValidationSchema),
  ContactControllers.deleteContactsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(ContactValidations.contactsOperationValidationSchema),
  ContactControllers.deleteContacts,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(ContactValidations.contactOperationValidationSchema),
  ContactControllers.deleteContactPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(ContactValidations.contactOperationValidationSchema),
  ContactControllers.deleteContact,
);

// POST - Restore
router.post(
  '/bulk/restore',
  auth('admin'),
  validation(ContactValidations.contactsOperationValidationSchema),
  ContactControllers.restoreContacts,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(ContactValidations.contactOperationValidationSchema),
  ContactControllers.restoreContact,
);

const ContactRoutes = router;

export default ContactRoutes;
