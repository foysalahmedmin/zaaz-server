import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import * as CreditsProfitHistoryServices from './credits-profit-history.service';

export const getCreditsProfitHistories = catchAsync(async (req, res) => {
  const { creditsProfitId } = req.params;
  const result = await CreditsProfitHistoryServices.getCreditsProfitHistories(
    creditsProfitId,
    req.query,
  );
  responseFormatter(res, {
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
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits profit history retrieved successfully',
    data: result,
  });
});

export const deleteCreditsProfitHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  await CreditsProfitHistoryServices.deleteCreditsProfitHistory(id);
  responseFormatter(res, {
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
    responseFormatter(res, {
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
  responseFormatter(res, {
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
    responseFormatter(res, {
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
  responseFormatter(res, {
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
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} credits profit histories restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});


