import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import { invalidateCacheByPattern, withCache } from '../../utils/cache.utils';
import { FeatureEndpoint } from '../feature-endpoint/feature-endpoint.model';
import { FeaturePopup } from '../feature-popup/feature-popup.model';
import * as FeatureRepository from './feature.repository';
import { TFeature } from './feature.type';

const CACHE_TTL = 86400;

export const clearFeatureCache = async () => {
  await invalidateCacheByPattern('feature:*');
  await invalidateCacheByPattern('features:public:*');
};

export const createFeature = async (data: TFeature): Promise<TFeature> => {
  const featureData = { ...data, value: data.value?.toLowerCase().trim() };

  if (featureData.value) {
    const existing = await FeatureRepository.findOne(
      { value: featureData.value, is_deleted: { $ne: true } },
      false,
      true,
    );
    if (existing) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Feature with value '${featureData.value}' already exists`,
      );
    }
  }

  const result = await FeatureRepository.create(featureData);
  await clearFeatureCache();
  return result;
};

export const getPublicFeature = async (id: string): Promise<TFeature> => {
  return withCache(`feature:${id}`, CACHE_TTL, async () => {
    const result = await FeatureRepository.findOne(
      { _id: id, is_active: true },
      true,
    );
    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
    }
    return result;
  });
};

export const getFeature = async (id: string): Promise<TFeature> => {
  const result = await FeatureRepository.findById(id, true);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
  }
  return result;
};

export const getPublicFeatures = async (
  query: Record<string, unknown>,
): Promise<{ data: TFeature[]; meta: any }> => {
  return withCache(
    `features:public:${JSON.stringify(query)}`,
    CACHE_TTL,
    async () => {
      const { all = false, parent, type, ...rest } = query;
      const filter: Record<string, unknown> = { is_active: true };

      if (parent !== undefined) {
        filter.parent =
          parent === null || parent === ''
            ? null
            : new mongoose.Types.ObjectId(parent as string);
      } else if (!all) {
        filter.parent = { $not: { $type: 'objectId' } };
      }

      if (type) filter.type = type;

      return await FeatureRepository.findPaginated(rest, filter);
    },
  );
};

export const getFeatures = async (
  query: Record<string, unknown>,
): Promise<{ data: TFeature[]; meta: any }> => {
  const { all = false, parent, type, ...rest } = query;
  const filter: Record<string, unknown> = {};

  if (parent !== undefined) {
    filter.parent =
      parent === null || parent === ''
        ? null
        : new mongoose.Types.ObjectId(parent as string);
  } else if (!all) {
    filter.parent = { $not: { $type: 'objectId' } };
  }

  if (type) filter.type = type;

  return await FeatureRepository.findPaginated(
    rest,
    filter,
    ['name', 'type', 'sequence', 'is_active', 'created_at', 'updated_at'],
    [
      { key: 'active', filter: { is_active: true } },
      { key: 'inactive', filter: { is_active: false } },
      { key: 'with_parent', filter: { parent: { $exists: true, $ne: null } } },
    ],
  );
};

export const updateFeature = async (
  id: string,
  payload: Partial<TFeature>,
): Promise<TFeature> => {
  const existing = await FeatureRepository.findById(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
  }

  const updateData: Partial<TFeature> = { ...payload };
  if (payload.value !== undefined) {
    updateData.value = payload.value.toLowerCase().trim();

    const conflict = await FeatureRepository.findOne(
      { value: updateData.value, _id: { $ne: id }, is_deleted: { $ne: true } },
      false,
      true,
    );
    if (conflict) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Feature with value '${updateData.value}' already exists`,
      );
    }
  }

  const result = await FeatureRepository.updateById(id, updateData);
  await clearFeatureCache();
  return result!;
};

export const updateFeatures = async (
  ids: string[],
  payload: Partial<Pick<TFeature, 'is_active'>>,
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await FeatureRepository.findByIds(ids);
  const foundIds = existing.map((f) => (f as any)._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  const result = await FeatureRepository.updateMany(
    { _id: { $in: foundIds } },
    payload,
  );
  await clearFeatureCache();
  return { count: result.modifiedCount, not_found_ids };
};

export const deleteFeature = async (id: string): Promise<void> => {
  const existing = await FeatureRepository.findById(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
  }
  await FeatureRepository.softDeleteById(id);
  await clearFeatureCache();
};

export const deleteFeaturePermanent = async (id: string): Promise<void> => {
  const existing = await FeatureRepository.findById(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
  }
  await FeatureRepository.permanentDeleteById(id);
  await clearFeatureCache();
};

export const deleteFeatures = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await FeatureRepository.findByIds(ids);
  const foundIds = existing.map((f) => (f as any)._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  await FeatureRepository.softDeleteMany(foundIds);
  await clearFeatureCache();
  return { count: foundIds.length, not_found_ids };
};

export const deleteFeaturesPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await FeatureRepository.findByIds(ids, true);
  const deletable = existing.filter((f: any) => f.is_deleted);
  const foundIds = deletable.map((f: any) => f._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  await FeatureRepository.permanentDeleteMany(foundIds);
  await clearFeatureCache();
  return { count: foundIds.length, not_found_ids };
};

export const restoreFeature = async (id: string): Promise<TFeature> => {
  const result = await FeatureRepository.restore(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature not found or not deleted');
  }
  await clearFeatureCache();
  return result;
};

export const restoreFeatures = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await FeatureRepository.restoreMany(ids);

  const restored = await FeatureRepository.findByIds(ids);
  const restoredIds = restored.map((f: any) => f._id.toString());
  const not_found_ids = ids.filter((id) => !restoredIds.includes(id));

  await clearFeatureCache();
  return { count: result.modifiedCount, not_found_ids };
};

export const getPublicFeaturesWithConfigs = async (
  query: Record<string, unknown>,
): Promise<{ data: any[]; meta: any }> => {
  return withCache(
    `features:public-with-configs:${JSON.stringify(query)}`,
    CACHE_TTL,
    async () => {
      const { all = false, parent, type, ...rest } = query;
      const filter: Record<string, unknown> = { is_active: true };

      if (parent !== undefined) {
        filter.parent =
          parent === null || parent === ''
            ? null
            : new mongoose.Types.ObjectId(parent as string);
      } else if (!all) {
        filter.parent = { $not: { $type: 'objectId' } };
      }

      if (type) filter.type = type;

      return await FeatureRepository.findPaginatedWithLookups(rest, filter, [
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
    },
  );
};
