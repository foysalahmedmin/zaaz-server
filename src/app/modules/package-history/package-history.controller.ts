import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as PackageHistoryServices from './package-history.service';

export const getPackageHistories = catchAsync(async (req, res) => {
  const { packageId } = req.params;
  const result = await PackageHistoryServices.getPackageHistories(
    packageId,
    req.query,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package histories retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getPackageHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackageHistoryServices.getPackageHistory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package history retrieved successfully',
    data: result,
  });
});

export const deletePackageHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PackageHistoryServices.deletePackageHistory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package history soft deleted successfully',
    data: null,
  });
});

export const deletePackageHistoryPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PackageHistoryServices.deletePackageHistoryPermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package history permanently deleted successfully',
    data: null,
  });
});

export const deletePackageHistories = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PackageHistoryServices.deletePackageHistories(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} package histories soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deletePackageHistoriesPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await PackageHistoryServices.deletePackageHistoriesPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} package histories permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restorePackageHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackageHistoryServices.restorePackageHistory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package history restored successfully',
    data: result,
  });
});

export const restorePackageHistories = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PackageHistoryServices.restorePackageHistories(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} package histories restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
