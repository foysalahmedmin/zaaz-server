import mongoose from 'mongoose';
import { PackageFeature } from './package-feature.model';
import { TPackageFeature } from './package-feature.type';

export const createPackageFeatures = async (
  payload: Partial<TPackageFeature>[],
  session?: mongoose.ClientSession,
) => {
  return await PackageFeature.create(payload, { session });
};

export const getPackageFeaturesByPackage = async (
  packageId: string,
  populate: boolean = false,
) => {
  const query = PackageFeature.find({
    package: new mongoose.Types.ObjectId(packageId),
    is_active: true,
  });

  if (populate) {
    query.populate('feature');
  }

  return await query.lean();
};

export const updatePackageFeatures = async (
  packageId: string,
  featureIds: string[],
  session?: mongoose.ClientSession,
) => {
  // 1. Get existing features
  const existingFeatures = await PackageFeature.find({
    package: new mongoose.Types.ObjectId(packageId),
  }).session(session || null);

  const existingFeatureIds = existingFeatures.map((pf) =>
    pf.feature.toString(),
  );

  // 2. Determine additions and removals
  const toAdd = featureIds.filter((id) => !existingFeatureIds.includes(id));
  const toRemove = existingFeatureIds.filter((id) => !featureIds.includes(id));

  // 3. Remove features (Soft delete)
  if (toRemove.length > 0) {
    await PackageFeature.updateMany(
      {
        package: new mongoose.Types.ObjectId(packageId),
        feature: { $in: toRemove },
      },
      { is_deleted: true, is_active: false },
      { session },
    );
  }

  // 4. Add new features
  if (toAdd.length > 0) {
    const newFeatures = toAdd.map((featureId) => ({
      package: new mongoose.Types.ObjectId(packageId),
      feature: new mongoose.Types.ObjectId(featureId),
      is_active: true,
    }));
    await PackageFeature.create(newFeatures, { session });
  }

  // 5. Restore any that were deleted but are now back in the list (if hard delete logic wasn't used)
  // (Optional optimization: check if any "toAdd" were previously soft deleted and just undelete them)
  if (toAdd.length > 0) {
    await PackageFeature.updateMany(
      {
        package: new mongoose.Types.ObjectId(packageId),
        feature: { $in: toAdd },
        is_deleted: true,
      },
      { is_deleted: false, is_active: true },
      { session },
    );
  }
};

export const deletePackageFeaturesByPackage = async (
  packageId: string,
  session?: mongoose.ClientSession,
) => {
  return await PackageFeature.updateMany(
    { package: new mongoose.Types.ObjectId(packageId) },
    { is_deleted: true, is_active: false },
    { session },
  );
};
