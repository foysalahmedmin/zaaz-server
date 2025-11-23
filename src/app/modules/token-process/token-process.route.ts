import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as TokenProcessControllers from './token-process.controller';
import * as TokenProcessValidations from './token-process.validation';

const router = express.Router();

// POST - Token Process Start
router.post(
  '/start',
  auth('user', 'admin'),
  validation(TokenProcessValidations.tokenProcessStartValidationSchema),
  TokenProcessControllers.tokenProcessStart,
);

// POST - Token Process End
router.post(
  '/end',
  auth('user', 'admin'),
  validation(TokenProcessValidations.tokenProcessEndValidationSchema),
  TokenProcessControllers.tokenProcessEnd,
);

const TokenProcessRoutes = router;

export default TokenProcessRoutes;

