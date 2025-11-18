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

