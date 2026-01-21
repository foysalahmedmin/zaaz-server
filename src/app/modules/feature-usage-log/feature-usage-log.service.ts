import httpStatus from 'http-status';
import AppQueryAggregation from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { FeatureEndpoint } from '../feature-endpoint/feature-endpoint.model';
import { getPublicFeatureEndpointByIdOrValue } from '../feature-endpoint/feature-endpoint.service';
import { FeatureUsageLog } from './feature-usage-log.model';
import {
  TFeatureUsageLog,
  TFeatureUsageLogFromServer,
} from './feature-usage-log.type';
import { createFeatureUsageLogValidationSchema } from './feature-usage-log.validation';

export const createFeatureUsageLogFromServer = async (
  payload: TFeatureUsageLogFromServer,
): Promise<TFeatureUsageLog> => {
  const {
    feature_endpoint_id,
    feature_endpoint_value,
    user_id,
    user_email,
    status,
    ...rest
  } = payload;

  let featureEndpoint;
  try {
    featureEndpoint = await getPublicFeatureEndpointByIdOrValue({
      _id: feature_endpoint_id,
      value: feature_endpoint_value,
    });
  } catch (error) {
    // Ignore error if feature endpoint is not found
  }

  const data = {
    ...rest,
    feature_endpoint: featureEndpoint?._id?.toString(),
    user: user_id,
    email: user_email,
    status,
  };

  const parsedData =
    createFeatureUsageLogValidationSchema.shape.body.parse(data);

  const result = await FeatureUsageLog.create(parsedData);
  return result;
};

export const createFeatureUsageLog = async (
  payload: TFeatureUsageLog,
): Promise<TFeatureUsageLog> => {
  const result = await FeatureUsageLog.create(payload);
  return result;
};

/**
 * Get all feature usage logs with pagination and filtering
 */
export const getFeatureUsageLogs = async (
  query_params: Record<string, unknown>,
): Promise<{ data: TFeatureUsageLog[]; meta: any }> => {
  const { gte, lte, feature, feature_endpoint, status, ...rest } = query_params;

  const filter: Record<string, any> = {};

  // Date range filter
  if (gte || lte) {
    filter.created_at = {};
    if (gte) {
      filter.created_at.$gte = new Date(gte as string);
    }
    if (lte) {
      filter.created_at.$lte = new Date(lte as string);
    }
  }

  // Feature filter (if feature_endpoint is not provided)
  if (feature && !feature_endpoint) {
    const endpoints = await FeatureEndpoint.find({ feature }).select('_id');
    filter.feature_endpoint = { $in: endpoints.map((e) => e._id) };
  } else if (feature_endpoint) {
    filter.feature_endpoint = feature_endpoint;
  }

  if (status) {
    filter.status = status;
  }

  const appQuery = new AppQueryAggregation(FeatureUsageLog, rest);

  if (Object.keys(filter).length > 0) {
    appQuery.pipeline([{ $match: filter }]);
  }

  appQuery
    .populate({
      path: 'feature_endpoint',
      select: 'name method endpoint feature',
      populate: {
        path: 'feature',
        select: 'name value',
      },
    })
    .search(['email', 'usage_key', 'status', 'type', 'endpoint'])
    .filter()
    .sort(['code', 'status', 'created_at'] as any)
    .paginate()
    .fields();

  const [result, aggregateStats] = await Promise.all([
    appQuery.execute([
      {
        key: 'success',
        filter: { status: 'success' },
      },
      {
        key: 'failed',
        filter: { status: 'failed' },
      },
    ]),
    FeatureUsageLog.aggregate([
      { $match: { ...filter, is_deleted: { $ne: true } } },
      {
        $group: {
          _id: null,
        },
      },
    ]),
  ]);

  if (aggregateStats.length > 0) {
    result.meta.statistics = {
      ...result.meta.statistics,
    };
  } else {
    result.meta.statistics = {
      ...result.meta.statistics,
    };
  }

  return result;
};

/**
 * Get single feature usage log by ID
 */
export const getFeatureUsageLog = async (
  id: string,
): Promise<TFeatureUsageLog> => {
  const result = await FeatureUsageLog.findById(id)
    .populate('feature_endpoint')
    .select('+profit_credits +cost_credits +cost_price');
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature usage log not found');
  }
  return result;
};

/**
 * Soft delete feature usage log
 */
export const deleteFeatureUsageLog = async (id: string): Promise<void> => {
  const log = await FeatureUsageLog.findById(id).lean();
  if (!log) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature usage log not found');
  }

  await FeatureUsageLog.findByIdAndUpdate(id, { is_deleted: true });
};

/**
 * Permanent delete feature usage log
 */
export const deleteFeatureUsageLogPermanent = async (
  id: string,
): Promise<void> => {
  const log = await FeatureUsageLog.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!log) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature usage log not found');
  }

  await FeatureUsageLog.findByIdAndDelete(id);
};

/**
 * Soft delete multiple feature usage logs
 */
export const deleteFeatureUsageLogs = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const logs = await FeatureUsageLog.find({ _id: { $in: ids } }).lean();
  const foundIds = logs.map((log) => log._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await FeatureUsageLog.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

/**
 * Permanent delete multiple feature usage logs
 */
export const deleteFeatureUsageLogsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const logs = await FeatureUsageLog.find({ _id: { $in: ids } }).lean();
  const foundIds = logs.map((log) => log._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await FeatureUsageLog.deleteMany({ _id: { $in: foundIds } }).setOptions({
    bypassDeleted: true,
  });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};
