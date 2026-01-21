import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as AiModelHistoryControllers from './ai-model-history.controller';
import * as AiModelHistoryValidations from './ai-model-history.validation';

const router = express.Router();

// GET
router.get(
  '/ai-model/:aiModelId',
  auth('admin'),
  AiModelHistoryControllers.getAiModelHistories,
);

router.get(
  '/:id',
  auth('admin'),
  validation(AiModelHistoryValidations.aiModelHistoryOperationValidationSchema),
  AiModelHistoryControllers.getAiModelHistory,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(
    AiModelHistoryValidations.aiModelHistoriesOperationValidationSchema,
  ),
  AiModelHistoryControllers.deleteAiModelHistoriesPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(
    AiModelHistoryValidations.aiModelHistoriesOperationValidationSchema,
  ),
  AiModelHistoryControllers.deleteAiModelHistories,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(AiModelHistoryValidations.aiModelHistoryOperationValidationSchema),
  AiModelHistoryControllers.deleteAiModelHistoryPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(AiModelHistoryValidations.aiModelHistoryOperationValidationSchema),
  AiModelHistoryControllers.deleteAiModelHistory,
);

// POST - Restore
router.post(
  '/bulk/restore',
  auth('admin'),
  validation(
    AiModelHistoryValidations.aiModelHistoriesOperationValidationSchema,
  ),
  AiModelHistoryControllers.restoreAiModelHistories,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(AiModelHistoryValidations.aiModelHistoryOperationValidationSchema),
  AiModelHistoryControllers.restoreAiModelHistory,
);

const AiModelHistoryRoutes = router;

export default AiModelHistoryRoutes;
