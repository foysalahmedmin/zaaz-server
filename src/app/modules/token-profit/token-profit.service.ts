import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/AppError';
import AppQuery from '../../builder/AppQuery';
import { TokenProfitHistory } from '../token-profit-history/token-profit-history.model';
import { TokenProfit } from './token-profit.model';
import { TTokenProfit } from './token-profit.type';

export const createTokenProfit = async (
  data: TTokenProfit,
  session?: mongoose.ClientSession,
): Promise<TTokenProfit> => {
  const result = await TokenProfit.create([data], { session });
  return result[0].toObject();
};

export const getPublicTokenProfit = async (
  id: string,
): Promise<TTokenProfit> => {
  const result = await TokenProfit.findOne({
    _id: id,
    is_active: true,
  });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Token profit not found');
  }
  return result;
};

export const getTokenProfit = async (id: string): Promise<TTokenProfit> => {
  const result = await TokenProfit.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Token profit not found');
  }
  return result;
};

export const getPublicTokenProfits = async (
  query: Record<string, unknown>,
): Promise<{
  data: TTokenProfit[];
  meta: { total: number; page: number; limit: number };
}> => {
  const filter: Record<string, unknown> = {
    is_active: true,
  };

  const tokenProfitQuery = new AppQuery<TTokenProfit>(
    TokenProfit.find(),
    { ...query, ...filter },
  )
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await tokenProfitQuery.execute();

  return result;
};

export const getTokenProfits = async (
  query: Record<string, unknown>,
): Promise<{
  data: TTokenProfit[];
  meta: { total: number; page: number; limit: number };
}> => {
  const tokenProfitQuery = new AppQuery<TTokenProfit>(
    TokenProfit.find(),
    query,
  )
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await tokenProfitQuery.execute([
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

export const updateTokenProfit = async (
  id: string,
  payload: Partial<TTokenProfit>,
  session?: mongoose.ClientSession,
): Promise<TTokenProfit> => {
  const tokenProfitData = await TokenProfit.findById(id).lean();
  if (!tokenProfitData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Token profit not found');
  }

  // Create history before update
  await TokenProfitHistory.create(
    [
      {
        token_profit: id,
        name: tokenProfitData.name,
        percentage: tokenProfitData.percentage,
        is_active: tokenProfitData.is_active,
        is_deleted: tokenProfitData.is_deleted,
      },
    ],
    { session },
  );

  const result = await TokenProfit.findByIdAndUpdate(
    id,
    payload,
    {
      new: true,
      runValidators: true,
    },
  ).session(session || null);

  return result!;
};

export const updateTokenProfits = async (
  ids: string[],
  payload: Partial<Pick<TTokenProfit, 'is_active'>>,
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const tokenProfits = await TokenProfit.find({ _id: { $in: ids } }).lean();
  const foundIds = tokenProfits.map((tp) => tp._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await TokenProfit.updateMany(
    { _id: { $in: foundIds } },
    { ...payload },
  );

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const deleteTokenProfit = async (id: string): Promise<void> => {
  const tokenProfit = await TokenProfit.findById(id);
  if (!tokenProfit) {
    throw new AppError(httpStatus.NOT_FOUND, 'Token profit not found');
  }

  await tokenProfit.softDelete();
};

export const deleteTokenProfitPermanent = async (id: string): Promise<void> => {
  const tokenProfit = await TokenProfit.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (!tokenProfit) {
    throw new AppError(httpStatus.NOT_FOUND, 'Token profit not found');
  }

  await TokenProfit.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};

export const deleteTokenProfits = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const tokenProfits = await TokenProfit.find({ _id: { $in: ids } }).lean();
  const foundIds = tokenProfits.map((tp) => tp._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await TokenProfit.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteTokenProfitsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const tokenProfits = await TokenProfit.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();

  const foundIds = tokenProfits.map((tp) => tp._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await TokenProfit.deleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreTokenProfit = async (id: string): Promise<TTokenProfit> => {
  const tokenProfit = await TokenProfit.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );

  if (!tokenProfit) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Token profit not found or not deleted',
    );
  }

  return tokenProfit;
};

export const restoreTokenProfits = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await TokenProfit.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredTokenProfits = await TokenProfit.find({
    _id: { $in: ids },
  }).lean();
  const restoredIds = restoredTokenProfits.map((tp) => tp._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

