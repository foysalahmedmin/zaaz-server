import AppAggregationQuery from '../../builder/app-aggregation-query';
import { BillingSettingHistory } from '../billing-setting-history/billing-setting-history.model';
import { BillingSetting } from './billing-setting.model';
import { TBillingSetting } from './billing-setting.type';
import mongoose from 'mongoose';

export { BillingSetting };

export const create = async (
  payload: TBillingSetting,
  session?: mongoose.ClientSession,
): Promise<TBillingSetting> => {
  const result = await BillingSetting.create([payload], { session });
  return result[0];
};

export const findById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TBillingSetting | null> => {
  return await BillingSetting.findById(id).lean();
};

export const findOne = async (
  filter: Record<string, unknown>,
): Promise<TBillingSetting | null> => {
  return await BillingSetting.findOne(filter).lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
): Promise<any> => {
  return await new AppAggregationQuery(BillingSetting, query)
    .sort()
    .paginate()
    .fields()
    .execute();
};

export const countDocuments = async (
  filter: Record<string, unknown>,
  session?: mongoose.ClientSession,
): Promise<number> => {
  return await BillingSetting.countDocuments(filter).session(session || null);
};

export const updateMany = async (
  filter: Record<string, unknown>,
  update: Partial<TBillingSetting>,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await BillingSetting.updateMany(filter, update, { session });
};

export const updateById = async (
  id: string | mongoose.Types.ObjectId,
  payload: Partial<TBillingSetting>,
  session?: mongoose.ClientSession,
): Promise<TBillingSetting | null> => {
  return await BillingSetting.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
    session: session || null,
  }).lean();
};

export const softDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TBillingSetting | null> => {
  const doc = await BillingSetting.findById(id);
  if (!doc) return null;
  await (doc as any).softDelete();
  return doc.toObject();
};

export const permanentDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TBillingSetting | null> => {
  return await BillingSetting.findByIdAndDelete(id).setOptions({
    bypassDeleted: true,
  });
};

export const findByIds = async (
  ids: string[],
  bypassDeleted = false,
): Promise<TBillingSetting[]> => {
  const query = BillingSetting.find({ _id: { $in: ids } });
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const softDeleteMany = async (ids: string[]): Promise<void> => {
  await BillingSetting.updateMany(
    { _id: { $in: ids } },
    { is_deleted: true },
  );
};

export const permanentDeleteMany = async (ids: string[]): Promise<void> => {
  await BillingSetting.deleteMany({
    _id: { $in: ids },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });
};

export const restore = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TBillingSetting | null> => {
  return await BillingSetting.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false, is_active: false },
    { new: true },
  ).lean();
};

export const restoreMany = async (
  ids: string[],
): Promise<{ modifiedCount: number }> => {
  return await BillingSetting.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false, is_active: false },
  );
};

export const createHistory = async (
  existingSetting: TBillingSetting & { _id: any },
  session?: mongoose.ClientSession,
): Promise<void> => {
  await BillingSettingHistory.create(
    [
      {
        billing_setting: existingSetting._id,
        credit_price: existingSetting.credit_price,
        currency: existingSetting.currency,
        status: existingSetting.status,
        applied_at: existingSetting.applied_at,
        is_active: existingSetting.is_active,
        is_initial: existingSetting.is_initial,
        is_deleted: existingSetting.is_deleted,
      },
    ],
    { session },
  );
};
