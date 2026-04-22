import mongoose from 'mongoose';
import { PackageFeatureConfig } from './package-feature-config.model';
import { TPackageFeatureConfig } from './package-feature-config.type';

export { PackageFeatureConfig };

export const create = async (
  data: TPackageFeatureConfig,
  session?: mongoose.ClientSession,
): Promise<TPackageFeatureConfig> => {
  const result = await PackageFeatureConfig.create([data], { session });
  return result[0].toObject();
};

export const findById = async (
  id: string,
  session?: mongoose.ClientSession,
): Promise<TPackageFeatureConfig | null> => {
  return await PackageFeatureConfig.findById(id)
    .session(session || null)
    .populate('package', 'name')
    .populate('feature', 'name value')
    .populate('feature_endpoint', 'name value endpoint')
    .lean();
};

export const findByIdRaw = async (
  id: string,
  session?: mongoose.ClientSession,
  bypassDeleted = false,
): Promise<TPackageFeatureConfig | null> => {
  const query = PackageFeatureConfig.findById(id).session(session || null);
  if (bypassDeleted) query.setOptions({ bypassDeleted: true });
  return await query.lean();
};

export const find = async (
  filter: Record<string, unknown>,
): Promise<TPackageFeatureConfig[]> => {
  return await PackageFeatureConfig.find(filter)
    .populate('package', 'name')
    .populate('feature', 'name value')
    .populate('feature_endpoint', 'name value endpoint')
    .sort({ sequence: 1, created_at: -1 })
    .lean();
};

export const findOne = async (
  filter: Record<string, unknown>,
): Promise<TPackageFeatureConfig | null> => {
  return await PackageFeatureConfig.findOne(filter).lean();
};

export const updateById = async (
  id: string,
  payload: Partial<TPackageFeatureConfig>,
  session?: mongoose.ClientSession,
): Promise<TPackageFeatureConfig | null> => {
  return await PackageFeatureConfig.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
    session,
  });
};

export const softDeleteById = async (
  id: string,
  session?: mongoose.ClientSession,
): Promise<void> => {
  const config = await PackageFeatureConfig.findById(id).session(session || null);
  if (config) await config.softDelete();
};

export const permanentDeleteById = async (id: string): Promise<void> => {
  await PackageFeatureConfig.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};

export const updateManyByPackage = async (
  packageId: string,
  update: Record<string, unknown>,
  session?: mongoose.ClientSession,
): Promise<void> => {
  await PackageFeatureConfig.updateMany(
    { package: new mongoose.Types.ObjectId(packageId) },
    update,
    { session },
  );
};

export const bulkWrite = async (
  operations: any[],
  session?: mongoose.ClientSession,
): Promise<void> => {
  await PackageFeatureConfig.bulkWrite(operations, { session });
};
