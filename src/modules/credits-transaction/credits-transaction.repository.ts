import AppAggregationQuery from '../../builder/app-aggregation-query';
import { UserWallet } from '../user-wallet/user-wallet.model';
import { CreditsTransaction } from './credits-transaction.model';
import { TCreditsTransaction } from './credits-transaction.type';
import mongoose from 'mongoose';

export { CreditsTransaction };

export const create = async (
  data: TCreditsTransaction,
  session?: mongoose.ClientSession,
): Promise<TCreditsTransaction> => {
  const result = await CreditsTransaction.create([data], { session });
  return result[0].toObject();
};

export const findById = async (
  id: string | mongoose.Types.ObjectId,
  selectSensitive = false,
): Promise<TCreditsTransaction | null> => {
  let query = CreditsTransaction.findById(id).populate([
    { path: 'user_wallet', select: '_id credits' },
    { path: 'decrease_source', select: '_id name endpoint credits' },
    { path: 'payment_transaction', select: '_id status amount currency' },
  ]);
  if (selectSensitive) {
    query = query.select('+profit_credits +cost_credits +cost_price') as typeof query;
  }
  return await query.lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
  filter: Record<string, unknown> = {},
  fieldOverrides?: string,
): Promise<any> => {
  const q = new AppAggregationQuery<TCreditsTransaction>(CreditsTransaction, {
    ...query,
    ...filter,
  });

  q.populate([
    { path: 'user_wallet', select: '_id credits', justOne: true },
    { path: 'decrease_source', select: '_id name endpoint credits', justOne: true },
    { path: 'payment_transaction', select: '_id status amount currency', justOne: true },
    { path: 'plan', select: '_id name', justOne: true },
  ])
    .search(['email', 'usage_key'])
    .filter()
    .sort(['type', 'credits', 'created_at', 'updated_at'] as any)
    .paginate();

  if (fieldOverrides) {
    (q as any)._fieldOverride = fieldOverrides;
  }

  q.fields();

  return await q.execute([
    { key: 'increase', filter: { type: 'increase' } },
    { key: 'decrease', filter: { type: 'decrease' } },
    { key: 'from_payment', filter: { type: 'increase', increase_source: 'payment' } },
    { key: 'from_bonus', filter: { type: 'increase', increase_source: 'bonus' } },
  ]);
};

export const findWalletById = async (
  id: string | mongoose.Types.ObjectId,
  session?: mongoose.ClientSession,
): Promise<any | null> => {
  return await UserWallet.findById(id)
    .session(session || null)
    .lean();
};

export const updateWalletCredits = async (
  walletId: string | mongoose.Types.ObjectId,
  inc: number,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await UserWallet.findByIdAndUpdate(
    walletId,
    { $inc: { credits: inc } },
    { session },
  );
};

export const saveWallet = async (wallet: any): Promise<void> => {
  await wallet.save();
};

export const softDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<void> => {
  await CreditsTransaction.findByIdAndUpdate(id, { is_deleted: true });
};

export const softDeleteMany = async (ids: string[]): Promise<void> => {
  await CreditsTransaction.updateMany(
    { _id: { $in: ids } },
    { is_deleted: true },
  );
};

export const permanentDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<void> => {
  await CreditsTransaction.findByIdAndDelete(id);
};

export const permanentDeleteMany = async (ids: string[]): Promise<void> => {
  await CreditsTransaction.deleteMany({ _id: { $in: ids } }).setOptions({
    bypassDeleted: true,
  });
};

export const findByIds = async (
  ids: string[],
  bypassDeleted = false,
): Promise<TCreditsTransaction[]> => {
  const query = CreditsTransaction.find({ _id: { $in: ids } });
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const restore = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TCreditsTransaction | null> => {
  return await CreditsTransaction.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();
};

export const restoreMany = async (
  ids: string[],
): Promise<{ modifiedCount: number }> => {
  return await CreditsTransaction.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );
};
