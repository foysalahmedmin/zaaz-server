import express from 'express';
import validation from '../../middlewares/validation.middleware';
import * as ContactControllers from './contact.controller';
import * as ContactValidations from './contact.validation';

const router = express.Router();

// POST
router.post(
  '/',
  validation(ContactValidations.createContactValidationSchema),
  ContactControllers.createContact,
);

const ContactRoutes = router;

export default ContactRoutes;

