import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as CreditsProfitHistoryServices from './credits-profit-history.service';

export const getCreditsProfitHistories = catchAsync(async (req, res) => {
  const { creditsProfitId } = req.params;
  const result = await CreditsProfitHistoryServices.getCreditsProfitHistories(
    creditsProfitId,
    req.query,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits profit histories retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getCreditsProfitHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CreditsProfitHistoryServices.getCreditsProfitHistory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits profit history retrieved successfully',
    data: result,
  });
});

export const deleteCreditsProfitHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  await CreditsProfitHistoryServices.deleteCreditsProfitHistory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits profit history soft deleted successfully',
    data: null,
  });
});

export const deleteCreditsProfitHistoryPermanent = catchAsync(
  async (req, res) => {
    const { id } = req.params;
    await CreditsProfitHistoryServices.deleteCreditsProfitHistoryPermanent(id);
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Credits profit history permanently deleted successfully',
      data: null,
    });
  },
);

export const deleteCreditsProfitHistories = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await CreditsProfitHistoryServices.deleteCreditsProfitHistories(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} credits profit histories soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteCreditsProfitHistoriesPermanent = catchAsync(
  async (req, res) => {
    const { ids } = req.body;
    const result =
      await CreditsProfitHistoryServices.deleteCreditsProfitHistoriesPermanent(
        ids,
      );
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: `${result.count} credits profit histories permanently deleted successfully`,
      data: {
        not_found_ids: result.not_found_ids,
      },
    });
  },
);

export const restoreCreditsProfitHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await CreditsProfitHistoryServices.restoreCreditsProfitHistory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits profit history restored successfully',
    data: result,
  });
});

export const restoreCreditsProfitHistories = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await CreditsProfitHistoryServices.restoreCreditsProfitHistories(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} credits profit histories restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
