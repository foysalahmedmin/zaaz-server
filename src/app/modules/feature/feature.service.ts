import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { invalidateCacheByPattern, withCache } from '../../utils/cache.utils';
import { FeatureEndpoint } from '../feature-endpoint/feature-endpoint.model';
import { FeaturePopup } from '../feature-popup/feature-popup.model';
import { Feature } from './feature.model';
import { TFeature } from './feature.type';

const CACHE_TTL = 86400; // 24 hours (Optimized for production with proper invalidation)

export const clearFeatureCache = async () => {
  await invalidateCacheByPattern('feature:*');
  await invalidateCacheByPattern('features:public:*');
};

export const createFeature = async (data: TFeature): Promise<TFeature> => {
  // Convert value to lowercase
  const featureData = {
    ...data,
    value: data.value?.toLowerCase().trim(),
  };

  // Check if value already exists (for non-deleted records)
  if (featureData.value) {
    const existingFeature = await Feature.findOne({
      value: featureData.value,
      is_deleted: { $ne: true },
    })
      .setOptions({ bypassDeleted: true })
      .lean();

    if (existingFeature) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Feature with value '${featureData.value}' already exists`,
      );
    }
  }

  const result = await Feature.create(featureData);

  // Clear cache after creation
  await clearFeatureCache();

  return result.toObject();
};

export const getPublicFeature = async (id: string): Promise<TFeature> => {
  return withCache(`feature:${id}`, CACHE_TTL, async () => {
    const result = await Feature.findOne({
      _id: id,
      is_active: true,
    }).populate('children');
    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
    }
    return result;
  });
};

export const getFeature = async (id: string): Promise<TFeature> => {
  const result = await Feature.findById(id).populate('children');
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
  }
  return result;
};

export const getPublicFeatures = async (
  query: Record<string, unknown>,
): Promise<{
  data: TFeature[];
  meta: { total: number; page: number; limit: number };
}> => {
  return withCache(
    `features:public:${JSON.stringify(query)}`,
    CACHE_TTL,
    async () => {
      const { all = false, parent, type, ...rest } = query;

      const filter: Record<string, unknown> = {
        is_active: true,
      };

      if (parent !== undefined) {
        if (parent === null || parent === '') {
          filter.parent = null;
        } else {
          filter.parent = new mongoose.Types.ObjectId(parent as string);
        }
      } else if (!all) {
        filter.parent = { $not: { $type: 'objectId' } };
      }

      if (type) {
        filter.type = type;
      }

      const featureQuery = new AppAggregationQuery<TFeature>(Feature, {
        ...rest,
        ...filter,
      });
      featureQuery
        .populate([{ path: 'children' }])
        .search(['name', 'value', 'description', 'path'])
        .filter()
        .sort()
        .paginate()
        .fields();

      const result = await featureQuery.execute();

      return result;
    },
  );
};

export const getFeatures = async (
  query: Record<string, unknown>,
): Promise<{
  data: TFeature[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { all = false, parent, type, ...rest } = query;

  const filter: Record<string, unknown> = {};

  if (parent !== undefined) {
    if (parent === null || parent === '') {
      filter.parent = null;
    } else {
      filter.parent = new mongoose.Types.ObjectId(parent as string);
    }
  } else if (!all) {
    filter.parent = { $not: { $type: 'objectId' } };
  }

  if (type) {
    filter.type = type;
  }

  const featureQuery = new AppAggregationQuery<TFeature>(Feature, {
    ...rest,
    ...filter,
  });
  featureQuery
    .populate([{ path: 'children' }])
    .search(['name', 'value', 'description', 'path'])
    .filter()
    .sort([
      'name',
      'type',
      'sequence',
      'is_active',
      'created_at',
      'updated_at',
    ] as any)
    .paginate()
    .fields();

  const result = await featureQuery.execute([
    {
      key: 'active',
      filter: { is_active: true },
    },
    {
      key: 'inactive',
      filter: { is_active: false },
    },
    {
      key: 'with_parent',
      filter: { parent: { $exists: true, $ne: null } },
    },
  ]);

  return result;
};

export const updateFeature = async (
  id: string,
  payload: Partial<TFeature>,
): Promise<TFeature> => {
  const data = await Feature.findById(id).lean();
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
  }

  // Convert value to lowercase if provided
  const updateData: Partial<TFeature> = { ...payload };
  if (payload.value !== undefined) {
    updateData.value = payload.value.toLowerCase().trim();

    // Check if value already exists (for non-deleted records, excluding current feature)
    const existingFeature = await Feature.findOne({
      value: updateData.value,
      _id: { $ne: id },
      is_deleted: { $ne: true },
    })
      .setOptions({ bypassDeleted: true })
      .lean();

    if (existingFeature) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Feature with value '${updateData.value}' already exists`,
      );
    }
  }

  const result = await Feature.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  // Clear cache after update
  await clearFeatureCache();

  return result!;
};

export const updateFeatures = async (
  ids: string[],
  payload: Partial<Pick<TFeature, 'is_active'>>,
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const features = await Feature.find({ _id: { $in: ids } }).lean();
  const foundIds = features.map((feature) => feature._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await Feature.updateMany(
    { _id: { $in: foundIds } },
    { ...payload },
  );

  // Clear cache after update
  await clearFeatureCache();

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const deleteFeature = async (id: string): Promise<void> => {
  const feature = await Feature.findById(id);
  if (!feature) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
  }

  await feature.softDelete();

  // Clear cache after deletion
  await clearFeatureCache();
};

export const deleteFeaturePermanent = async (id: string): Promise<void> => {
  const feature = await Feature.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (!feature) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
  }

  await Feature.findByIdAndDelete(id).setOptions({ bypassDeleted: true });

  // Clear cache after deletion
  await clearFeatureCache();
};

export const deleteFeatures = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const features = await Feature.find({ _id: { $in: ids } }).lean();
  const foundIds = features.map((feature) => feature._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await Feature.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });

  // Clear cache after deletion
  await clearFeatureCache();

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteFeaturesPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const features = await Feature.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();

  const foundIds = features.map((feature) => feature._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await Feature.deleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });

  // Clear cache after deletion
  await clearFeatureCache();

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreFeature = async (id: string): Promise<TFeature> => {
  const feature = await Feature.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );

  if (!feature) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Feature not found or not deleted',
    );
  }

  // Clear cache after restoration
  await clearFeatureCache();

  return feature;
};

export const restoreFeatures = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await Feature.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredFeatures = await Feature.find({ _id: { $in: ids } }).lean();
  const restoredIds = restoredFeatures.map((feature) => feature._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  // Clear cache after restoration
  await clearFeatureCache();

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const getPublicFeaturesWithConfigs = async (
  query: Record<string, unknown>,
): Promise<{
  data: any[];
  meta: { total: number; page: number; limit: number };
}> => {
  return withCache(
    `features:public-with-configs:${JSON.stringify(query)}`,
    CACHE_TTL,
    async () => {
      const { all = false, parent, type, ...rest } = query;

      const filter: Record<string, unknown> = {
        is_active: true,
      };

      if (parent !== undefined) {
        if (parent === null || parent === '') {
          filter.parent = null;
        } else {
          filter.parent = new mongoose.Types.ObjectId(parent as string);
        }
      } else if (!all) {
        filter.parent = { $not: { $type: 'objectId' } };
      }

      if (type) {
        filter.type = type;
      }

      const featureAggregation = new AppAggregationQuery(Feature, {
        ...rest,
        ...filter,
      });

      // Add lookups for popups and endpoints
      featureAggregation.addPipeline([
        {
          $lookup: {
            from: FeaturePopup.collection.name,
            localField: '_id',
            foreignField: 'feature',
            pipeline: [
              { $match: { is_active: true, is_deleted: { $ne: true } } },
              { $sort: { priority: -1 } },
            ],
            as: 'popups',
          },
        },
        {
          $lookup: {
            from: FeatureEndpoint.collection.name,
            localField: '_id',
            foreignField: 'feature',
            pipeline: [
              { $match: { is_active: true, is_deleted: { $ne: true } } },
            ],
            as: 'feature_endpoints',
          },
        },
      ]);

      featureAggregation
        .search(['name', 'value', 'description', 'path'])
        .filter()
        .sort()
        .paginate()
        .fields();

      const result = await featureAggregation.execute();

      return result;
    },
  );
};
