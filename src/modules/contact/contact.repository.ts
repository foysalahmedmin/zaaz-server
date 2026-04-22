import AppAggregationQuery from '../../builder/app-aggregation-query';
import { Contact } from './contact.model';
import { TContact, TCreateContact } from './contact.type';
import mongoose from 'mongoose';

export { Contact };

export const create = async (payload: TCreateContact): Promise<TContact> => {
  const result = await Contact.create(payload);
  return result.toObject();
};

export const findById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TContact | null> => {
  return await Contact.findById(id).lean();
};

export const findByIdWithDeleted = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TContact | null> => {
  return await Contact.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
): Promise<any> => {
  return await new AppAggregationQuery<TContact>(Contact, query)
    .search(['name', 'email', 'subject', 'message'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .execute();
};

export const findByIds = async (ids: string[]): Promise<TContact[]> => {
  return await Contact.find({ _id: { $in: ids } }).lean();
};

export const softDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<void> => {
  await Contact.findByIdAndUpdate(id, { is_deleted: true });
};

export const permanentDeleteById = async (
  id: string | mongoose.Types.ObjectId,
): Promise<void> => {
  await Contact.findByIdAndDelete(id);
};

export const softDeleteMany = async (ids: string[]): Promise<void> => {
  await Contact.updateMany({ _id: { $in: ids } }, { is_deleted: true });
};

export const permanentDeleteMany = async (ids: string[]): Promise<void> => {
  await Contact.deleteMany({ _id: { $in: ids } }).setOptions({
    bypassDeleted: true,
  });
};

export const restore = async (
  id: string | mongoose.Types.ObjectId,
): Promise<TContact | null> => {
  return await Contact.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).lean();
};

export const restoreMany = async (
  ids: string[],
): Promise<{ modifiedCount: number }> => {
  return await Contact.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );
};
