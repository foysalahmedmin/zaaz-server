import mongoose from 'mongoose';
import { PackageFeature } from './package-feature.model';
import { TPackageFeature } from './package-feature.type';

export { PackageFeature };

export const create = async (
  payload: Partial<TPackageFeature>[],
  session?: mongoose.ClientSession,
): Promise<TPackageFeature[]> => {
  const results = await PackageFeature.create(payload, { session });
  return results.map((r) => r.toObject());
};

export const findByPackage = async (
  packageId: string,
  populate = false,
): Promise<TPackageFeature[]> => {
  const query = PackageFeature.find({
    package: new mongoose.Types.ObjectId(packageId),
    is_active: true,
  });
  if (populate) query.populate('feature');
  return await query.lean();
};

export const findRawByPackage = async (
  packageId: string,
  session?: mongoose.ClientSession,
) => {
  return await PackageFeature.find({
    package: new mongoose.Types.ObjectId(packageId),
  }).session(session || null);
};

export const updateMany = async (
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await PackageFeature.updateMany(filter, update, { session });
};

export const deleteByPackage = async (
  packageId: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await PackageFeature.updateMany(
    { package: new mongoose.Types.ObjectId(packageId) },
    { is_deleted: true, is_active: false },
    { session },
  );
};
