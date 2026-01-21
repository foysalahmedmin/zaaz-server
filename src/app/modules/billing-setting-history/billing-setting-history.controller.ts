import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as BillingSettingHistoryServices from './billing-setting-history.service';

export const getBillingSettingHistories = catchAsync(async (req, res) => {
  const { billingSettingId } = req.params;
  const result = await BillingSettingHistoryServices.getBillingSettingHistories(
    billingSettingId,
    req.query,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Billing Setting histories retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getBillingSettingHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await BillingSettingHistoryServices.getBillingSettingHistory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Billing Setting history retrieved successfully',
    data: result,
  });
});

export const deleteBillingSettingHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  await BillingSettingHistoryServices.deleteBillingSettingHistory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Billing Setting history soft deleted successfully',
    data: null,
  });
});

export const deleteBillingSettingHistoryPermanent = catchAsync(
  async (req, res) => {
    const { id } = req.params;
    await BillingSettingHistoryServices.deleteBillingSettingHistoryPermanent(
      id,
    );
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Billing Setting history permanently deleted successfully',
      data: null,
    });
  },
);

export const deleteBillingSettingHistories = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await BillingSettingHistoryServices.deleteBillingSettingHistories(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} Billing Setting histories soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteBillingSettingHistoriesPermanent = catchAsync(
  async (req, res) => {
    const { ids } = req.body;
    const result =
      await BillingSettingHistoryServices.deleteBillingSettingHistoriesPermanent(
        ids,
      );
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: `${result.count} Billing Setting histories permanently deleted successfully`,
      data: {
        not_found_ids: result.not_found_ids,
      },
    });
  },
);

export const restoreBillingSettingHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await BillingSettingHistoryServices.restoreBillingSettingHistory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Billing Setting history restored successfully',
    data: result,
  });
});

export const restoreBillingSettingHistories = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await BillingSettingHistoryServices.restoreBillingSettingHistories(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} Billing Setting histories restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
