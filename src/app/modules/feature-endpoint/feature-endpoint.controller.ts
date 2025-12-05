import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as FeatureEndpointServices from './feature-endpoint.service';

export const createFeatureEndpoint = catchAsync(async (req, res) => {
  const result = await FeatureEndpointServices.createFeatureEndpoint(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature endpoint created successfully',
    data: result,
  });
});

export const getPublicFeatureEndpoint = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeatureEndpointServices.getPublicFeatureEndpoint(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature endpoint retrieved successfully',
    data: result,
  });
});

export const getFeatureEndpoint = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeatureEndpointServices.getFeatureEndpoint(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature endpoint retrieved successfully',
    data: result,
  });
});

export const getPublicFeatureEndpoints = catchAsync(async (req, res) => {
  const result = await FeatureEndpointServices.getPublicFeatureEndpoints(
    req.query,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature endpoints retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getFeatureEndpoints = catchAsync(async (req, res) => {
  const result = await FeatureEndpointServices.getFeatureEndpoints(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature endpoints retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updateFeatureEndpoint = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeatureEndpointServices.updateFeatureEndpoint(
    id,
    req.body,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature endpoint updated successfully',
    data: result,
  });
});

export const updateFeatureEndpoints = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result = await FeatureEndpointServices.updateFeatureEndpoints(
    ids,
    payload,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature endpoints updated successfully',
    data: result,
  });
});

export const deleteFeatureEndpoint = catchAsync(async (req, res) => {
  const { id } = req.params;
  await FeatureEndpointServices.deleteFeatureEndpoint(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature endpoint soft deleted successfully',
    data: null,
  });
});

export const deleteFeatureEndpointPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await FeatureEndpointServices.deleteFeatureEndpointPermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature endpoint permanently deleted successfully',
    data: null,
  });
});

export const deleteFeatureEndpoints = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await FeatureEndpointServices.deleteFeatureEndpoints(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} feature endpoints soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteFeatureEndpointsPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await FeatureEndpointServices.deleteFeatureEndpointsPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} feature endpoints permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restoreFeatureEndpoint = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeatureEndpointServices.restoreFeatureEndpoint(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature endpoint restored successfully',
    data: result,
  });
});

export const restoreFeatureEndpoints = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await FeatureEndpointServices.restoreFeatureEndpoints(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} feature endpoints restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
