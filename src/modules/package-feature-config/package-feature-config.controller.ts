import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import * as PackageFeatureConfigServices from './package-feature-config.service';

export const createPackageFeatureConfig = catchAsync(async (req, res) => {
  const result = await PackageFeatureConfigServices.createPackageFeatureConfig(
    req.body,
  );

  responseFormatter(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Package feature config created successfully',
    data: result,
  });
});

export const getPackageFeatureConfig = catchAsync(async (req, res) => {
  const result = await PackageFeatureConfigServices.getPackageFeatureConfig(
    req.params.id,
  );

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package feature config retrieved successfully',
    data: result,
  });
});

export const getPackageFeatureConfigs = catchAsync(async (req, res) => {
  const result = await PackageFeatureConfigServices.getPackageFeatureConfigs(
    req.query,
  );

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package feature configs retrieved successfully',
    data: result,
  });
});

export const getPackageConfigs = catchAsync(async (req, res) => {
  const result = await PackageFeatureConfigServices.getPackageFeatureConfigs({
    package: req.params.packageId,
  });

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package configs retrieved successfully',
    data: result,
  });
});

export const updatePackageFeatureConfig = catchAsync(async (req, res) => {
  const result = await PackageFeatureConfigServices.updatePackageFeatureConfig(
    req.params.id,
    req.body,
  );

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package feature config updated successfully',
    data: result,
  });
});

export const bulkUpsertConfigs = catchAsync(async (req, res) => {
  await PackageFeatureConfigServices.bulkUpsertConfigs(
    req.params.packageId,
    req.body.configs,
  );

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package configs upserted successfully',
    data: null,
  });
});

export const deletePackageFeatureConfig = catchAsync(async (req, res) => {
  await PackageFeatureConfigServices.deletePackageFeatureConfig(req.params.id);

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package feature config deleted successfully',
    data: null,
  });
});

export const deletePackageFeatureConfigPermanent = catchAsync(
  async (req, res) => {
    await PackageFeatureConfigServices.deletePackageFeatureConfigPermanent(
      req.params.id,
    );

    responseFormatter(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Package feature config permanently deleted',
      data: null,
    });
  },
);


