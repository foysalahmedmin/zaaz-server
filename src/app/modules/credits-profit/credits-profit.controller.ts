import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as CreditsProfitServices from './credits-profit.service';

export const createCreditsProfit = catchAsync(async (req, res) => {
  const result = await CreditsProfitServices.createCreditsProfit(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits profit created successfully',
    data: result,
  });
});

export const getPublicCreditsProfit = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CreditsProfitServices.getPublicCreditsProfit(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits profit retrieved successfully',
    data: result,
  });
});

export const getCreditsProfit = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CreditsProfitServices.getCreditsProfit(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits profit retrieved successfully',
    data: result,
  });
});

export const getPublicCreditsProfits = catchAsync(async (req, res) => {
  const result = await CreditsProfitServices.getPublicCreditsProfits(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits profits retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getCreditsProfits = catchAsync(async (req, res) => {
  const result = await CreditsProfitServices.getCreditsProfits(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits profits retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updateCreditsProfit = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CreditsProfitServices.updateCreditsProfit(id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits profit updated successfully',
    data: result,
  });
});

export const updateCreditsProfits = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result = await CreditsProfitServices.updateCreditsProfits(ids, payload);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits profits updated successfully',
    data: result,
  });
});

export const deleteCreditsProfit = catchAsync(async (req, res) => {
  const { id } = req.params;
  await CreditsProfitServices.deleteCreditsProfit(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits profit soft deleted successfully',
    data: null,
  });
});

export const deleteCreditsProfitPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await CreditsProfitServices.deleteCreditsProfitPermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits profit permanently deleted successfully',
    data: null,
  });
});

export const deleteCreditsProfits = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await CreditsProfitServices.deleteCreditsProfits(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} credits profits soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteCreditsProfitsPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await CreditsProfitServices.deleteCreditsProfitsPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} credits profits permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restoreCreditsProfit = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CreditsProfitServices.restoreCreditsProfit(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits profit restored successfully',
    data: result,
  });
});

export const restoreCreditsProfits = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await CreditsProfitServices.restoreCreditsProfits(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} credits profits restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
