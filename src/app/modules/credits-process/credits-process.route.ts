import express from 'express';
import serverAuth from '../../middlewares/server-auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as CreditsProcessControllers from './credits-process.controller';
import * as CreditsProcessValidations from './credits-process.validation';

const router = express.Router();

// POST - Credits Process Start
router.post(
  '/start',
  serverAuth(),
  validation(CreditsProcessValidations.creditsProcessStartValidationSchema),
  CreditsProcessControllers.creditsProcessStart,
);

// POST - Credits Process End
router.post(
  '/end',
  serverAuth(),
  validation(CreditsProcessValidations.creditsProcessEndValidationSchema),
  CreditsProcessControllers.creditsProcessEnd,
);

const CreditsProcessRoutes = router;

export default CreditsProcessRoutes;
