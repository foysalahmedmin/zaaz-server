import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as IntervalControllers from './interval.controller';
import * as IntervalValidations from './interval.validator';

const router = express.Router();

router.get('/public', IntervalControllers.getPublicIntervals);

router.get('/', auth('admin'), IntervalControllers.getIntervals);

router.get(
  '/:id',
  auth('admin'),
  validation(IntervalValidations.intervalOperationValidationSchema),
  IntervalControllers.getInterval,
);

router.patch(
  '/bulk',
  auth('admin'),
  validation(IntervalValidations.updateIntervalsValidationSchema),
  IntervalControllers.updateIntervals,
);

router.patch(
  '/:id',
  auth('admin'),
  validation(IntervalValidations.updateIntervalValidationSchema),
  IntervalControllers.updateInterval,
);

router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(IntervalValidations.intervalsOperationValidationSchema),
  IntervalControllers.deleteIntervalsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(IntervalValidations.intervalsOperationValidationSchema),
  IntervalControllers.deleteIntervals,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(IntervalValidations.intervalOperationValidationSchema),
  IntervalControllers.deleteIntervalPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(IntervalValidations.intervalOperationValidationSchema),
  IntervalControllers.deleteInterval,
);

router.post(
  '/',
  auth('admin'),
  validation(IntervalValidations.createIntervalValidationSchema),
  IntervalControllers.createInterval,
);

router.post(
  '/bulk/restore',
  auth('admin'),
  validation(IntervalValidations.intervalsOperationValidationSchema),
  IntervalControllers.restoreIntervals,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(IntervalValidations.intervalOperationValidationSchema),
  IntervalControllers.restoreInterval,
);

const IntervalRoutes = router;

export default IntervalRoutes;
