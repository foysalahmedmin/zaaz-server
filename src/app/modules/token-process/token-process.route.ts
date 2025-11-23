import express from 'express';
import serverAuth from '../../middlewares/server-auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as TokenProcessControllers from './token-process.controller';
import * as TokenProcessValidations from './token-process.validation';

const router = express.Router();

// POST - Token Process Start
router.post(
  '/start',
  serverAuth(),
  validation(TokenProcessValidations.tokenProcessStartValidationSchema),
  TokenProcessControllers.tokenProcessStart,
);

// POST - Token Process End
router.post(
  '/end',
  serverAuth(),
  validation(TokenProcessValidations.tokenProcessEndValidationSchema),
  TokenProcessControllers.tokenProcessEnd,
);

const TokenProcessRoutes = router;

export default TokenProcessRoutes;
