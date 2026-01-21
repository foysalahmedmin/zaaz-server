import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { BillingSettingHistory } from './billing-setting-history.model';
import { TBillingSettingHistory } from './billing-setting-history.type';

export const getBillingSettingHistories = async (
  billingSettingId: string,
  query: Record<string, unknown> = {},
): Promise<{
  data: TBillingSettingHistory[];
  meta: { total: number; page: number; limit: number };
}> => {
  const historyQuery = new AppAggregationQuery<TBillingSettingHistory>(
    BillingSettingHistory,
    query,
  );

  historyQuery.pipeline([
    {
      $match: {
        billing_setting: new mongoose.Types.ObjectId(billingSettingId),
      },
    },
  ]);

  historyQuery
    .populate([{ path: 'billing_setting', justOne: true }])
    .sort()
    .paginate()
    .fields();

  const result = await historyQuery.execute();

  return result;
};

export const getBillingSettingHistory = async (
  id: string,
): Promise<TBillingSettingHistory> => {
  const result = await BillingSettingHistory.findById(id).populate([
    { path: 'billing_setting' },
  ]);
  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Billing Setting history not found',
    );
  }
  return result;
};

export const deleteBillingSettingHistory = async (
  id: string,
): Promise<void> => {
  const history = await BillingSettingHistory.findById(id).lean();
  if (!history) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Billing Setting history not found',
    );
  }

  await BillingSettingHistory.findByIdAndUpdate(id, { is_deleted: true });
};

export const deleteBillingSettingHistoryPermanent = async (
  id: string,
): Promise<void> => {
  const history = await BillingSettingHistory.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!history) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Billing Setting history not found',
    );
  }

  await BillingSettingHistory.findByIdAndDelete(id);
};

export const deleteBillingSettingHistories = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const histories = await BillingSettingHistory.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = histories.map((h) => h._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await BillingSettingHistory.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteBillingSettingHistoriesPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const histories = await BillingSettingHistory.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = histories.map((h) => h._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await BillingSettingHistory.deleteMany({ _id: { $in: foundIds } }).setOptions(
    {
      bypassDeleted: true,
    },
  );

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreBillingSettingHistory = async (
  id: string,
): Promise<TBillingSettingHistory> => {
  const history = await BillingSettingHistory.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();

  if (!history) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Billing Setting history not found or not deleted',
    );
  }

  return history;
};

export const restoreBillingSettingHistories = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await BillingSettingHistory.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredHistories = await BillingSettingHistory.find({
    _id: { $in: ids },
  }).lean();
  const restoredIds = restoredHistories.map((h) => h._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
