import httpStatus from 'http-status';
import AppError from '../../builder/AppError';
import AppFindQuery from '../../builder/AppFindQuery';
import { TokenProfitHistory } from './token-profit-history.model';
import { TTokenProfitHistory } from './token-profit-history.type';

export const getTokenProfitHistories = async (
  tokenProfitId: string,
  query: Record<string, unknown> = {},
): Promise<{
  data: TTokenProfitHistory[];
  meta: { total: number; page: number; limit: number };
}> => {
  const tokenProfitHistoryQuery = new AppFindQuery<TTokenProfitHistory>(
    TokenProfitHistory.find({ token_profit: tokenProfitId }).populate([
      { path: 'token_profit' },
    ]),
    query,
  )
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await tokenProfitHistoryQuery.execute();

  return result;
};

export const getTokenProfitHistory = async (
  id: string,
): Promise<TTokenProfitHistory> => {
  const result = await TokenProfitHistory.findById(id).populate([
    { path: 'token_profit' },
  ]);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Token profit history not found');
  }
  return result;
};

export const deleteTokenProfitHistory = async (id: string): Promise<void> => {
  const tokenProfitHistory = await TokenProfitHistory.findById(id).lean();
  if (!tokenProfitHistory) {
    throw new AppError(httpStatus.NOT_FOUND, 'Token profit history not found');
  }

  await TokenProfitHistory.findByIdAndUpdate(id, { is_deleted: true });
};

export const deleteTokenProfitHistoryPermanent = async (
  id: string,
): Promise<void> => {
  const tokenProfitHistory = await TokenProfitHistory.findById(id).setOptions({
    bypassDeleted: true,
  });
  if (!tokenProfitHistory) {
    throw new AppError(httpStatus.NOT_FOUND, 'Token profit history not found');
  }

  await TokenProfitHistory.findByIdAndDelete(id);
};

export const deleteTokenProfitHistories = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const tokenProfitHistories = await TokenProfitHistory.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = tokenProfitHistories.map((tokenProfitHistory) =>
    tokenProfitHistory._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await TokenProfitHistory.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteTokenProfitHistoriesPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const tokenProfitHistories = await TokenProfitHistory.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = tokenProfitHistories.map((tokenProfitHistory) =>
    tokenProfitHistory._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await TokenProfitHistory.deleteMany({ _id: { $in: foundIds } }).setOptions({
    bypassDeleted: true,
  });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreTokenProfitHistory = async (
  id: string,
): Promise<TTokenProfitHistory> => {
  const tokenProfitHistory = await TokenProfitHistory.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();

  if (!tokenProfitHistory) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Token profit history not found or not deleted',
    );
  }

  return tokenProfitHistory;
};

export const restoreTokenProfitHistories = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await TokenProfitHistory.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredTokenProfitHistories = await TokenProfitHistory.find({
    _id: { $in: ids },
  }).lean();
  const restoredIds = restoredTokenProfitHistories.map((tokenProfitHistory) =>
    tokenProfitHistory._id.toString(),
  );
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
