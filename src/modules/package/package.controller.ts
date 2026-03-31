import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import * as PackageServices from './package.service';

export const createPackage = catchAsync(async (req, res) => {
  const result = await PackageServices.createPackage(req.body);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package created successfully',
    data: result,
  });
});

export const getPublicPackage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackageServices.getPublicPackage(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package retrieved successfully',
    data: result,
  });
});

export const getPackage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackageServices.getPackage(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package retrieved successfully',
    data: result,
  });
});

export const getPublicPackages = catchAsync(async (req, res) => {
  const result = await PackageServices.getPublicPackages(req.query);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Packages retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getPackages = catchAsync(async (req, res) => {
  const result = await PackageServices.getPackages(req.query);
  responseFormatter(res, {
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
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package updated successfully',
    data: result,
  });
});

export const updatePackages = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result = await PackageServices.updatePackages(ids, payload);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Packages updated successfully',
    data: result,
  });
});

export const deletePackage = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PackageServices.deletePackage(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package soft deleted successfully',
    data: null,
  });
});

export const deletePackagePermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PackageServices.deletePackagePermanent(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package permanently deleted successfully',
    data: null,
  });
});

export const deletePackages = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PackageServices.deletePackages(ids);
  responseFormatter(res, {
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
  responseFormatter(res, {
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
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package restored successfully',
    data: result,
  });
});

export const restorePackages = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await PackageServices.restorePackages(ids);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} packages restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const updatePackageIsInitial = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { is_initial } = req.body;
  const result = await PackageServices.updatePackageIsInitial(id, is_initial);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package initial status updated successfully',
    data: result,
  });
});

export const getPackageWithConfigs = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackageServices.getPackageWithConfigs(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package with configs retrieved successfully',
    data: result,
  });
});


