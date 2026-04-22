import AppAggregationQuery from '../../builder/app-aggregation-query';
import mongoose from 'mongoose';
import { PackagePrice } from './package-price.model';
import { TPackagePrice } from './package-price.type';

export { PackagePrice };

export const findById = async (
  id: string | mongoose.Types.ObjectId,
  session?: mongoose.ClientSession,
): Promise<TPackagePrice | null> => {
  return await PackagePrice.findById(id).session(session || null).lean();
};

export const findOne = async (
  filter: Record<string, unknown>,
  session?: mongoose.ClientSession,
  bypassDeleted = false,
): Promise<TPackagePrice | null> => {
  const query = PackagePrice.findOne(filter).session(session || null);
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const create = async (
  data: TPackagePrice,
  session?: mongoose.ClientSession,
): Promise<TPackagePrice> => {
  const result = await PackagePrice.create([data], { session });
  return result[0].toObject();
};

export const createMany = async (
  data: TPackagePrice[],
  session?: mongoose.ClientSession,
): Promise<TPackagePrice[]> => {
  const results = await PackagePrice.create(data, { session });
  return results.map((r) => r.toObject());
};

export const findByPackage = async (
  packageId: string,
  activeOnly = false,
): Promise<TPackagePrice[]> => {
  const filter: any = { package: packageId, is_deleted: { $ne: true } };
  if (activeOnly) filter.is_active = true;
  return await PackagePrice.find(filter)
    .populate('interval')
    .sort({ is_initial: -1, created_at: 1 })
    .lean();
};

export const findPaginated = async (
  query: Record<string, unknown>,
  filter: Record<string, unknown> = {},
  groups?: { key: string; filter: Record<string, unknown> }[],
): Promise<any> => {
  const q = new AppAggregationQuery<TPackagePrice>(PackagePrice, { ...query, ...filter });
  q.populate({ path: 'interval', justOne: true })
    .populate({ path: 'package', justOne: true })
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();
  return await q.execute(groups);
};

export const updateById = async (
  id: string | mongoose.Types.ObjectId,
  payload: Partial<TPackagePrice>,
  session?: mongoose.ClientSession,
): Promise<TPackagePrice | null> => {
  return await PackagePrice.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).session(session || null);
};

export const updateMany = async (
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await PackagePrice.updateMany(filter, update, { session });
};

export const softDeleteById = async (
  id: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  const doc = await PackagePrice.findById(id).session(session || null);
  if (doc) await doc.softDelete();
};

export const softDeleteByPackage = async (
  packageId: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await PackagePrice.updateMany({ package: packageId }, { is_deleted: true }, { session });
};

export const restoreByPackage = async (
  packageId: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await PackagePrice.updateMany(
    { package: packageId, is_deleted: true },
    { is_deleted: false },
    { session },
  );
};
