import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as ContactServices from './contact.service';

export const createContact = catchAsync(async (req, res) => {
  const payload = req.body || {};

  const result = await ContactServices.createContact(payload);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Contact message sent successfully',
    data: result,
  });
});

export const getContacts = catchAsync(async (req, res) => {
  const result = await ContactServices.getContacts(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Contacts retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getContact = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ContactServices.getContact(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Contact retrieved successfully',
    data: result,
  });
});

export const deleteContact = catchAsync(async (req, res) => {
  const { id } = req.params;
  await ContactServices.deleteContact(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Contact soft deleted successfully',
    data: null,
  });
});

export const deleteContactPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await ContactServices.deleteContactPermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Contact permanently deleted successfully',
    data: null,
  });
});

export const deleteContacts = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await ContactServices.deleteContacts(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} contacts soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteContactsPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await ContactServices.deleteContactsPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} contacts permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restoreContact = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ContactServices.restoreContact(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Contact restored successfully',
    data: result,
  });
});

export const restoreContacts = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await ContactServices.restoreContacts(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} contacts restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
