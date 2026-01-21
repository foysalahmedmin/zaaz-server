import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as FeaturePopupServices from './feature-popup.service';

export const createFeaturePopup = catchAsync(async (req, res) => {
  const result = await FeaturePopupServices.createFeaturePopup(req.body, req);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature popup created successfully',
    data: result,
  });
});

export const getFeaturePopup = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeaturePopupServices.getFeaturePopup(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature popup retrieved successfully',
    data: result,
  });
});

export const getFeaturePopups = catchAsync(async (req, res) => {
  const result = await FeaturePopupServices.getFeaturePopups(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature popups retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getPublicFeaturePopups = catchAsync(async (req, res) => {
  const result = await FeaturePopupServices.getPublicFeaturePopups(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature popups retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updateFeaturePopup = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeaturePopupServices.updateFeaturePopup(
    id,
    req.body,
    req,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature popup updated successfully',
    data: result,
  });
});

export const deleteFeaturePopup = catchAsync(async (req, res) => {
  const { id } = req.params;
  await FeaturePopupServices.deleteFeaturePopup(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature popup soft deleted successfully',
    data: null,
  });
});

export const deleteFeaturePopupPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await FeaturePopupServices.deleteFeaturePopupPermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature popup permanently deleted successfully',
    data: null,
  });
});

export const deleteFeaturePopups = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await FeaturePopupServices.deleteFeaturePopups(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} feature popups soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteFeaturePopupsPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await FeaturePopupServices.deleteFeaturePopupsPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} feature popups permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restoreFeaturePopup = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeaturePopupServices.restoreFeaturePopup(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature popup restored successfully',
    data: result,
  });
});

export const restoreFeaturePopups = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await FeaturePopupServices.restoreFeaturePopups(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} feature popups restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
