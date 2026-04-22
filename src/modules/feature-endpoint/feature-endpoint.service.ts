import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import { withCache } from '../../utils/cache.utils';
import { clearFeatureCache } from '../feature/feature.service';
import * as FeatureEndpointRepository from './feature-endpoint.repository';
import { TFeatureEndpoint } from './feature-endpoint.type';

const CACHE_TTL = 86400;

export const createFeatureEndpoint = async (
  data: TFeatureEndpoint,
): Promise<TFeatureEndpoint> => {
  const featureEndpointData = {
    ...data,
    value: data.value?.toLowerCase().trim(),
  };

  if (featureEndpointData.value) {
    const existing = await FeatureEndpointRepository.findOne(
      { value: featureEndpointData.value, is_deleted: { $ne: true } },
      false,
      true,
    );
    if (existing) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Feature endpoint with value '${featureEndpointData.value}' already exists`,
      );
    }
  }

  const result = await FeatureEndpointRepository.create(featureEndpointData);
  await clearFeatureCache();
  return result;
};

export const getPublicFeatureEndpoint = async (
  id: string,
): Promise<TFeatureEndpoint> => {
  const result = await FeatureEndpointRepository.findOne(
    { _id: id, is_active: true },
    true,
  );
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
      const filter: any = { is_active: true };

      if (_id && mongoose.Types.ObjectId.isValid(_id) && value) {
        filter.$or = [{ _id: new mongoose.Types.ObjectId(_id) }, { value }];
      } else if (_id && mongoose.Types.ObjectId.isValid(_id)) {
        filter._id = new mongoose.Types.ObjectId(_id);
      } else if (value) {
        filter.value = value;
      }

      const result = await FeatureEndpointRepository.findOne(filter, true);
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
  const result = await FeatureEndpointRepository.findById(id, true);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
  }
  return result;
};

export const getPublicFeatureEndpoints = async (
  query: Record<string, unknown>,
): Promise<{ data: TFeatureEndpoint[]; meta: any }> => {
  const { feature, method, ...rest } = query;
  const filter: Record<string, unknown> = { is_active: true };

  if (feature) filter.feature = new mongoose.Types.ObjectId(feature as string);
  if (method) filter.method = method;

  return await FeatureEndpointRepository.findPaginated(rest, filter);
};

export const getFeatureEndpoints = async (
  query: Record<string, unknown>,
): Promise<{ data: TFeatureEndpoint[]; meta: any }> => {
  const { feature, method, ...rest } = query;
  const filter: Record<string, unknown> = {};

  if (feature) filter.feature = new mongoose.Types.ObjectId(feature as string);
  if (method) filter.method = method;

  return await FeatureEndpointRepository.findPaginated(rest, filter, [
    { key: 'active', filter: { is_active: true } },
    { key: 'inactive', filter: { is_active: false } },
  ]);
};

export const updateFeatureEndpoint = async (
  id: string,
  payload: Partial<TFeatureEndpoint>,
): Promise<TFeatureEndpoint> => {
  const existing = await FeatureEndpointRepository.findById(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
  }

  const updateData: Partial<TFeatureEndpoint> = { ...payload };
  if (payload.value !== undefined) {
    updateData.value = payload.value.toLowerCase().trim();

    const conflict = await FeatureEndpointRepository.findOne(
      { value: updateData.value, _id: { $ne: id }, is_deleted: { $ne: true } },
      false,
      true,
    );
    if (conflict) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Feature endpoint with value '${updateData.value}' already exists`,
      );
    }
  }

  const result = await FeatureEndpointRepository.updateById(id, updateData);
  await clearFeatureCache();
  return result!;
};

export const updateFeatureEndpoints = async (
  ids: string[],
  payload: Partial<Pick<TFeatureEndpoint, 'is_active'>>,
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await FeatureEndpointRepository.findByIds(ids);
  const foundIds = existing.map((fe) => (fe as any)._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  const result = await FeatureEndpointRepository.updateMany(
    { _id: { $in: foundIds } },
    payload,
  );
  await clearFeatureCache();
  return { count: result.modifiedCount, not_found_ids };
};

export const deleteFeatureEndpoint = async (id: string): Promise<void> => {
  const existing = await FeatureEndpointRepository.findById(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
  }
  await FeatureEndpointRepository.softDeleteById(id);
  await clearFeatureCache();
};

export const deleteFeatureEndpointPermanent = async (
  id: string,
): Promise<void> => {
  const existing = await FeatureEndpointRepository.findById(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
  }
  await FeatureEndpointRepository.permanentDeleteById(id);
  await clearFeatureCache();
};

export const deleteFeatureEndpoints = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await FeatureEndpointRepository.findByIds(ids);
  const foundIds = existing.map((fe) => (fe as any)._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  await FeatureEndpointRepository.softDeleteMany(foundIds);
  await clearFeatureCache();
  return { count: foundIds.length, not_found_ids };
};

export const deleteFeatureEndpointsPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await FeatureEndpointRepository.findByIds(ids, true);
  const deletable = existing.filter((fe: any) => fe.is_deleted);
  const foundIds = deletable.map((fe: any) => fe._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  await FeatureEndpointRepository.permanentDeleteMany(foundIds);
  await clearFeatureCache();
  return { count: foundIds.length, not_found_ids };
};

export const restoreFeatureEndpoint = async (
  id: string,
): Promise<TFeatureEndpoint> => {
  const result = await FeatureEndpointRepository.restore(id);
  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Feature endpoint not found or not deleted',
    );
  }
  await clearFeatureCache();
  return result;
};

export const restoreFeatureEndpoints = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await FeatureEndpointRepository.restoreMany(ids);

  const restored = await FeatureEndpointRepository.findByIds(ids);
  const restoredIds = restored.map((fe: any) => fe._id.toString());
  const not_found_ids = ids.filter((id) => !restoredIds.includes(id));

  await clearFeatureCache();
  return { count: result.modifiedCount, not_found_ids };
};
