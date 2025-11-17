import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as EventServices from './event.service';

export const createEvent = catchAsync(async (req, res) => {
  const result = await EventServices.createEvent(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Event created successfully',
    data: result,
  });
});

export const getPublicEvent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await EventServices.getPublicEvent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Event retrieved successfully',
    data: result,
  });
});

export const getEvent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await EventServices.getEvent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Event retrieved successfully',
    data: result,
  });
});

export const getPublicEvents = catchAsync(async (req, res) => {
  const result = await EventServices.getPublicEvents(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Events retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getEvents = catchAsync(async (req, res) => {
  const result = await EventServices.getEvents(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Events retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updateEvent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await EventServices.updateEvent(id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Event updated successfully',
    data: result,
  });
});

export const updateEvents = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result = await EventServices.updateEvents(ids, payload);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Events updated successfully',
    data: result,
  });
});

export const deleteEvent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await EventServices.deleteEvent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Event soft deleted successfully',
    data: null,
  });
});

export const deleteEventPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await EventServices.deleteEventPermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Event permanently deleted successfully',
    data: null,
  });
});

export const deleteEvents = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await EventServices.deleteEvents(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} events soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteEventsPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await EventServices.deleteEventsPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} events permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restoreEvent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await EventServices.restoreEvent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Event restored successfully',
    data: result,
  });
});

export const restoreEvents = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await EventServices.restoreEvents(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} events restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
