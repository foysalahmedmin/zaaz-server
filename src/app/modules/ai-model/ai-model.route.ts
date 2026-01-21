import express from 'express';
import validateRequest from '../../middlewares/validation.middleware';
import * as AiModelController from './ai-model.controller';
import {
  aiModelsOperationValidationSchema,
  createAiModelValidationSchema,
  updateAiModelValidationSchema,
} from './ai-model.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(createAiModelValidationSchema),
  AiModelController.createAiModel,
);

router.get('/', AiModelController.getAllAiModels);

router.get('/:id', AiModelController.getAiModel);

router.patch(
  '/:id',
  validateRequest(updateAiModelValidationSchema),
  AiModelController.updateAiModel,
);

// Bulk operations
router.delete(
  '/bulk/permanent',
  validateRequest(aiModelsOperationValidationSchema),
  AiModelController.deleteAiModelsPermanent,
);

router.delete(
  '/bulk',
  validateRequest(aiModelsOperationValidationSchema),
  AiModelController.deleteAiModels,
);

router.post(
  '/bulk/restore',
  validateRequest(aiModelsOperationValidationSchema),
  AiModelController.restoreAiModels,
);

// Single operations
router.delete('/:id/permanent', AiModelController.deleteAiModelPermanent);

router.post('/:id/restore', AiModelController.restoreAiModel);

router.delete('/:id', AiModelController.deleteAiModel);

export const AiModelRoutes = router;
