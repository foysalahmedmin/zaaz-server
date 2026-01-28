import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { invalidateCacheByPattern, withCache } from '../../utils/cache.utils';
import * as PackageFeatureConfigServices from '../package-feature-config/package-feature-config.service';
import {
  createPackageFeatures,
  getPackageFeaturesByPackage,
  updatePackageFeatures,
} from '../package-feature/package-feature.service';
import { PackageHistory } from '../package-history/package-history.model';
import {
  createPackagePlans,
  deletePackagePlansByPackage,
  getPackagePlansByPackage,
} from '../package-plan/package-plan.service';
import { Plan } from '../plan/plan.model';
import { Package } from './package.model';
import { TPackage } from './package.type';

const CACHE_TTL = 86400; // 24 hours (Optimized for production with proper invalidation)

export const clearPackageCache = async () => {
  await invalidateCacheByPattern('package:*');
  await invalidateCacheByPattern('packages:public:*');
};

const getPlansLookupStage = () => [
  {
    $lookup: {
      from: 'packageplans',
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
            from: 'plans',
            localField: 'plan',
            foreignField: '_id',
            as: 'plan',
          },
        },
        {
          $unwind: {
            path: '$plan',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            plan: 1,
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
      as: 'plans',
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
    plans?: Array<{
      plan: mongoose.Types.ObjectId | string;
      price: { USD: number; BDT: number };
      credits: number;
      is_initial?: boolean;
      is_active?: boolean;
    }>;
    features?: string[];
  },
  session?: mongoose.ClientSession,
): Promise<TPackage> => {
  // Extract plans and features from payload
  const { plans, features, ...packageData } = data;

  // Validate plans are provided and at least one exists
  if (!plans || plans.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'At least one plan is required');
  }

  // Validate features are provided and at least one exists
  if (!features || features.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'At least one feature is required',
    );
  }

  // If is_initial is true, ensure no other package has is_initial=true
  if (packageData.is_initial === true) {
    await Package.updateMany(
      { is_initial: true, _id: { $ne: null } },
      { $set: { is_initial: false } },
      { session },
    );
  }

  // Create package
  const result = await Package.create([packageData], { session });
  const packageId = result[0]._id.toString();

  // Handle Plans
  // Implement plan creation logic identical to before
  const planIds: mongoose.Types.ObjectId[] = plans.map((p: any) => {
    const planId = p.plan;
    if (typeof planId === 'string') {
      return new mongoose.Types.ObjectId(planId);
    }
    return planId;
  });

  // Validate all plans exist and are active
  const planDocs = await Plan.find({
    _id: { $in: planIds },
    is_active: true,
  })
    .session(session || null)
    .lean();

  if (planDocs.length !== planIds.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'One or more plans not found or not active',
    );
  }

  // Ensure exactly one is_initial=true
  const initialPlans = plans.filter((p: any) => p.is_initial === true);
  if (initialPlans.length === 0) {
    plans[0].is_initial = true;
  } else if (initialPlans.length > 1) {
    let foundFirst = false;
    plans.forEach((p: any) => {
      if (p.is_initial === true) {
        if (!foundFirst) {
          foundFirst = true;
        } else {
          p.is_initial = false;
        }
      }
    });
  }

  // Create package-plan documents
  const packagePlanData = plans.map((planData: any) => ({
    plan:
      typeof planData.plan === 'string'
        ? new mongoose.Types.ObjectId(planData.plan)
        : planData.plan,
    package: new mongoose.Types.ObjectId(packageId),
    price: planData.price,
    credits: planData.credits,
    is_initial: planData.is_initial || false,
    is_active: planData.is_active !== undefined ? planData.is_active : true,
  }));

  await createPackagePlans(packagePlanData, session);

  // Handle Features
  // Create package-feature documents
  const packageFeatureData = features.map((featureId: string) => ({
    package: new mongoose.Types.ObjectId(packageId),
    feature: new mongoose.Types.ObjectId(featureId),
    is_active: true,
  }));

  await createPackageFeatures(packageFeatureData, session);

  // Clear cache after creation
  await clearPackageCache();

  // Return populated package manually constructing the response would be best,
  // OR fetch it again using getPackage
  const createdPackage = await getPackage(packageId);
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
      ...getPlansLookupStage(),
    ];

    const results = await Package.aggregate(pipeline);
    if (!results || results.length === 0) {
      throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
    }

    return results[0];
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
    ...getPlansLookupStage(),
  ];

  const results = await Package.aggregate(pipeline);
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
        ...getPlansLookupStage(),
      ];

      const { _id: _, ...restQuery } = query;
      const packageQuery = new AppAggregationQuery<TPackage>(Package, {
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
        data: result.data,
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
    ...getPlansLookupStage(),
  ];

  const packageQuery = new AppAggregationQuery<TPackage>(Package, {
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
    plans?: Array<{
      plan: mongoose.Types.ObjectId | string;
      price: { USD: number; BDT: number };
      credits: number;
      is_initial?: boolean;
      is_active?: boolean;
    }>;
    features?: string[];
  },
  session?: mongoose.ClientSession,
): Promise<TPackage> => {
  const packageData = await Package.findById(id).lean();
  if (!packageData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  // Get populated package data for history
  const populatedPackage = await getPackage(id);

  // Transform features (already populated arrays from getPackage)
  // Ensure they are in the format expected for history (embedded objects)
  const embeddedFeatures = (populatedPackage.features || []).map(
    (feature: any) => ({
      ...feature,
      // If we need specific fields only, we can pick them, but full object is fine for history usually
    }),
  );

  const embeddedPlans = (populatedPackage.plans || []).map((pp: any) => ({
    _id: pp._id,
    plan: pp.plan, // Should be full object
    price: pp.price,
    previous_price: pp.previous_price,
    credits: pp.credits,
    is_initial: pp.is_initial,
    is_active: pp.is_active,
    created_at: pp.created_at,
    updated_at: pp.updated_at,
  }));

  // Create history
  await PackageHistory.create(
    [
      {
        package: id,
        value: packageData.value,
        name: packageData.name,
        description: packageData.description,
        content: packageData.content,
        type: packageData.type,
        badge: packageData.badge,
        points: packageData.points,
        features: embeddedFeatures,
        plans: embeddedPlans,
        sequence: packageData.sequence,
        is_active: packageData.is_active,
        is_deleted: packageData.is_deleted,
      },
    ],
    { session },
  );

  // Handle Plans Sync (Complex logic preserved)
  if (payload.plans !== undefined) {
    // ... [Logic for Plan Sync largely same as before, simplified for this tool call but should be robust]
    // Re-implementing logic with imports inside function to avoid circular dep issues if any
    const { updatePackagePlan, deletePackagePlan } =
      await import('../package-plan/package-plan.service');

    type UpdatePlanInput = {
      plan: mongoose.Types.ObjectId | string;
      price: { USD: number; BDT: number };
      credits: number;
      is_initial?: boolean;
      is_active?: boolean;
    };

    const currentPackagePlans = await getPackagePlansByPackage(id, false);
    const oldPlanIds = currentPackagePlans.map((pp) => {
      const planId =
        typeof pp.plan === 'object' && pp.plan?._id
          ? pp.plan._id.toString()
          : pp.plan.toString();
      return planId;
    });

    const newPackagePlanInputs = payload.plans as UpdatePlanInput[];
    const newPlanIds = newPackagePlanInputs.map((p) =>
      typeof p.plan === 'string' ? p.plan : p.plan.toString(),
    );

    const addedPlanInputs = newPackagePlanInputs.filter(
      (p) =>
        !oldPlanIds.includes(
          typeof p.plan === 'string' ? p.plan : p.plan.toString(),
        ),
    );
    const removedPackagePlans = currentPackagePlans.filter((pp) => {
      const planId =
        typeof pp.plan === 'object' && pp.plan?._id
          ? pp.plan._id.toString()
          : pp.plan.toString();
      return !newPlanIds.includes(planId);
    });
    const existingPlanInputs = newPackagePlanInputs.filter((p) => {
      const planId = typeof p.plan === 'string' ? p.plan : p.plan.toString();
      return oldPlanIds.includes(planId);
    });

    if (removedPackagePlans.length > 0) {
      await Promise.all(
        removedPackagePlans.map((pp) =>
          deletePackagePlan((pp as any)._id.toString()),
        ),
      );
    }

    if (addedPlanInputs.length > 0) {
      const planIdsToAdd = addedPlanInputs.map((p) =>
        typeof p.plan === 'string'
          ? new mongoose.Types.ObjectId(p.plan)
          : p.plan,
      );
      const planDocs = await Plan.find({
        _id: { $in: planIdsToAdd },
        is_active: true,
      }).session(session || null);

      if (planDocs.length !== planIdsToAdd.length) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'One or more new plans not found or not active',
        );
      }

      const packagePlanDataToCreate = addedPlanInputs.map((input) => ({
        plan:
          typeof input.plan === 'string'
            ? new mongoose.Types.ObjectId(input.plan)
            : input.plan,
        package: new mongoose.Types.ObjectId(id),
        previous_price: undefined,
        price: input.price,
        credits: input.credits,
        is_initial: input.is_initial ?? false,
        is_active: input.is_active ?? true,
      }));
      await createPackagePlans(packagePlanDataToCreate, session);
    }

    if (existingPlanInputs.length > 0) {
      await Promise.all(
        existingPlanInputs.map(async (input) => {
          const inputPlanId =
            typeof input.plan === 'string' ? input.plan : input.plan.toString();
          const existingPackagePlan = currentPackagePlans.find((pp) => {
            const ppPlanId =
              typeof pp.plan === 'object' && pp.plan?._id
                ? pp.plan._id.toString()
                : pp.plan.toString();
            return ppPlanId === inputPlanId;
          });
          if (existingPackagePlan) {
            await updatePackagePlan(
              (existingPackagePlan as any)._id.toString(),
              {
                previous_price: existingPackagePlan.price,
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

    // Ensure initial plan consistency (same logic as before)
    const allCurrentPackagePlans = await getPackagePlansByPackage(id, false);
    const initialPlans = allCurrentPackagePlans.filter((pp) => pp.is_initial);

    if (allCurrentPackagePlans.length > 0 && initialPlans.length === 0) {
      const firstActivePlan = allCurrentPackagePlans.find((pp) => pp.is_active);
      if (firstActivePlan) {
        await updatePackagePlan(
          (firstActivePlan as any)._id.toString(),
          { is_initial: true },
          session,
        );
      } else {
        await updatePackagePlan(
          (allCurrentPackagePlans[0] as any)._id.toString(),
          { is_initial: true },
          session,
        );
      }
    } else if (initialPlans.length > 1) {
      await Promise.all(
        initialPlans
          .slice(1)
          .map((pp) =>
            updatePackagePlan(
              (pp as any)._id.toString(),
              { is_initial: false },
              session,
            ),
          ),
      );
    }
  }

  // Handle Features Sync
  if (payload.features !== undefined) {
    await updatePackageFeatures(id, payload.features, session);
  }

  if (payload.is_initial === true) {
    await Package.updateMany(
      { is_initial: true, _id: { $ne: new mongoose.Types.ObjectId(id) } },
      { $set: { is_initial: false } },
      { session },
    );
  }

  // Update package fields
  const { plans, features, ...packageFieldsToUpdate } = payload;
  await Package.findByIdAndUpdate(id, packageFieldsToUpdate, {
    new: true,
    runValidators: true,
  }).session(session || null);

  // Clear cache after update
  await clearPackageCache();

  return await getPackage(id);
};

export const deletePackage = async (id: string): Promise<void> => {
  const packageData = await Package.findById(id);
  if (!packageData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  await packageData.softDelete();
  // Also soft delete associated package-plans and package-feature-configs
  await deletePackagePlansByPackage(id);
  await PackageFeatureConfigServices.deleteConfigsByPackage(id);

  // Clear cache after deletion
  await clearPackageCache();
};

export const deletePackagePermanent = async (id: string): Promise<void> => {
  const packageData = await Package.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (!packageData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  await Package.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
  // Also permanently delete associated package-plans and package-feature-configs
  const { PackagePlan } = await import('../package-plan/package-plan.model');
  await PackagePlan.deleteMany({ package: id }).setOptions({
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
  const packages = await Package.find({ _id: { $in: ids } }).lean();
  const foundIds = packages.map((pkg) => pkg._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await Package.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });
  // Also soft delete associated package-plans and package-feature-configs
  await Promise.all(
    foundIds.map((packageId) => deletePackagePlansByPackage(packageId)),
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
  const packages = await Package.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();

  const foundIds = packages.map((pkg) => pkg._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await Package.deleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });
  // Also permanently delete associated package-plans and package-feature-configs
  const { PackagePlan } = await import('../package-plan/package-plan.model');
  await PackagePlan.deleteMany({ package: { $in: foundIds } }).setOptions({
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
  const packageData = await Package.findOneAndUpdate(
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

  // Also restore associated package-plans
  const { restorePackagePlansByPackage } =
    await import('../package-plan/package-plan.service');
  await restorePackagePlansByPackage(id);

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
  const result = await Package.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredPackages = await Package.find({ _id: { $in: ids } }).lean();
  const restoredIds = restoredPackages.map((pkg) => pkg._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  // Also restore associated package-plans
  const { restorePackagePlansByPackage } =
    await import('../package-plan/package-plan.service');
  await Promise.all(
    restoredIds.map((packageId) => restorePackagePlansByPackage(packageId)),
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
  const packageData = await Package.findById(id)
    .session(session || null)
    .lean();

  if (!packageData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  // If setting is_initial to true, ensure no other package has is_initial=true
  if (is_initial === true) {
    await Package.updateMany(
      { is_initial: true, _id: { $ne: new mongoose.Types.ObjectId(id) } },
      { $set: { is_initial: false } },
      { session },
    );
  }

  const result = await Package.findByIdAndUpdate(
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

  return result.toObject();
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
