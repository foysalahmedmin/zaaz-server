import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as EventControllers from './event.controller';
import * as EventValidations from './event.validation';

const router = express.Router();

// GET
router.get('/public', EventControllers.getPublicEvents);
router.get('/', auth('admin'), EventControllers.getEvents);

router.get('/:id/public', EventControllers.getPublicEvent);
router.get(
  '/:id',
  auth('admin'),
  validation(EventValidations.eventOperationValidationSchema),
  EventControllers.getEvent,
);

// PATCH
router.patch(
  '/bulk',
  auth('admin'),
  validation(EventValidations.updateEventsValidationSchema),
  EventControllers.updateEvents,
);

router.patch(
  '/:id',
  auth('admin'),
  validation(EventValidations.updateEventValidationSchema),
  EventControllers.updateEvent,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(EventValidations.eventsOperationValidationSchema),
  EventControllers.deleteEventsPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(EventValidations.eventsOperationValidationSchema),
  EventControllers.deleteEvents,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(EventValidations.eventOperationValidationSchema),
  EventControllers.deleteEventPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(EventValidations.eventOperationValidationSchema),
  EventControllers.deleteEvent,
);

// POST
router.post(
  '/',
  auth('admin'),
  validation(EventValidations.createEventValidationSchema),
  EventControllers.createEvent,
);

router.post(
  '/bulk/restore',
  auth('admin'),
  validation(EventValidations.eventsOperationValidationSchema),
  EventControllers.restoreEvents,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(EventValidations.eventOperationValidationSchema),
  EventControllers.restoreEvent,
);

const EventRoutes = router;

export default EventRoutes;
