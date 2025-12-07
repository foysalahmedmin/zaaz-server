import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import AppQueryFind from '../../builder/app-query-find';
import { Feature } from './feature.model';
import { TFeature } from './feature.type';

export const createFeature = async (data: TFeature): Promise<TFeature> => {
  // Ensure value is lowercase
  const featureData = {
    ...data,
    value: data.value.toLowerCase().trim(),
  };

  // Check for duplicate value (non-deleted only)
  const existingFeature = await Feature.findOne({
    value: featureData.value,
    is_deleted: { $ne: true },
  })
    .setOptions({ bypassDeleted: true })
    .lean();

  if (existingFeature) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Feature with this value already exists',
    );
  }

  const result = await Feature.create(featureData);
  return result.toObject();
};

export const getPublicFeature = async (id: string): Promise<TFeature> => {
  const result = await Feature.findOne({
    _id: id,
    is_active: true,
  }).populate('children');
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
  }
  return result;
};

export const getPublicFeatureByValue = async (
  value: string,
): Promise<TFeature> => {
  const result = await Feature.findOne({
    value: value.toLowerCase().trim(),
    is_active: true,
  }).populate('children');
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
  }
  return result;
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
  const { all = false, parent, type, ...rest } = query;

  const filter: Record<string, unknown> = {
    is_active: true,
  };

  if (parent !== undefined) {
    filter.parent = parent === null || parent === '' ? null : parent;
  } else if (!all) {
    filter.parent = { $not: { $type: 'objectId' } };
  }

  if (type) {
    filter.type = type;
  }

  const featureQuery = new AppQueryFind(Feature, { ...rest, ...filter })
    .populate([{ path: 'children' }])
    .search(['name', 'description', 'path'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await featureQuery.execute();

  return result;
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
    filter.parent = parent === null || parent === '' ? null : parent;
  } else if (!all) {
    filter.parent = { $not: { $type: 'objectId' } };
  }

  if (type) {
    filter.type = type;
  }

  const featureQuery = new AppQueryFind(Feature, { ...rest, ...filter })
    .populate([{ path: 'children' }])
    .search(['name', 'description', 'path'])
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
    .fields()
    .tap((q) => q.lean());

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

  // If value is being updated, ensure it's lowercase and check for duplicates
  const updatePayload: Partial<TFeature> = { ...payload };
  if (payload.value !== undefined) {
    updatePayload.value = payload.value.toLowerCase().trim();

    // Check for duplicate value (excluding current record and non-deleted only)
    const existingFeature = await Feature.findOne({
      value: updatePayload.value,
      _id: { $ne: id },
      is_deleted: { $ne: true },
    })
      .setOptions({ bypassDeleted: true })
      .lean();

    if (existingFeature) {
      throw new AppError(
        httpStatus.CONFLICT,
        'Feature with this value already exists',
      );
    }
  }

  const result = await Feature.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  });

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
};

export const deleteFeaturePermanent = async (id: string): Promise<void> => {
  const feature = await Feature.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (!feature) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
  }

  await Feature.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
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

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
