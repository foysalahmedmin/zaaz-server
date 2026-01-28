import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/AppError';
import { invalidateCacheByPattern, withCache } from '../../utils/cache.utils';
import { FeatureEndpoint } from '../feature-endpoint/feature-endpoint.model';
import { Feature } from '../feature/feature.model';
import { Package } from '../package/package.model';
import { PackageFeatureConfig } from './package-feature-config.model';
import { TPackageFeatureConfig } from './package-feature-config.type';

const CACHE_TTL = 86400; // 24 hours

export const clearPackageFeatureConfigCache = async () => {
  await invalidateCacheByPattern('package-feature-config:*');
  await invalidateCacheByPattern('package-feature-configs:*');
};

/**
 * Create a new package feature config
 */
export const createPackageFeatureConfig = async (
  data: TPackageFeatureConfig,
  session?: mongoose.ClientSession,
): Promise<TPackageFeatureConfig> => {
  // Validate package exists
  const packageExists = await Package.findById(data.package)
    .session(session || null)
    .lean();
  if (!packageExists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  // Validate feature exists (if provided)
  if (data.feature) {
    const featureExists = await Feature.findById(data.feature)
      .session(session || null)
      .lean();
    if (!featureExists) {
      throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
    }
  }

  // Validate feature endpoint exists (if provided)
  if (data.feature_endpoint) {
    const endpointExists = await FeatureEndpoint.findById(data.feature_endpoint)
      .session(session || null)
      .lean();
    if (!endpointExists) {
      throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
    }

    // If endpoint is provided, feature must also be provided
    if (!data.feature) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Feature is required when feature_endpoint is provided',
      );
    }
  }

  // Validate config constraints
  if (
    data.config.min_credits !== undefined &&
    data.config.max_credits !== undefined
  ) {
    if (data.config.max_credits < data.config.min_credits) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'max_credits must be greater than or equal to min_credits',
      );
    }
  }

  const result = await PackageFeatureConfig.create([data], { session });

  // Clear cache
  await clearPackageFeatureConfigCache();

  return result[0].toObject();
};

/**
 * Get a single package feature config by ID
 */
export const getPackageFeatureConfig = async (
  id: string,
): Promise<TPackageFeatureConfig> => {
  const result = await PackageFeatureConfig.findById(id)
    .populate('package', 'name')
    .populate('feature', 'name value')
    .populate('feature_endpoint', 'name value endpoint')
    .lean();

  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Package feature config not found',
    );
  }

  return result;
};

/**
 * Get all package feature configs with filters
 */
export const getPackageFeatureConfigs = async (query: {
  package?: string;
  feature?: string;
  feature_endpoint?: string;
  is_active?: boolean;
}): Promise<TPackageFeatureConfig[]> => {
  const filter: Record<string, any> = {};

  if (query.package) {
    filter.package = new mongoose.Types.ObjectId(query.package);
  }

  if (query.feature) {
    filter.feature = new mongoose.Types.ObjectId(query.feature);
  }

  if (query.feature_endpoint) {
    filter.feature_endpoint = new mongoose.Types.ObjectId(
      query.feature_endpoint,
    );
  }

  if (query.is_active !== undefined) {
    filter.is_active = query.is_active;
  }

  const results = await PackageFeatureConfig.find(filter)
    .populate('package', 'name')
    .populate('feature', 'name value')
    .populate('feature_endpoint', 'name value endpoint')
    .sort({ sequence: 1, created_at: -1 })
    .lean();

  return results;
};

/**
 * Get effective config for a package-feature-endpoint combination
 * Uses cascading resolution: endpoint-specific → feature-wide → null
 */
export const getEffectiveConfig = async (
  packageId: string,
  featureId?: string,
  endpointId?: string,
): Promise<TPackageFeatureConfig['config'] | null> => {
  const cacheKey = `package-feature-config:${packageId}:${featureId || 'null'}:${endpointId || 'null'}`;

  return withCache(cacheKey, CACHE_TTL, async () => {
    // Try endpoint-specific config first (most specific)
    if (endpointId && featureId) {
      const endpointConfig = await PackageFeatureConfig.findOne({
        package: new mongoose.Types.ObjectId(packageId),
        feature: new mongoose.Types.ObjectId(featureId),
        feature_endpoint: new mongoose.Types.ObjectId(endpointId),
        is_active: true,
        is_deleted: { $ne: true },
      }).lean();

      if (endpointConfig) {
        return endpointConfig.config;
      }
    }

    // Fall back to feature-wide config
    if (featureId) {
      const featureConfig = await PackageFeatureConfig.findOne({
        package: new mongoose.Types.ObjectId(packageId),
        feature: new mongoose.Types.ObjectId(featureId),
        feature_endpoint: null,
        is_active: true,
        is_deleted: { $ne: true },
      }).lean();

      if (featureConfig) {
        return featureConfig.config;
      }
    }

    // No config found, return null (use defaults)
    return null;
  });
};

/**
 * Update a package feature config
 */
export const updatePackageFeatureConfig = async (
  id: string,
  payload: Partial<TPackageFeatureConfig>,
  session?: mongoose.ClientSession,
): Promise<TPackageFeatureConfig> => {
  const existing = await PackageFeatureConfig.findById(id)
    .session(session || null)
    .lean();

  if (!existing) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Package feature config not found',
    );
  }

  // Validate package if being updated
  if (payload.package) {
    const packageExists = await Package.findById(payload.package)
      .session(session || null)
      .lean();
    if (!packageExists) {
      throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
    }
  }

  // Validate feature if being updated
  if (payload.feature) {
    const featureExists = await Feature.findById(payload.feature)
      .session(session || null)
      .lean();
    if (!featureExists) {
      throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
    }
  }

  // Validate feature endpoint if being updated
  if (payload.feature_endpoint) {
    const endpointExists = await FeatureEndpoint.findById(
      payload.feature_endpoint,
    )
      .session(session || null)
      .lean();
    if (!endpointExists) {
      throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
    }
  }

  // Validate config constraints if config is being updated
  if (payload.config) {
    const mergedConfig = { ...existing.config, ...payload.config };
    if (
      mergedConfig.min_credits !== undefined &&
      mergedConfig.max_credits !== undefined
    ) {
      if (mergedConfig.max_credits < mergedConfig.min_credits) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'max_credits must be greater than or equal to min_credits',
        );
      }
    }
  }

  const result = await PackageFeatureConfig.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
    session,
  });

  // Clear cache
  await clearPackageFeatureConfigCache();

  return result!;
};

/**
 * Bulk upsert configs for a package
 */
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

  await PackageFeatureConfig.bulkWrite(operations, { session });

  // Clear cache
  await clearPackageFeatureConfigCache();
};

/**
 * Delete a package feature config (soft delete)
 */
export const deletePackageFeatureConfig = async (
  id: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  const config = await PackageFeatureConfig.findById(id).session(
    session || null,
  );

  if (!config) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Package feature config not found',
    );
  }

  await config.softDelete();

  // Clear cache
  await clearPackageFeatureConfigCache();
};

/**
 * Delete all configs for a package (soft delete)
 */
export const deleteConfigsByPackage = async (
  packageId: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await PackageFeatureConfig.updateMany(
    { package: new mongoose.Types.ObjectId(packageId) },
    { is_deleted: true },
    { session },
  );

  // Clear cache
  await clearPackageFeatureConfigCache();
};

/**
 * Permanently delete a package feature config
 */
export const deletePackageFeatureConfigPermanent = async (
  id: string,
): Promise<void> => {
  const config = await PackageFeatureConfig.findById(id).setOptions({
    bypassDeleted: true,
  });

  if (!config) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Package feature config not found',
    );
  }

  await PackageFeatureConfig.findByIdAndDelete(id).setOptions({
    bypassDeleted: true,
  });

  // Clear cache
  await clearPackageFeatureConfigCache();
};
