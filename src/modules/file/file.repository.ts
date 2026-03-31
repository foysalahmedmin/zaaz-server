/**
 * File Repository
 *
 * Handles ALL direct database interactions for the File/Media module.
 */

import AppQueryFind from '../../builder/app-query-find';
import { File } from './file.model';
import { TFile, TFileDocument } from './file.type';

// ─── Create ───────────────────────────────────────────────────────────────────

export const create = async (data: Partial<TFile>): Promise<TFile> => {
  const result = await File.create(data);
  return result.toObject();
};

export const createMany = async (data: Partial<TFile>[]): Promise<TFile[]> => {
  const result = await File.insertMany(data);
  return result.map((item) => item.toObject());
};

// ─── Find One ────────────────────────────────────────────────────────────────

export const findById = async (id: string): Promise<TFileDocument | null> => {
  return await File.findById(id).populate([
    { path: 'author', select: '_id name email image' },
  ]);
};

export const findByIdLean = async (id: string): Promise<TFile | null> => {
  return await File.findById(id).lean();
};

export const findByIdWithDeleted = async (
  id: string,
): Promise<TFile | null> => {
  return await File.findById(id).setOptions({ bypassDeleted: true }).lean();
};

// ─── Find Many ────────────────────────────────────────────────────────────────

export const findManyByIds = async (ids: string[]): Promise<TFile[]> => {
  return await File.find({ _id: { $in: ids } }).lean();
};

export const findManyDeletedByIds = async (ids: string[]): Promise<TFile[]> => {
  return await File.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();
};

// ─── Paginated Lists ─────────────────────────────────────────────────────────

export const findPaginated = async (
  query: Record<string, unknown>,
  filterOverride: Record<string, unknown> = {},
): Promise<{
  data: TFile[];
  meta: { total: number; page: number; limit: number };
}> => {
  const fileQuery = new AppQueryFind(File, { ...query, ...filterOverride })
    .populate([{ path: 'author', select: '_id name email image' }])
    .search(['filename', 'originalname', 'name', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  return await fileQuery.execute([
    { key: 'active', filter: { status: 'active' } },
    { key: 'inactive', filter: { status: 'inactive' } },
    { key: 'archived', filter: { status: 'archived' } },
    { key: 'local', filter: { provider: 'local' } },
    { key: 'gcs', filter: { provider: 'gcs' } },
  ]);
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateById = async (
  id: string,
  payload: Partial<TFile>,
): Promise<TFileDocument | null> => {
  return await File.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const updateManyByIds = async (
  ids: string[],
  payload: Partial<TFile>,
): Promise<{ modifiedCount: number }> => {
  return await File.updateMany({ _id: { $in: ids } }, { ...payload });
};

export const restoreById = async (
  id: string,
): Promise<TFileDocument | null> => {
  return await File.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );
};

export const restoreManyByIds = async (
  ids: string[],
): Promise<{ modifiedCount: number }> => {
  return await File.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );
};

export const softDeleteManyByIds = async (ids: string[]): Promise<void> => {
  await File.updateMany({ _id: { $in: ids } }, { is_deleted: true });
};

// ─── Delete ───────────────────────────────────────────────────────────────────

export const hardDeleteById = async (id: string): Promise<void> => {
  await File.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};

export const hardDeleteManyByIds = async (ids: string[]): Promise<void> => {
  await File.deleteMany({
    _id: { $in: ids },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });
};
