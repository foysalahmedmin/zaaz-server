import express from 'express';
import auth from '../../middlewares/auth.middleware';
import developmentAuth from '../../middlewares/development-auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as CreditsUsageControllers from './credits-usage.controller';
import { createCreditsUsageValidationSchema } from './credits-usage.validation';

const router = express.Router();

router.post(
  '/',
  auth('admin', 'super-admin'),
  validation(createCreditsUsageValidationSchema),
  CreditsUsageControllers.createCreditsUsage,
);

router.get(
  '/',
  auth('admin', 'super-admin'),
  CreditsUsageControllers.getCreditsUsages,
);

router.get(
  '/usage-key/:usage_key',
  developmentAuth(),
  CreditsUsageControllers.getCreditsUsagesByUsageKey,
);

router.get(
  '/:id',
  auth('admin', 'super-admin'),
  CreditsUsageControllers.getCreditsUsageById,
);

router.delete(
  '/:id',
  auth('admin', 'super-admin'),
  CreditsUsageControllers.deleteCreditsUsage,
);

export const CreditsUsageRoutes = router;
