import AppAggregationQuery from '../../builder/app-aggregation-query';
import { FeatureUsageLog } from './feature-usage-log.model';
import { TFeatureUsageLog } from './feature-usage-log.type';

export { FeatureUsageLog };

export const create = async (data: Partial<TFeatureUsageLog>): Promise<TFeatureUsageLog> => {
  const result = await FeatureUsageLog.create(data);
  return result;
};

export const findById = async (id: string): Promise<TFeatureUsageLog | null> => {
  return await FeatureUsageLog.findById(id)
    .populate('feature_endpoint')
    .select('+profit_credits +cost_credits +cost_price');
};

export const findByIdRaw = async (
  id: string,
  bypassDeleted = false,
): Promise<TFeatureUsageLog | null> => {
  const query = FeatureUsageLog.findById(id);
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const findMany = async (filter: Record<string, unknown>): Promise<TFeatureUsageLog[]> => {
  return await FeatureUsageLog.find(filter).lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
  filter: Record<string, unknown> = {},
  groups?: { key: string; filter: Record<string, unknown> }[],
): Promise<any> => {
  const appQuery = new AppAggregationQuery(FeatureUsageLog, query);

  if (Object.keys(filter).length > 0) {
    appQuery.pipeline([{ $match: filter }]);
  }

  appQuery
    .populate({
      path: 'feature_endpoint',
      select: 'name method endpoint feature',
      populate: { path: 'feature', select: 'name value' },
    })
    .search(['email', 'usage_key', 'status', 'type', 'endpoint'])
    .filter()
    .sort(['code', 'status', 'created_at'] as any)
    .paginate()
    .fields();

  return await appQuery.execute(groups);
};

export const aggregate = async (pipeline: any[]): Promise<any[]> => {
  return await FeatureUsageLog.aggregate(pipeline);
};

export const softDeleteById = async (id: string): Promise<void> => {
  await FeatureUsageLog.findByIdAndUpdate(id, { is_deleted: true });
};

export const permanentDeleteById = async (id: string): Promise<void> => {
  await FeatureUsageLog.findByIdAndDelete(id);
};

export const updateMany = async (
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
): Promise<void> => {
  await FeatureUsageLog.updateMany(filter, update);
};

export const permanentDeleteMany = async (filter: Record<string, unknown>): Promise<void> => {
  await FeatureUsageLog.deleteMany(filter).setOptions({ bypassDeleted: true });
};
