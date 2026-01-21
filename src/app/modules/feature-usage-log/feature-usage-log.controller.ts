import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as FeatureUsageLogService from './feature-usage-log.service';

/**
 * Handle request to create a feature usage log
 */
export const createFeatureUsageLog = catchAsync(async (req, res) => {
  const result = await FeatureUsageLogService.createFeatureUsageLog(req.body);

  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Feature usage log created successfully',
    data: result,
  });
});

/**
 * Handle request to get all feature usage logs
 */
export const getFeatureUsageLogs = catchAsync(async (req, res) => {
  const result = await FeatureUsageLogService.getFeatureUsageLogs(req.query);

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature usage logs retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

/**
 * Handle request to get single feature usage log by ID
 */
export const getFeatureUsageLogById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeatureUsageLogService.getFeatureUsageLog(id);

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature usage log retrieved successfully',
    data: result,
  });
});

/**
 * Handle request to soft delete feature usage log
 */
export const deleteFeatureUsageLog = catchAsync(async (req, res) => {
  const { id } = req.params;
  await FeatureUsageLogService.deleteFeatureUsageLog(id);

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature usage log soft deleted successfully',
    data: null,
  });
});

/**
 * Handle request to permanently delete feature usage log
 */
export const deleteFeatureUsageLogPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await FeatureUsageLogService.deleteFeatureUsageLogPermanent(id);

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature usage log permanently deleted successfully',
    data: null,
  });
});

/**
 * Handle request to soft delete multiple feature usage logs
 */
export const deleteFeatureUsageLogs = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await FeatureUsageLogService.deleteFeatureUsageLogs(ids);

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} feature usage logs soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

/**
 * Handle request to permanently delete multiple feature usage logs
 */
export const deleteFeatureUsageLogsPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await FeatureUsageLogService.deleteFeatureUsageLogsPermanent(ids);

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} feature usage logs permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
