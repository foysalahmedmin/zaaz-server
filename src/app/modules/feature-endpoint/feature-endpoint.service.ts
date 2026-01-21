import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { withCache } from '../../utils/cache.utils';
import { clearFeatureCache } from '../feature/feature.service';
import { FeatureEndpoint } from './feature-endpoint.model';
import { TFeatureEndpoint } from './feature-endpoint.type';

const CACHE_TTL = 86400; // 24 hours

export const createFeatureEndpoint = async (
  data: TFeatureEndpoint,
): Promise<TFeatureEndpoint> => {
  // Convert value to lowercase
  const featureEndpointData = {
    ...data,
    value: data.value?.toLowerCase().trim(),
  };

  // Check if value already exists (for non-deleted records)
  if (featureEndpointData.value) {
    const existingFeatureEndpoint = await FeatureEndpoint.findOne({
      value: featureEndpointData.value,
      is_deleted: { $ne: true },
    })
      .setOptions({ bypassDeleted: true })
      .lean();

    if (existingFeatureEndpoint) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Feature endpoint with value '${featureEndpointData.value}' already exists`,
      );
    }
  }

  const result = await FeatureEndpoint.create(featureEndpointData);

  // Clear feature cache
  await clearFeatureCache();

  return result.toObject();
};

export const getPublicFeatureEndpoint = async (
  id: string,
): Promise<TFeatureEndpoint> => {
  const result = await FeatureEndpoint.findOne({
    _id: id,
    is_active: true,
  }).populate('feature');
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
  }
  return result;
};

export const getPublicFeatureEndpointByIdOrValue = async ({
  _id,
  value,
}: {
  _id?: string;
  value?: string;
}): Promise<TFeatureEndpoint> => {
  if (!_id && !value) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid payload');
  }

  return await withCache(
    `feature-endpoint:public:${_id || value}`,
    CACHE_TTL,
    async () => {
      const query: any = { is_active: true };

      if (_id && mongoose.Types.ObjectId.isValid(_id) && value) {
        query.$or = [{ _id: new mongoose.Types.ObjectId(_id) }, { value }];
      } else if (_id && mongoose.Types.ObjectId.isValid(_id)) {
        query._id = new mongoose.Types.ObjectId(_id);
      } else if (value) {
        query.value = value;
      }

      const result = await FeatureEndpoint.findOne(query).populate('feature');

      if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
      }
      return result;
    },
  );
};

export const getFeatureEndpoint = async (
  id: string,
): Promise<TFeatureEndpoint> => {
  const result = await FeatureEndpoint.findById(id).populate('feature');
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
  }
  return result;
};

export const getPublicFeatureEndpoints = async (
  query: Record<string, unknown>,
): Promise<{
  data: TFeatureEndpoint[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { feature, method, ...rest } = query;

  const filter: Record<string, unknown> = {
    is_active: true,
  };

  if (feature) {
    filter.feature = new mongoose.Types.ObjectId(feature as string);
  }

  if (method) {
    filter.method = method;
  }

  const featureEndpointQuery = new AppAggregationQuery<TFeatureEndpoint>(
    FeatureEndpoint,
    { ...rest, ...filter },
  );
  featureEndpointQuery
    .populate([{ path: 'feature', justOne: true }])
    .search(['name', 'value', 'endpoint', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await featureEndpointQuery.execute();

  return result;
};

export const getFeatureEndpoints = async (
  query: Record<string, unknown>,
): Promise<{
  data: TFeatureEndpoint[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { feature, method, ...rest } = query;

  const filter: Record<string, unknown> = {};

  if (feature) {
    filter.feature = new mongoose.Types.ObjectId(feature as string);
  }

  if (method) {
    filter.method = method;
  }

  const featureEndpointQuery = new AppAggregationQuery<TFeatureEndpoint>(
    FeatureEndpoint,
    { ...rest, ...filter },
  );
  featureEndpointQuery
    .populate([{ path: 'feature', justOne: true }])
    .search(['name', 'value', 'endpoint', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await featureEndpointQuery.execute([
    {
      key: 'active',
      filter: { is_active: true },
    },
    {
      key: 'inactive',
      filter: { is_active: false },
    },
  ]);

  return result;
};

export const updateFeatureEndpoint = async (
  id: string,
  payload: Partial<TFeatureEndpoint>,
): Promise<TFeatureEndpoint> => {
  const data = await FeatureEndpoint.findById(id).lean();
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
  }

  // Convert value to lowercase if provided
  const updateData: Partial<TFeatureEndpoint> = { ...payload };
  if (payload.value !== undefined) {
    updateData.value = payload.value.toLowerCase().trim();

    // Check if value already exists (for non-deleted records, excluding current feature endpoint)
    const existingFeatureEndpoint = await FeatureEndpoint.findOne({
      value: updateData.value,
      _id: { $ne: id },
      is_deleted: { $ne: true },
    })
      .setOptions({ bypassDeleted: true })
      .lean();

    if (existingFeatureEndpoint) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Feature endpoint with value '${updateData.value}' already exists`,
      );
    }
  }

  const result = await FeatureEndpoint.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  // Clear feature cache
  await clearFeatureCache();

  return result!;
};

export const updateFeatureEndpoints = async (
  ids: string[],
  payload: Partial<Pick<TFeatureEndpoint, 'is_active'>>,
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const featureEndpoints = await FeatureEndpoint.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = featureEndpoints.map((fe) => fe._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await FeatureEndpoint.updateMany(
    { _id: { $in: foundIds } },
    { ...payload },
  );

  // Clear feature cache
  await clearFeatureCache();

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const deleteFeatureEndpoint = async (id: string): Promise<void> => {
  const featureEndpoint = await FeatureEndpoint.findById(id);
  if (!featureEndpoint) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
  }

  await featureEndpoint.softDelete();

  // Clear feature cache
  await clearFeatureCache();
};

export const deleteFeatureEndpointPermanent = async (
  id: string,
): Promise<void> => {
  const featureEndpoint = await FeatureEndpoint.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (!featureEndpoint) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
  }

  await FeatureEndpoint.findByIdAndDelete(id).setOptions({
    bypassDeleted: true,
  });

  // Clear feature cache
  await clearFeatureCache();
};

export const deleteFeatureEndpoints = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const featureEndpoints = await FeatureEndpoint.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = featureEndpoints.map((fe) => fe._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await FeatureEndpoint.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  // Clear feature cache
  await clearFeatureCache();

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteFeatureEndpointsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const featureEndpoints = await FeatureEndpoint.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();

  const foundIds = featureEndpoints.map((fe) => fe._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await FeatureEndpoint.deleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });

  // Clear feature cache
  await clearFeatureCache();

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreFeatureEndpoint = async (
  id: string,
): Promise<TFeatureEndpoint> => {
  const featureEndpoint = await FeatureEndpoint.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );

  if (!featureEndpoint) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Feature endpoint not found or not deleted',
    );
  }

  // Clear feature cache
  await clearFeatureCache();

  return featureEndpoint;
};

export const restoreFeatureEndpoints = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await FeatureEndpoint.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredFeatureEndpoints = await FeatureEndpoint.find({
    _id: { $in: ids },
  }).lean();
  const restoredIds = restoredFeatureEndpoints.map((fe) => fe._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  // Clear feature cache
  await clearFeatureCache();

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
