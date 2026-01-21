import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as BillingSettingServices from './billing-setting.service';

export const createBillingSetting = catchAsync(async (req, res) => {
  const result = await BillingSettingServices.createBillingSetting(req.body);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Billing Setting created successfully',
    data: result,
  });
});

export const getAllBillingSettings = catchAsync(async (req, res) => {
  const result = await BillingSettingServices.getAllBillingSettings(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Billing Settings retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getBillingSetting = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BillingSettingServices.getBillingSetting(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Billing Setting retrieved successfully',
    data: result,
  });
});

export const updateBillingSetting = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BillingSettingServices.updateBillingSetting(
    id,
    req.body,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Billing Setting updated successfully',
    data: result,
  });
});

export const deleteBillingSetting = catchAsync(async (req, res) => {
  const { id } = req.params;
  await BillingSettingServices.deleteBillingSetting(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Billing Setting soft deleted successfully',
    data: null,
  });
});

export const deleteBillingSettingPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await BillingSettingServices.deleteBillingSettingPermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Billing Setting permanently deleted successfully',
    data: null,
  });
});

export const deleteBillingSettings = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await BillingSettingServices.deleteBillingSettings(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} Billing Settings soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteBillingSettingsPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await BillingSettingServices.deleteBillingSettingsPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} Billing Settings permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restoreBillingSetting = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BillingSettingServices.restoreBillingSetting(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Billing Setting restored successfully',
    data: result,
  });
});

export const restoreBillingSettings = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await BillingSettingServices.restoreBillingSettings(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} Billing Settings restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
