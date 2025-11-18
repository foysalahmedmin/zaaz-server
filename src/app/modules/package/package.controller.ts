import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as PackageServices from './package.service';

export const createPackage = catchAsync(async (req, res) => {
  const result = await PackageServices.createPackage(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package created successfully',
    data: result,
  });
});

export const getPublicPackage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackageServices.getPublicPackage(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package retrieved successfully',
    data: result,
  });
});

export const getPackage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackageServices.getPackage(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package retrieved successfully',
    data: result,
  });
});

export const getPublicPackages = catchAsync(async (req, res) => {
  const result = await PackageServices.getPublicPackages(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Packages retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getPackages = catchAsync(async (req, res) => {
  const result = await PackageServices.getPackages(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Packages retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updatePackage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackageServices.updatePackage(id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package updated successfully',
    data: result,
  });
});

export const updatePackages = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result = await PackageServices.updatePackages(ids, payload);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Packages updated successfully',
    data: result,
  });
});

export const deletePackage = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PackageServices.deletePackage(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package soft deleted successfully',
    data: null,
  });
});

export const deletePackagePermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PackageServices.deletePackagePermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package permanently deleted successfully',
    data: null,
  });
});

export const deletePackages = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PackageServices.deletePackages(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} packages soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deletePackagesPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PackageServices.deletePackagesPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} packages permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restorePackage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackageServices.restorePackage(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package restored successfully',
    data: result,
  });
});

export const restorePackages = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PackageServices.restorePackages(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} packages restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

