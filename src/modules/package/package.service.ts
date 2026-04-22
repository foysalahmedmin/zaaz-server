import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/app-aggregation-query';
import AppError from '../../builder/app-error';
import { invalidateCacheByPattern, withCache } from '../../utils/cache.utils';
import * as PackageFeatureConfigServices from '../package-feature-config/package-feature-config.service';
import {
  createPackageFeatures,
  getPackageFeaturesByPackage,
  updatePackageFeatures,
} from '../package-feature/package-feature.service';
import { PackageHistory } from '../package-history/package-history.model';
import {
  createPackagePrices,
  deletePackagePricesByPackage,
  getPackagePricesByPackage,
} from '../package-price/package-price.service';
import * as PackageRepository from './package.repository';
import * as IntervalRepository from '../interval/interval.repository';
import { getPriceInCurrency } from '../../utils/currency.utils';
import { TPackage } from './package.type';

const CACHE_TTL = 86400; // 24 hours (Optimized for production with proper invalidation)

export const clearPackageCache = async () => {
  await invalidateCacheByPattern('package:*');
  await invalidateCacheByPattern('packages:public:*');
};

const transformPackageWithCurrency = (pkg: any) => {
  if (!pkg) return pkg;

  const transformedPrices = (pkg.prices || []).map((price: any) => ({
    ...price,
    price_bdt: getPriceInCurrency(price.price, 'BDT'),
  }));

  return {
    ...pkg,
    prices: transformedPrices,
  };
};

const getPricesLookupStage = () => [
  {
    $lookup: {
      from: 'packageprices',
      let: { packageId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$package', '$$packageId'] },
            is_deleted: { $ne: true },
            is_active: true,
          },
        },
        {
          $lookup: {
            from: 'intervals',
            localField: 'interval',
            foreignField: '_id',
            as: 'interval',
          },
        },
        {
          $unwind: {
            path: '$interval',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            interval: 1,
            price: 1,
            previous_price: 1,
            credits: 1,
            is_initial: 1,
            is_active: 1,
            _id: 1,
          },
        },
        {
          $sort: { is_initial: -1, created_at: 1 },
        },
      ],
      as: 'prices',
    },
  },
];

const getFeaturesLookupStage = () => [
  {
    $lookup: {
      from: 'packagefeatures',
      let: { packageId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$package', '$$packageId'] },
            is_deleted: { $ne: true },
            is_active: true,
          },
        },
        {
          $lookup: {
            from: 'features',
            localField: 'feature',
            foreignField: '_id',
            as: 'feature',
          },
        },
        {
          $unwind: {
            path: '$feature',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $replaceRoot: { newRoot: '$feature' },
        },
      ],
      as: 'features',
    },
  },
];

export const createPackage = async (
  data: TPackage & {
    prices?: Array<{
      interval: mongoose.Types.ObjectId | string;
      price: number;
      credits: number;
      is_initial?: boolean;
      is_active?: boolean;
    }>;
    features?: string[];
  },
  session?: mongoose.ClientSession,
): Promise<TPackage> => {
  const { prices, features, ...packageData } = data;

  if (!prices || prices.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'At least one price is required');
  }

  if (!features || features.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'At least one feature is required');
  }

  if (packageData.is_initial === true) {
    await PackageRepository.Package.updateMany(
      { is_initial: true, _id: { $ne: null } },
      { $set: { is_initial: false } },
      { session },
    );
  }

  const result = await PackageRepository.Package.create([packageData], { session });
  const packageId = result[0]._id.toString();

  const intervalIds: mongoose.Types.ObjectId[] = prices.map((p: any) => {
    const intervalId = p.interval;
    if (typeof intervalId === 'string') {
      return new mongoose.Types.ObjectId(intervalId);
    }
    return intervalId;
  });

  const intervalDocs = await IntervalRepository.Interval.find({
    _id: { $in: intervalIds },
    is_active: true,
  })
    .session(session || null)
    .lean();

  if (intervalDocs.length !== intervalIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'One or more intervals not found or not active');
  }

  const initialPrices = prices.filter((p: any) => p.is_initial === true);
  if (initialPrices.length === 0) {
    prices[0].is_initial = true;
  } else if (initialPrices.length > 1) {
    let foundFirst = false;
    prices.forEach((p: any) => {
      if (p.is_initial === true) {
        if (!foundFirst) {
          foundFirst = true;
        } else {
          p.is_initial = false;
        }
      }
    });
  }

  const packagePriceData = prices.map((priceData: any) => ({
    interval:
      typeof priceData.interval === 'string'
        ? new mongoose.Types.ObjectId(priceData.interval)
        : priceData.interval,
    package: new mongoose.Types.ObjectId(packageId),
    price: priceData.price,
    credits: priceData.credits,
    is_initial: priceData.is_initial || false,
    is_active: priceData.is_active !== undefined ? priceData.is_active : true,
  }));

  await createPackagePrices(packagePriceData, session);

  const packageFeatureData = features.map((featureId: string) => ({
    package: new mongoose.Types.ObjectId(packageId),
    feature: new mongoose.Types.ObjectId(featureId),
    is_active: true,
  }));

  await createPackageFeatures(packageFeatureData, session);

  await clearPackageCache();

  const createdPackage = await getPackage(packageId);

  const embeddedFeatures = (createdPackage.features || []).map((feature: any) => ({ ...feature }));
  const embeddedPrices = (createdPackage.prices || []).map((pp: any) => ({
    _id: pp._id,
    interval: pp.interval,
    price: pp.price,
    previous_price: pp.previous_price,
    credits: pp.credits,
    is_initial: pp.is_initial,
    is_active: pp.is_active,
    created_at: pp.created_at,
    updated_at: pp.updated_at,
  }));

  await PackageHistory.create([{
    package: packageId,
    value: createdPackage.value,
    name: createdPackage.name,
    description: createdPackage.description,
    content: createdPackage.content,
    type: createdPackage.type,
    badge: createdPackage.badge,
    points: createdPackage.points,
    features: embeddedFeatures,
    prices: embeddedPrices,
    sequence: createdPackage.sequence,
    is_active: createdPackage.is_active,
    version: createdPackage.version || 1,
    is_deleted: createdPackage.is_deleted,
  }], { session });

  return createdPackage;
};

export const getPublicPackage = async (id: string): Promise<any> => {
  return withCache(`package:${id}`, CACHE_TTL, async () => {
    const pipeline: any[] = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          is_active: true,
          is_deleted: { $ne: true },
        },
      },
      ...getFeaturesLookupStage(),
      ...getPricesLookupStage(),
    ];

    const results = await PackageRepository.Package.aggregate(pipeline);
    if (!results || results.length === 0) {
      throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
    }

    return transformPackageWithCurrency(results[0]);
  });
};

export const getPackageFeatures = async (packageId: string): Promise<any[]> => {
  return await withCache(
    `package:features:${packageId}`,
    CACHE_TTL,
    async () => {
      // Use helper to get features
      // Must return array of Feature objects or IDs to match previous behavior
      // Previous behavior: return packageData?.features || [] -> features was [ObjectId] (ref) or Populated
      // The credit-process used it to check ID inclusion.
      // So returning array of feature OBJECTS (populated) is safest as it covers both ID check and object usage.
      const packageFeatures = await getPackageFeaturesByPackage(
        packageId,
        true, // Populate feature
      );
      return packageFeatures
        .map((pf) => pf.feature)
        .filter((f) => f !== null && f !== undefined);
    },
  );
};

export const getPackage = async (id: string): Promise<any> => {
  const pipeline: any[] = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        is_deleted: { $ne: true },
      },
    },
    ...getFeaturesLookupStage(),
    ...getPricesLookupStage(),
  ];

  const results = await PackageRepository.Package.aggregate(pipeline);
  if (!results || results.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  return results[0];
};

export const getPublicPackages = async (
  query: Record<string, unknown>,
): Promise<{
  data: any[];
  meta: { total: number; page: number; limit: number };
}> => {
  return withCache(
    `packages:public:${JSON.stringify(query)}`,
    CACHE_TTL,
    async () => {
      const baseFilter: Record<string, unknown> = {
        is_active: true,
        is_deleted: { $ne: true },
      };

      if (query._id) {
        baseFilter._id = new mongoose.Types.ObjectId(query._id as string);
      }

      // Note: Querying by 'plans' or 'features' ID directly on Package model will no longer work efficiently if they are not in the model.
      // However, usually public query is simple. If advanced filtering is needed on relations, it requires lookup-before-match.
      // Assuming basic filtering for now.

      const lookupStages: any[] = [
        ...getFeaturesLookupStage(),
        ...getPricesLookupStage(),
      ];

      const { _id: _, ...restQuery } = query;
      const packageQuery = new AppAggregationQuery<TPackage>(PackageRepository.Package, {
        ...restQuery,
        ...baseFilter,
      })
        .search(['name', 'description', 'value'])
        .filter()
        .addPipeline(lookupStages)
        .sort()
        .paginate()
        .fields();

      const result = await packageQuery.execute();

      return {
        ...result,
        data: result.data.map((pkg: any) => transformPackageWithCurrency(pkg)),
      };
    },
  );
};

export const getPackages = async (
  query: Record<string, unknown>,
): Promise<{
  data: any[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { ...rest } = query;

  const filter: Record<string, unknown> = {
    is_deleted: { $ne: true },
  };

  const lookupStages: any[] = [
    ...getFeaturesLookupStage(),
    ...getPricesLookupStage(),
  ];

  const packageQuery = new AppAggregationQuery<TPackage>(PackageRepository.Package, {
    ...rest,
    ...filter,
  })
    .search(['name', 'description', 'value'])
    .filter()
    .addPipeline(lookupStages)
    .sort([
      'name',
      'type',
      'sequence',
      'is_active',
      'is_initial',
      'created_at',
      'updated_at',
    ] as any)
    .paginate()
    .fields();

  const result = await packageQuery.execute([
    {
      key: 'active',
      filter: { is_active: true },
    },
    {
      key: 'inactive',
      filter: { is_active: false },
    },
    {
      key: 'initial',
      filter: { is_initial: true },
    },
  ]);

  return {
    ...result,
    data: result.data,
  };
};

export const updatePackage = async (
  id: string,
  payload: Partial<TPackage> & {
    prices?: Array<{
      interval: mongoose.Types.ObjectId | string;
      price: number;
      credits: number;
      is_initial?: boolean;
      is_active?: boolean;
    }>;
    features?: string[];
  },
  session?: mongoose.ClientSession,
): Promise<TPackage> => {
  const packageData = await PackageRepository.findById(id);
  if (!packageData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }


  if (payload.prices !== undefined) {
    const { updatePackagePrice, deletePackagePrice } =
      await import('../package-price/package-price.service');

    type UpdatePriceInput = {
      interval: mongoose.Types.ObjectId | string;
      price: number;
      credits: number;
      is_initial?: boolean;
      is_active?: boolean;
    };

    const currentPackagePrices = await getPackagePricesByPackage(id, false);
    const oldIntervalIds = currentPackagePrices.map((pp) => {
      const intervalId =
        typeof pp.interval === 'object' && pp.interval?._id
          ? pp.interval._id.toString()
          : pp.interval.toString();
      return intervalId;
    });

    const newPackagePriceInputs = payload.prices as UpdatePriceInput[];
    const newIntervalIds = newPackagePriceInputs.map((p) =>
      typeof p.interval === 'string' ? p.interval : p.interval.toString(),
    );

    const addedPriceInputs = newPackagePriceInputs.filter(
      (p) =>
        !oldIntervalIds.includes(
          typeof p.interval === 'string' ? p.interval : p.interval.toString(),
        ),
    );
    const removedPackagePrices = currentPackagePrices.filter((pp) => {
      const intervalId =
        typeof pp.interval === 'object' && pp.interval?._id
          ? pp.interval._id.toString()
          : pp.interval.toString();
      return !newIntervalIds.includes(intervalId);
    });
    const existingPriceInputs = newPackagePriceInputs.filter((p) => {
      const intervalId = typeof p.interval === 'string' ? p.interval : p.interval.toString();
      return oldIntervalIds.includes(intervalId);
    });

    if (removedPackagePrices.length > 0) {
      await Promise.all(
        removedPackagePrices.map((pp) =>
          deletePackagePrice((pp as any)._id.toString()),
        ),
      );
    }

    if (addedPriceInputs.length > 0) {
      const intervalIdsToAdd = addedPriceInputs.map((p) =>
        typeof p.interval === 'string'
          ? new mongoose.Types.ObjectId(p.interval)
          : p.interval,
      );
      const intervalDocs = await IntervalRepository.Interval.find({
        _id: { $in: intervalIdsToAdd },
        is_active: true,
      }).session(session || null);

      if (intervalDocs.length !== intervalIdsToAdd.length) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'One or more new intervals not found or not active',
        );
      }

      const packagePriceDataToCreate = addedPriceInputs.map((input) => ({
        interval:
          typeof input.interval === 'string'
            ? new mongoose.Types.ObjectId(input.interval)
            : input.interval,
        package: new mongoose.Types.ObjectId(id),
        previous_price: undefined,
        price: input.price,
        credits: input.credits,
        is_initial: input.is_initial ?? false,
        is_active: input.is_active ?? true,
      }));
      await createPackagePrices(packagePriceDataToCreate, session);
    }

    if (existingPriceInputs.length > 0) {
      await Promise.all(
        existingPriceInputs.map(async (input) => {
          const inputIntervalId =
            typeof input.interval === 'string' ? input.interval : input.interval.toString();
          const existingPackagePrice = currentPackagePrices.find((pp) => {
            const ppIntervalId =
              typeof pp.interval === 'object' && pp.interval?._id
                ? pp.interval._id.toString()
                : pp.interval.toString();
            return ppIntervalId === inputIntervalId;
          });
          if (existingPackagePrice) {
            await updatePackagePrice(
              (existingPackagePrice as any)._id.toString(),
              {
                previous_price: existingPackagePrice.price,
                price: input.price,
                credits: input.credits,
                is_initial: input.is_initial,
                is_active: input.is_active,
              },
              session,
            );
          }
        }),
      );
    }

    const allCurrentPackagePrices = await getPackagePricesByPackage(id, false);
    const initialPrices = allCurrentPackagePrices.filter((pp) => pp.is_initial);

    if (allCurrentPackagePrices.length > 0 && initialPrices.length === 0) {
      const firstActivePrice = allCurrentPackagePrices.find((pp) => pp.is_active);
      if (firstActivePrice) {
        await updatePackagePrice(
          (firstActivePrice as any)._id.toString(),
          { is_initial: true },
          session,
        );
      } else {
        await updatePackagePrice(
          (allCurrentPackagePrices[0] as any)._id.toString(),
          { is_initial: true },
          session,
        );
      }
    } else if (initialPrices.length > 1) {
      await Promise.all(
        initialPrices
          .slice(1)
          .map((pp) =>
            updatePackagePrice(
              (pp as any)._id.toString(),
              { is_initial: false },
              session,
            ),
          ),
      );
    }
  }

  if (payload.features !== undefined) {
    await updatePackageFeatures(id, payload.features, session);
  }

  if (payload.is_initial === true) {
    await PackageRepository.Package.updateMany(
      { is_initial: true, _id: { $ne: new mongoose.Types.ObjectId(id) } },
      { $set: { is_initial: false } },
      { session },
    );
  }

  const { prices, features, ...packageFieldsToUpdate } = payload;

  const currentVersion = packageData.version || 1;
  const nextVersion = currentVersion + 1;

  await PackageRepository.Package.findByIdAndUpdate(id, { ...packageFieldsToUpdate, version: nextVersion }, {
    new: true,
    runValidators: true,
  }).session(session || null);

  await clearPackageCache();

  const finalPopulatedPackage = await getPackage(id);

  const finalEmbeddedFeatures = (finalPopulatedPackage.features || []).map((feature: any) => ({ ...feature }));
  const finalEmbeddedPrices = (finalPopulatedPackage.prices || []).map((pp: any) => ({
    _id: pp._id,
    interval: pp.interval,
    price: pp.price,
    previous_price: pp.previous_price,
    credits: pp.credits,
    is_initial: pp.is_initial,
    is_active: pp.is_active,
    created_at: pp.created_at,
    updated_at: pp.updated_at,
  }));

  await PackageHistory.create([{
    package: id,
    value: finalPopulatedPackage.value,
    name: finalPopulatedPackage.name,
    description: finalPopulatedPackage.description,
    content: finalPopulatedPackage.content,
    type: finalPopulatedPackage.type,
    badge: finalPopulatedPackage.badge,
    points: finalPopulatedPackage.points,
    features: finalEmbeddedFeatures,
    prices: finalEmbeddedPrices,
    sequence: finalPopulatedPackage.sequence,
    is_active: finalPopulatedPackage.is_active,
    version: finalPopulatedPackage.version || nextVersion,
    is_deleted: finalPopulatedPackage.is_deleted,
  }], { session });

  return finalPopulatedPackage;
};

export const updatePackages = async (
  ids: string[],
  payload: Partial<TPackage> & {
    prices?: Array<{
      interval: mongoose.Types.ObjectId | string;
      price: number;
      credits: number;
      is_initial?: boolean;
      is_active?: boolean;
    }>;
    features?: string[];
  },
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const foundPackages = await PackageRepository.Package.find({ _id: { $in: ids } }).lean();
  const foundIds = foundPackages.map((pkg) => pkg._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  for (const id of foundIds) {
    await updatePackage(id, payload);
  }

  await clearPackageCache();

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deletePackage = async (id: string): Promise<void> => {
  const packageData = await PackageRepository.findById(id);
  if (!packageData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  await PackageRepository.softDelete(id);
  // Also soft delete associated package-prices and package-feature-configs
  await deletePackagePricesByPackage(id);
  await PackageFeatureConfigServices.deleteConfigsByPackage(id);

  // Clear cache after deletion
  await clearPackageCache();
};

export const deletePackagePermanent = async (id: string): Promise<void> => {
  const packageData = await PackageRepository.Package.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (!packageData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  await PackageRepository.Package.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
  // Also permanently delete associated package-prices and package-feature-configs
  const { PackagePrice } = await import('../package-price/package-price.model');
  await PackagePrice.deleteMany({ package: id }).setOptions({
    bypassDeleted: true,
  });
  const { PackageFeatureConfig } =
    await import('../package-feature-config/package-feature-config.model');
  await PackageFeatureConfig.deleteMany({ package: id }).setOptions({
    bypassDeleted: true,
  });

  // Clear cache after deletion
  await clearPackageCache();
};

export const deletePackages = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const packages = await PackageRepository.Package.find({ _id: { $in: ids } }).lean();
  const foundIds = packages.map((pkg) => pkg._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await PackageRepository.Package.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });
  // Also soft delete associated package-prices and package-feature-configs
  await Promise.all(
    foundIds.map((packageId) => deletePackagePricesByPackage(packageId)),
  );
  await Promise.all(
    foundIds.map((packageId) =>
      PackageFeatureConfigServices.deleteConfigsByPackage(packageId),
    ),
  );

  // Clear cache after deletion
  await clearPackageCache();

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deletePackagesPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const packages = await PackageRepository.Package.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();

  const foundIds = packages.map((pkg) => pkg._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await PackageRepository.Package.deleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });
  // Also permanently delete associated package-prices and package-feature-configs
  const { PackagePrice: PackagePriceModel } = await import('../package-price/package-price.model');
  await PackagePriceModel.deleteMany({ package: { $in: foundIds } }).setOptions({
    bypassDeleted: true,
  });
  const { PackageFeatureConfig } =
    await import('../package-feature-config/package-feature-config.model');
  await PackageFeatureConfig.deleteMany({
    package: { $in: foundIds },
  }).setOptions({ bypassDeleted: true });

  // Clear cache after deletion
  await clearPackageCache();

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restorePackage = async (id: string): Promise<TPackage> => {
  const packageData = await PackageRepository.Package.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );

  if (!packageData) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Package not found or not deleted',
    );
  }

  // Also restore associated package-prices
  const { restorePackagePricesByPackage } =
    await import('../package-price/package-price.service');
  await restorePackagePricesByPackage(id);

  // Clear cache after restoration
  await clearPackageCache();

  return packageData;
};

export const restorePackages = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await PackageRepository.Package.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredPackages = await PackageRepository.Package.find({ _id: { $in: ids } }).lean();
  const restoredIds = restoredPackages.map((pkg) => pkg._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  // Also restore associated package-prices
  const { restorePackagePricesByPackage } =
    await import('../package-price/package-price.service');
  await Promise.all(
    restoredIds.map((packageId) => restorePackagePricesByPackage(packageId)),
  );

  // Clear cache after restoration
  await clearPackageCache();

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const updatePackageIsInitial = async (
  id: string,
  is_initial: boolean,
  session?: mongoose.ClientSession,
): Promise<TPackage> => {
  const packageData = await PackageRepository.Package.findById(id)
    .session(session || null)
    .lean();

  if (!packageData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  // If setting is_initial to true, ensure no other package has is_initial=true
  if (is_initial === true) {
    await PackageRepository.Package.updateMany(
      { is_initial: true, _id: { $ne: new mongoose.Types.ObjectId(id) } },
      { $set: { is_initial: false } },
      { session },
    );
  }

  const result = await PackageRepository.Package.findByIdAndUpdate(
    id,
    { is_initial },
    {
      new: true,
      runValidators: true,
    },
  ).session(session || null);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  // Clear cache after update
  await clearPackageCache();

  return result;
};

/**
 * Get package with all its feature configurations
 */
export const getPackageWithConfigs = async (id: string): Promise<any> => {
  const packageData = await getPackage(id);

  // Get all configs for this package
  const configs = await PackageFeatureConfigServices.getPackageFeatureConfigs({
    package: id,
    is_active: true,
  });

  // Group configs by feature and endpoint
  const configMap = groupConfigsByFeatureAndEndpoint(configs);

  return {
    ...packageData,
    feature_configs: configMap,
  };
};

/**
 * Group configs by feature and endpoint for easier consumption
 */
export const groupConfigsByFeatureAndEndpoint = (
  configs: any[],
): Record<string, any> => {
  const grouped: Record<string, any> = {};

  configs.forEach((config) => {
    const featureId =
      typeof config.feature === 'string'
        ? config.feature
        : config.feature?._id?.toString();

    if (!featureId) return;

    if (!grouped[featureId]) {
      grouped[featureId] = {
        feature: config.feature,
        feature_wide_config: null,
        endpoint_configs: {},
      };
    }

    // If no endpoint specified, it's a feature-wide config
    if (!config.feature_endpoint) {
      grouped[featureId].feature_wide_config = config.config;
    } else {
      const endpointId =
        typeof config.feature_endpoint === 'string'
          ? config.feature_endpoint
          : config.feature_endpoint?._id?.toString();

      if (endpointId) {
        grouped[featureId].endpoint_configs[endpointId] = {
          endpoint: config.feature_endpoint,
          config: config.config,
        };
      }
    }
  });

  return grouped;
};




