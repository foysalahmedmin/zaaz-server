import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import * as PackagePriceServices from './package-price.service';

export const createPackagePrice = catchAsync(async (req, res) => {
  const result = await PackagePriceServices.createPackagePrice(req.body);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package-price created successfully',
    data: result,
  });
});

export const createPackagePrices = catchAsync(async (req, res) => {
  const result = await PackagePriceServices.createPackagePrices(req.body);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package-prices created successfully',
    data: result,
  });
});

export const getPackagePrice = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackagePriceServices.getPackagePrice(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package-price retrieved successfully',
    data: result,
  });
});

export const getPackagePrices = catchAsync(async (req, res) => {
  const result = await PackagePriceServices.getPackagePrices(req.query);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package-prices retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updatePackagePrice = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackagePriceServices.updatePackagePrice(id, req.body);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package-price updated successfully',
    data: result,
  });
});

export const deletePackagePrice = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PackagePriceServices.deletePackagePrice(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package-price soft deleted successfully',
    data: null,
  });
});
