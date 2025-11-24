import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as PlanServices from './plan.service';

export const createPlan = catchAsync(async (req, res) => {
  const result = await PlanServices.createPlan(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Plan created successfully',
    data: result,
  });
});

export const getPlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PlanServices.getPlan(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Plan retrieved successfully',
    data: result,
  });
});

export const getPlans = catchAsync(async (req, res) => {
  const result = await PlanServices.getPlans(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Plans retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updatePlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PlanServices.updatePlan(id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Plan updated successfully',
    data: result,
  });
});

export const updatePlans = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result = await PlanServices.updatePlans(ids, payload);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Plans updated successfully',
    data: result,
  });
});

export const deletePlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PlanServices.deletePlan(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Plan soft deleted successfully',
    data: null,
  });
});

export const deletePlanPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PlanServices.deletePlanPermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Plan permanently deleted successfully',
    data: null,
  });
});

export const deletePlans = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PlanServices.deletePlans(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} plans soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deletePlansPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PlanServices.deletePlansPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} plans permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restorePlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PlanServices.restorePlan(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Plan restored successfully',
    data: result,
  });
});

export const restorePlans = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PlanServices.restorePlans(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} plans restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

