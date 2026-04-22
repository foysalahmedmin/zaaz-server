import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import { invalidateCacheByPattern, withCache } from '../../utils/cache.utils';
import { FeatureEndpoint } from '../feature-endpoint/feature-endpoint.model';
import { Feature } from '../feature/feature.model';
import { Package } from '../package/package.model';
import * as PackageFeatureConfigRepository from './package-feature-config.repository';
import { TPackageFeatureConfig } from './package-feature-config.type';

const CACHE_TTL = 86400; // 24 hours

export const clearPackageFeatureConfigCache = async () => {
  await invalidateCacheByPattern('package-feature-config:*');
  await invalidateCacheByPattern('package-feature-configs:*');
};

export const createPackageFeatureConfig = async (
  data: TPackageFeatureConfig,
  session?: mongoose.ClientSession,
): Promise<TPackageFeatureConfig> => {
  const packageExists = await Package.findById(data.package).session(session || null).lean();
  if (!packageExists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  if (data.feature) {
    const featureExists = await Feature.findById(data.feature).session(session || null).lean();
    if (!featureExists) {
      throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
    }
  }

  if (data.feature_endpoint) {
    const endpointExists = await FeatureEndpoint.findById(data.feature_endpoint)
      .session(session || null)
      .lean();
    if (!endpointExists) {
      throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
    }
    if (!data.feature) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Feature is required when feature_endpoint is provided',
      );
    }
  }

  if (
    data.config.min_credits !== undefined &&
    data.config.max_credits !== undefined &&
    data.config.max_credits < data.config.min_credits
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'max_credits must be greater than or equal to min_credits',
    );
  }

  const result = await PackageFeatureConfigRepository.create(data, session);
  await clearPackageFeatureConfigCache();
  return result;
};

export const getPackageFeatureConfig = async (
  id: string,
): Promise<TPackageFeatureConfig> => {
  const result = await PackageFeatureConfigRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package feature config not found');
  }
  return result;
};

export const getPackageFeatureConfigs = async (query: {
  package?: string;
  feature?: string;
  feature_endpoint?: string;
  is_active?: boolean;
}): Promise<TPackageFeatureConfig[]> => {
  const filter: Record<string, any> = {};
  if (query.package) filter.package = new mongoose.Types.ObjectId(query.package);
  if (query.feature) filter.feature = new mongoose.Types.ObjectId(query.feature);
  if (query.feature_endpoint)
    filter.feature_endpoint = new mongoose.Types.ObjectId(query.feature_endpoint);
  if (query.is_active !== undefined) filter.is_active = query.is_active;

  return await PackageFeatureConfigRepository.find(filter);
};

export const getEffectiveConfig = async (
  packageId: string,
  featureId?: string,
  endpointId?: string,
): Promise<TPackageFeatureConfig['config'] | null> => {
  const cacheKey = `package-feature-config:${packageId}:${featureId || 'null'}:${endpointId || 'null'}`;

  return withCache(cacheKey, CACHE_TTL, async () => {
    if (endpointId && featureId) {
      const endpointConfig = await PackageFeatureConfigRepository.findOne({
        package: new mongoose.Types.ObjectId(packageId),
        feature: new mongoose.Types.ObjectId(featureId),
        feature_endpoint: new mongoose.Types.ObjectId(endpointId),
        is_active: true,
        is_deleted: { $ne: true },
      });
      if (endpointConfig) return endpointConfig.config;
    }

    if (featureId) {
      const featureConfig = await PackageFeatureConfigRepository.findOne({
        package: new mongoose.Types.ObjectId(packageId),
        feature: new mongoose.Types.ObjectId(featureId),
        feature_endpoint: null,
        is_active: true,
        is_deleted: { $ne: true },
      });
      if (featureConfig) return featureConfig.config;
    }

    return null;
  });
};

export const updatePackageFeatureConfig = async (
  id: string,
  payload: Partial<TPackageFeatureConfig>,
  session?: mongoose.ClientSession,
): Promise<TPackageFeatureConfig> => {
  const existing = await PackageFeatureConfigRepository.findByIdRaw(id, session);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package feature config not found');
  }

  if (payload.package) {
    const packageExists = await Package.findById(payload.package).session(session || null).lean();
    if (!packageExists) throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  if (payload.feature) {
    const featureExists = await Feature.findById(payload.feature).session(session || null).lean();
    if (!featureExists) throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
  }

  if (payload.feature_endpoint) {
    const endpointExists = await FeatureEndpoint.findById(payload.feature_endpoint)
      .session(session || null)
      .lean();
    if (!endpointExists) throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
  }

  if (payload.config) {
    const mergedConfig = { ...existing.config, ...payload.config };
    if (
      mergedConfig.min_credits !== undefined &&
      mergedConfig.max_credits !== undefined &&
      mergedConfig.max_credits < mergedConfig.min_credits
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'max_credits must be greater than or equal to min_credits',
      );
    }
  }

  const result = await PackageFeatureConfigRepository.updateById(id, payload, session);
  await clearPackageFeatureConfigCache();
  return result!;
};

export const bulkUpsertConfigs = async (
  packageId: string,
  configs: Array<{
    feature?: string;
    feature_endpoint?: string;
    config: Record<string, any>;
    description?: string;
    sequence?: number;
  }>,
  session?: mongoose.ClientSession,
): Promise<void> => {
  const operations = configs.map((cfg) => ({
    updateOne: {
      filter: {
        package: new mongoose.Types.ObjectId(packageId),
        feature: cfg.feature ? new mongoose.Types.ObjectId(cfg.feature) : null,
        feature_endpoint: cfg.feature_endpoint
          ? new mongoose.Types.ObjectId(cfg.feature_endpoint)
          : null,
      },
      update: {
        $set: {
          config: cfg.config,
          description: cfg.description,
          sequence: cfg.sequence || 0,
          is_active: true,
          is_deleted: false,
        },
      },
      upsert: true,
    },
  }));

  await PackageFeatureConfigRepository.bulkWrite(operations, session);
  await clearPackageFeatureConfigCache();
};

export const deletePackageFeatureConfig = async (
  id: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  const config = await PackageFeatureConfigRepository.findByIdRaw(id, session);
  if (!config) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package feature config not found');
  }
  await PackageFeatureConfigRepository.softDeleteById(id, session);
  await clearPackageFeatureConfigCache();
};

export const deleteConfigsByPackage = async (
  packageId: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await PackageFeatureConfigRepository.updateManyByPackage(packageId, { is_deleted: true }, session);
  await clearPackageFeatureConfigCache();
};

export const deletePackageFeatureConfigPermanent = async (id: string): Promise<void> => {
  const config = await PackageFeatureConfigRepository.findByIdRaw(id, undefined, true);
  if (!config) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package feature config not found');
  }
  await PackageFeatureConfigRepository.permanentDeleteById(id);
  await clearPackageFeatureConfigCache();
};
