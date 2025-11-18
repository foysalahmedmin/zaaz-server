import httpStatus from 'http-status';
import AppError from '../../builder/AppError';
import AppQuery from '../../builder/AppQuery';
import { FeatureEndpoint } from './feature-endpoint.model';
import { TFeatureEndpoint } from './feature-endpoint.type';

export const createFeatureEndpoint = async (
  data: TFeatureEndpoint,
): Promise<TFeatureEndpoint> => {
  const result = await FeatureEndpoint.create(data);
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
    filter.feature = feature;
  }

  if (method) {
    filter.method = method;
  }

  const featureEndpointQuery = new AppQuery<TFeatureEndpoint>(
    FeatureEndpoint.find().populate([{ path: 'feature' }]),
    { ...rest, ...filter },
  )
    .search(['name', 'endpoint', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

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
    filter.feature = feature;
  }

  if (method) {
    filter.method = method;
  }

  const featureEndpointQuery = new AppQuery<TFeatureEndpoint>(
    FeatureEndpoint.find().populate([{ path: 'feature' }]),
    { ...rest, ...filter },
  )
    .search(['name', 'endpoint', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

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

  const result = await FeatureEndpoint.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

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
  const restoredIds = restoredFeatureEndpoints.map((fe) =>
    fe._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

