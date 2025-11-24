import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as PackagePlanServices from './package-plan.service';

export const createPackagePlan = catchAsync(async (req, res) => {
  const result = await PackagePlanServices.createPackagePlan(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package-plan created successfully',
    data: result,
  });
});

export const createPackagePlans = catchAsync(async (req, res) => {
  const result = await PackagePlanServices.createPackagePlans(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package-plans created successfully',
    data: result,
  });
});

export const getPackagePlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackagePlanServices.getPackagePlan(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package-plan retrieved successfully',
    data: result,
  });
});

export const getPackagePlans = catchAsync(async (req, res) => {
  const result = await PackagePlanServices.getPackagePlans(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package-plans retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updatePackagePlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackagePlanServices.updatePackagePlan(id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package-plan updated successfully',
    data: result,
  });
});

export const deletePackagePlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PackagePlanServices.deletePackagePlan(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package-plan soft deleted successfully',
    data: null,
  });
});

