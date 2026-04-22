import mongoose from 'mongoose';
import * as PackageFeatureRepository from './package-feature.repository';
import { TPackageFeature } from './package-feature.type';

export const createPackageFeatures = async (
  payload: Partial<TPackageFeature>[],
  session?: mongoose.ClientSession,
) => {
  return await PackageFeatureRepository.create(payload, session);
};

export const getPackageFeaturesByPackage = async (
  packageId: string,
  populate = false,
) => {
  return await PackageFeatureRepository.findByPackage(packageId, populate);
};

export const updatePackageFeatures = async (
  packageId: string,
  featureIds: string[],
  session?: mongoose.ClientSession,
) => {
  const existingFeatures = await PackageFeatureRepository.findRawByPackage(packageId, session);
  const existingFeatureIds = existingFeatures.map((pf) => pf.feature.toString());

  const toAdd = featureIds.filter((id) => !existingFeatureIds.includes(id));
  const toRemove = existingFeatureIds.filter((id) => !featureIds.includes(id));

  if (toRemove.length > 0) {
    await PackageFeatureRepository.updateMany(
      {
        package: new mongoose.Types.ObjectId(packageId),
        feature: { $in: toRemove },
      },
      { is_deleted: true, is_active: false },
      session,
    );
  }

  if (toAdd.length > 0) {
    const newFeatures = toAdd.map((featureId) => ({
      package: new mongoose.Types.ObjectId(packageId),
      feature: new mongoose.Types.ObjectId(featureId),
      is_active: true,
    }));
    await PackageFeatureRepository.create(newFeatures, session);
  }

  if (toAdd.length > 0) {
    await PackageFeatureRepository.updateMany(
      {
        package: new mongoose.Types.ObjectId(packageId),
        feature: { $in: toAdd },
        is_deleted: true,
      },
      { is_deleted: false, is_active: true },
      session,
    );
  }
};

export const deletePackageFeaturesByPackage = async (
  packageId: string,
  session?: mongoose.ClientSession,
) => {
  return await PackageFeatureRepository.deleteByPackage(packageId, session);
};
