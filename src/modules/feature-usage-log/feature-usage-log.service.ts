import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import { FeatureEndpoint } from '../feature-endpoint/feature-endpoint.model';
import { getPublicFeatureEndpointByIdOrValue } from '../feature-endpoint/feature-endpoint.service';
import * as FeatureUsageLogRepository from './feature-usage-log.repository';
import {
  TFeatureUsageLog,
  TFeatureUsageLogFromServer,
} from './feature-usage-log.type';
import { createFeatureUsageLogValidationSchema } from './feature-usage-log.validator';

export const createFeatureUsageLogFromServer = async (
  payload: TFeatureUsageLogFromServer,
): Promise<TFeatureUsageLog> => {
  const { feature_endpoint_id, feature_endpoint_value, user_id, user_email, status, ...rest } =
    payload;

  let featureEndpoint;
  try {
    featureEndpoint = await getPublicFeatureEndpointByIdOrValue({
      _id: feature_endpoint_id,
      value: feature_endpoint_value,
    });
  } catch {
    // Ignore error if feature endpoint is not found
  }

  const data = {
    ...rest,
    feature_endpoint: featureEndpoint?._id,
    user: user_id,
    email: user_email,
    status,
  };

  const parsedData = createFeatureUsageLogValidationSchema.shape.body.parse(data);
  return await FeatureUsageLogRepository.create(parsedData as unknown as Partial<TFeatureUsageLog>);
};

export const createFeatureUsageLog = async (
  payload: TFeatureUsageLog,
): Promise<TFeatureUsageLog> => {
  return await FeatureUsageLogRepository.create(payload);
};

export const getFeatureUsageLogs = async (
  query_params: Record<string, unknown>,
): Promise<{ data: TFeatureUsageLog[]; meta: any }> => {
  const { gte, lte, feature, feature_endpoint, status, ...rest } = query_params;

  const filter: Record<string, any> = {};

  if (gte || lte) {
    filter.created_at = {};
    if (gte) filter.created_at.$gte = new Date(gte as string);
    if (lte) filter.created_at.$lte = new Date(lte as string);
  }

  if (feature && !feature_endpoint) {
    const endpoints = await FeatureEndpoint.find({ feature }).select('_id');
    filter.feature_endpoint = { $in: endpoints.map((e) => e._id) };
  } else if (feature_endpoint) {
    filter.feature_endpoint = feature_endpoint;
  }

  if (status) filter.status = status;

  const result = await FeatureUsageLogRepository.findPaginated(rest, filter, [
    { key: 'success', filter: { status: 'success' } },
    { key: 'failed', filter: { status: 'failed' } },
  ]);

  return result;
};

export const getFeatureUsageLog = async (id: string): Promise<TFeatureUsageLog> => {
  const result = await FeatureUsageLogRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature usage log not found');
  }
  return result;
};

export const deleteFeatureUsageLog = async (id: string): Promise<void> => {
  const logs = await FeatureUsageLogRepository.findMany({ _id: id });
  if (!logs.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature usage log not found');
  }
  await FeatureUsageLogRepository.softDeleteById(id);
};

export const deleteFeatureUsageLogPermanent = async (id: string): Promise<void> => {
  const log = await FeatureUsageLogRepository.findByIdRaw(id, true);
  if (!log) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature usage log not found');
  }
  await FeatureUsageLogRepository.permanentDeleteById(id);
};

export const deleteFeatureUsageLogs = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const logs = await FeatureUsageLogRepository.findMany({ _id: { $in: ids } });
  const foundIds = logs.map((log) => (log as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  await FeatureUsageLogRepository.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });
  return { count: foundIds.length, not_found_ids: notFoundIds };
};

export const deleteFeatureUsageLogsPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const logs = await FeatureUsageLogRepository.findMany({ _id: { $in: ids } });
  const foundIds = logs.map((log) => (log as any)._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));
  await FeatureUsageLogRepository.permanentDeleteMany({ _id: { $in: foundIds } });
  return { count: foundIds.length, not_found_ids: notFoundIds };
};
