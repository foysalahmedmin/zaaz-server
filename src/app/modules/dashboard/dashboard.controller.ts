import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as DashboardServices from './dashboard.service';

export const getDashboardStatistics = catchAsync(async (_req, res) => {
  const result = await DashboardServices.getDashboardStatistics();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard statistics retrieved successfully',
    data: result,
  });
});

export const getDashboardRevenue = catchAsync(async (req, res) => {
  const period = (req.query.period as string) || '30d';
  const result = await DashboardServices.getDashboardRevenue(period);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard revenue data retrieved successfully',
    data: result,
  });
});

export const getDashboardTransactions = catchAsync(async (_req, res) => {
  const result = await DashboardServices.getDashboardTransactions();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard transaction status data retrieved successfully',
    data: result,
  });
});

export const getDashboardPaymentMethods = catchAsync(async (_req, res) => {
  const result = await DashboardServices.getDashboardPaymentMethods();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard payment methods data retrieved successfully',
    data: result,
  });
});

export const getDashboardTokenFlow = catchAsync(async (req, res) => {
  const period = (req.query.period as string) || '30d';
  const result = await DashboardServices.getDashboardTokenFlow(period);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard token flow data retrieved successfully',
    data: result,
  });
});

export const getDashboardUserGrowth = catchAsync(async (req, res) => {
  const period = (req.query.period as string) || '30d';
  const result = await DashboardServices.getDashboardUserGrowth(period);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard user growth data retrieved successfully',
    data: result,
  });
});

export const getDashboardPackages = catchAsync(async (_req, res) => {
  const result = await DashboardServices.getDashboardPackages();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard packages data retrieved successfully',
    data: result,
  });
});

export const getDashboardFeatures = catchAsync(async (_req, res) => {
  const result = await DashboardServices.getDashboardFeatures();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard features data retrieved successfully',
    data: result,
  });
});
