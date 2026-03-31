import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import * as DashboardServices from './dashboard.service';

export const getDashboardStatistics = catchAsync(async (_req, res) => {
  const result = await DashboardServices.getDashboardStatistics();
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard statistics retrieved successfully',
    data: result,
  });
});

export const getDashboardRevenue = catchAsync(async (req, res) => {
  const period = (req.query.period as string) || '30d';
  const result = await DashboardServices.getDashboardRevenue(period);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard revenue data retrieved successfully',
    data: result,
  });
});

export const getDashboardTransactions = catchAsync(async (_req, res) => {
  const result = await DashboardServices.getDashboardTransactions();
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard transaction status data retrieved successfully',
    data: result,
  });
});

export const getDashboardPaymentMethods = catchAsync(async (_req, res) => {
  const result = await DashboardServices.getDashboardPaymentMethods();
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard payment methods data retrieved successfully',
    data: result,
  });
});

export const getDashboardCreditsFlow = catchAsync(async (req, res) => {
  const period = (req.query.period as string) || '30d';
  const result = await DashboardServices.getDashboardCreditsFlow(period);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard credits flow data retrieved successfully',
    data: result,
  });
});

export const getDashboardUserGrowth = catchAsync(async (req, res) => {
  const period = (req.query.period as string) || '30d';
  const result = await DashboardServices.getDashboardUserGrowth(period);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard user growth data retrieved successfully',
    data: result,
  });
});

export const getDashboardPackages = catchAsync(async (_req, res) => {
  const result = await DashboardServices.getDashboardPackages();
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard packages data retrieved successfully',
    data: result,
  });
});

export const getDashboardFeatures = catchAsync(async (_req, res) => {
  const result = await DashboardServices.getDashboardFeatures();
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Dashboard features data retrieved successfully',
    data: result,
  });
});


