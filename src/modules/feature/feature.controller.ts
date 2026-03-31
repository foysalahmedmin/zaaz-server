import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import * as FeatureServices from './feature.service';

export const createFeature = catchAsync(async (req, res) => {
  const result = await FeatureServices.createFeature(req.body);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature created successfully',
    data: result,
  });
});

export const getPublicFeature = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeatureServices.getPublicFeature(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature retrieved successfully',
    data: result,
  });
});

export const getFeature = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeatureServices.getFeature(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature retrieved successfully',
    data: result,
  });
});

export const getPublicFeatures = catchAsync(async (req, res) => {
  const result = await FeatureServices.getPublicFeatures(req.query);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Features retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getPublicFeaturesWithPopups = catchAsync(async (req, res) => {
  const result = await FeatureServices.getPublicFeaturesWithConfigs(req.query);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Features with popups retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getFeatures = catchAsync(async (req, res) => {
  const result = await FeatureServices.getFeatures(req.query);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Features retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updateFeature = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeatureServices.updateFeature(id, req.body);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature updated successfully',
    data: result,
  });
});

export const updateFeatures = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result = await FeatureServices.updateFeatures(ids, payload);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Features updated successfully',
    data: result,
  });
});

export const deleteFeature = catchAsync(async (req, res) => {
  const { id } = req.params;
  await FeatureServices.deleteFeature(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature soft deleted successfully',
    data: null,
  });
});

export const deleteFeaturePermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await FeatureServices.deleteFeaturePermanent(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature permanently deleted successfully',
    data: null,
  });
});

export const deleteFeatures = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await FeatureServices.deleteFeatures(ids);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} features soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteFeaturesPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await FeatureServices.deleteFeaturesPermanent(ids);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} features permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restoreFeature = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeatureServices.restoreFeature(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature restored successfully',
    data: result,
  });
});

export const restoreFeatures = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await FeatureServices.restoreFeatures(ids);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} features restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});


