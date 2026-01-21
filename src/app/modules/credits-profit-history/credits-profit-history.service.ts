import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { CreditsProfitHistory } from './credits-profit-history.model';
import { TCreditsProfitHistory } from './credits-profit-history.type';

export const getCreditsProfitHistories = async (
  creditsProfitId: string,
  query: Record<string, unknown> = {},
): Promise<{
  data: TCreditsProfitHistory[];
  meta: { total: number; page: number; limit: number };
}> => {
  const creditsProfitHistoryQuery =
    new AppAggregationQuery<TCreditsProfitHistory>(CreditsProfitHistory, query);
  creditsProfitHistoryQuery.pipeline([
    {
      $match: { credits_profit: new mongoose.Types.ObjectId(creditsProfitId) },
    },
  ]);

  creditsProfitHistoryQuery
    .populate([{ path: 'credits_profit', justOne: true }])
    .sort()
    .paginate()
    .fields();

  const result = await creditsProfitHistoryQuery.execute();

  return result;
};

export const getCreditsProfitHistory = async (
  id: string,
): Promise<TCreditsProfitHistory> => {
  const result = await CreditsProfitHistory.findById(id).populate([
    { path: 'credits_profit' },
  ]);
  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Credits profit history not found',
    );
  }
  return result;
};

export const deleteCreditsProfitHistory = async (id: string): Promise<void> => {
  const creditsProfitHistory = await CreditsProfitHistory.findById(id).lean();
  if (!creditsProfitHistory) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Credits profit history not found',
    );
  }

  await CreditsProfitHistory.findByIdAndUpdate(id, { is_deleted: true });
};

export const deleteCreditsProfitHistoryPermanent = async (
  id: string,
): Promise<void> => {
  const creditsProfitHistory = await CreditsProfitHistory.findById(
    id,
  ).setOptions({
    bypassDeleted: true,
  });
  if (!creditsProfitHistory) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Credits profit history not found',
    );
  }

  await CreditsProfitHistory.findByIdAndDelete(id);
};

export const deleteCreditsProfitHistories = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const creditsProfitHistories = await CreditsProfitHistory.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = creditsProfitHistories.map((creditsProfitHistory) =>
    creditsProfitHistory._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await CreditsProfitHistory.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteCreditsProfitHistoriesPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const creditsProfitHistories = await CreditsProfitHistory.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = creditsProfitHistories.map((creditsProfitHistory) =>
    creditsProfitHistory._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await CreditsProfitHistory.deleteMany({ _id: { $in: foundIds } }).setOptions({
    bypassDeleted: true,
  });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreCreditsProfitHistory = async (
  id: string,
): Promise<TCreditsProfitHistory> => {
  const creditsProfitHistory = await CreditsProfitHistory.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();

  if (!creditsProfitHistory) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Credits profit history not found or not deleted',
    );
  }

  return creditsProfitHistory;
};

export const restoreCreditsProfitHistories = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await CreditsProfitHistory.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredCreditsProfitHistories = await CreditsProfitHistory.find({
    _id: { $in: ids },
  }).lean();
  const restoredIds = restoredCreditsProfitHistories.map(
    (creditsProfitHistory) => creditsProfitHistory._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
