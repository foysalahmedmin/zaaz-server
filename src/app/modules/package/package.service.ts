import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/AppError';
import { PackageHistory } from '../package-history/package-history.model';
import {
  createPackagePlans,
  deletePackagePlansByPackage,
  getPackagePlansByPackage,
} from '../package-plan/package-plan.service';
import { TPackagePlan } from '../package-plan/package-plan.type';
import { Plan } from '../plan/plan.model';
import { Package } from './package.model';
import { TPackage } from './package.type';
import AppQueryAggregation from '../../builder/AppQueryAggregation';

export const createPackage = async (
  data: TPackage & {
    plans?: Array<{
      plan: mongoose.Types.ObjectId | string;
      price: { USD: number; BDT: number };
      token: number;
      is_initial?: boolean;
      is_active?: boolean;
    }>;
  },
  session?: mongoose.ClientSession,
): Promise<TPackage> => {
  // Extract plans with package-plan data from payload
  const { plans, ...packageData } = data;

  // Validate plans are provided and at least one exists
  if (!plans || plans.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'At least one plan is required');
  }

  // If is_initial is true, ensure no other package has is_initial=true
  // Note: Using _id: { $ne: null } because the new package doesn't exist yet,
  // so we need to unset is_initial for all existing packages
  if (packageData.is_initial === true) {
    await Package.updateMany(
      { is_initial: true, _id: { $ne: null } },
      { $set: { is_initial: false } },
      { session },
    );
  }

  // Extract plan IDs for package.plans array
  type PlanInput = {
    plan: mongoose.Types.ObjectId | string;
    price: { USD: number; BDT: number };
    token: number;
    is_initial?: boolean;
    is_active?: boolean;
  };
  const planIds: mongoose.Types.ObjectId[] = (plans as PlanInput[]).map(
    (p: PlanInput) => {
      const planId = p.plan;
      if (typeof planId === 'string') {
        return new mongoose.Types.ObjectId(planId);
      }
      return planId;
    },
  );

  // Create package with plan IDs
  const result = await Package.create([{ ...packageData, plans: planIds }], {
    session,
  });
  const packageId = result[0]._id.toString();

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
  const initialPlans = (plans as PlanInput[]).filter(
    (p: PlanInput) => p.is_initial === true,
  );
  if (initialPlans.length === 0) {
    // If no initial plan specified, set first one as initial
    (plans as PlanInput[])[0].is_initial = true;
  } else if (initialPlans.length > 1) {
    // If multiple initial plans, keep only the first one found
    let foundFirst = false;
    (plans as PlanInput[]).forEach((p: PlanInput) => {
      if (p.is_initial === true) {
        if (!foundFirst) {
          foundFirst = true;
        } else {
          p.is_initial = false;
        }
      }
    });
  }

  // Create package-plan documents with provided data
  const packagePlanData = (plans as PlanInput[]).map((planData: PlanInput) => ({
    plan:
      typeof planData.plan === 'string'
        ? new mongoose.Types.ObjectId(planData.plan)
        : planData.plan,
    package: new mongoose.Types.ObjectId(packageId),
    price: planData.price,
    token: planData.token,
    is_initial: planData.is_initial || false,
    is_active: planData.is_active !== undefined ? planData.is_active : true,
  }));

  await createPackagePlans(packagePlanData, session);

  return result[0].toObject();
};

export const getPublicPackage = async (id: string): Promise<any> => {
  const pipeline: any[] = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        is_active: true,
        is_deleted: { $ne: true },
      },
    },
    {
      $lookup: {
        from: 'features',
        localField: 'features',
        foreignField: '_id',
        as: 'features',
      },
    },
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
              token: 1,
              is_initial: 1,
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

  const results = await Package.aggregate(pipeline);
  if (!results || results.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  return results[0];
};

export const getPackage = async (id: string): Promise<any> => {
  const pipeline: any[] = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        is_deleted: { $ne: true },
      },
    },
    {
      $lookup: {
        from: 'features',
        localField: 'features',
        foreignField: '_id',
        as: 'features',
      },
    },
    {
      $lookup: {
        from: 'packageplans',
        let: { packageId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$package', '$$packageId'] },
              is_deleted: { $ne: true },
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
              token: 1,
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
  const baseFilter: Record<string, unknown> = {
    is_active: true,
    is_deleted: { $ne: true },
  };

  // Convert _id to ObjectId if provided
  if (query._id) {
    baseFilter._id = new mongoose.Types.ObjectId(query._id as string);
  }

  // If plans query parameter exists, use it for MongoDB array filtering
  if (query.plans) {
    baseFilter.plans = new mongoose.Types.ObjectId(query.plans as string);
  }

  // Build extra pipeline stages for lookups
  const lookupStages: any[] = [
    {
      $lookup: {
        from: 'features',
        localField: 'features',
        foreignField: '_id',
        as: 'features',
      },
    },
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
              token: 1,
              is_initial: 1,
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

  // Use AppQueryV2 for aggregation-based querying
  // Exclude _id from query params since we're handling it in baseFilter
  const { _id: _, ...restQuery } = query;
  const packageQuery = new AppQueryAggregation(Package, {
    ...restQuery,
    ...baseFilter,
  })
    .search(['name', 'description'])
    .filter()
    .pipeline(lookupStages)
    .sort()
    .paginate()
    .fields();

  const result = await packageQuery.execute();

  return {
    ...result,
    data: result.data,
  };
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

  // Build extra pipeline stages for lookups
  const lookupStages: any[] = [
    {
      $lookup: {
        from: 'features',
        localField: 'features',
        foreignField: '_id',
        as: 'features',
      },
    },
    {
      $lookup: {
        from: 'packageplans',
        let: { packageId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$package', '$$packageId'] },
              is_deleted: { $ne: true },
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
              token: 1,
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

  // Use AppQueryV2 for aggregation-based querying
  const packageQuery = new AppQueryAggregation<TPackage>(Package, {
    ...rest,
    ...filter,
  })
    .search(['name', 'description'])
    .filter()
    .pipeline(lookupStages)
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
      token: number;
      is_initial?: boolean;
      is_active?: boolean;
    }>;
  },
  session?: mongoose.ClientSession,
): Promise<TPackage> => {
  const packageData = await Package.findById(id).lean();
  if (!packageData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  // Get populated package data for history (with features and plans)
  const populatedPackage = await getPackage(id);

  // Transform features to embedded format
  const embeddedFeatures = (populatedPackage.features || []).map(
    (feature: any) => ({
      _id: feature._id,
      parent: feature.parent || null,
      name: feature.name,
      description: feature.description,
      path: feature.path,
      prefix: feature.prefix,
      type: feature.type,
      sequence: feature.sequence,
      is_active: feature.is_active,
      created_at: feature.created_at,
      updated_at: feature.updated_at,
    }),
  );

  // Transform plans to embedded format
  const embeddedPlans = (populatedPackage.plans || []).map((pp: any) => ({
    _id: pp._id,
    plan: {
      _id: pp.plan._id,
      name: pp.plan.name,
      description: pp.plan.description,
      duration: pp.plan.duration,
      is_active: pp.plan.is_active,
      created_at: pp.plan.created_at,
      updated_at: pp.plan.updated_at,
    },
    price: pp.price,
    previous_price: pp.previous_price,
    token: pp.token,
    is_initial: pp.is_initial,
    is_active: pp.is_active,
    created_at: pp.created_at,
    updated_at: pp.updated_at,
  }));

  // Create history before update with embedded data
  await PackageHistory.create(
    [
      {
        package: id,
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

  // Handle plans sync if plans field is in payload
  if (payload.plans !== undefined) {
    type UpdatePlanInput = {
      plan: mongoose.Types.ObjectId | string;
      price: { USD: number; BDT: number };
      token: number;
      is_initial?: boolean;
      is_active?: boolean;
    };
    const currentPackagePlans = await getPackagePlansByPackage(id, false);
    // Handle both populated and non-populated plan fields
    const oldPlanIds = currentPackagePlans.map((pp) => {
      const planId =
        typeof pp.plan === 'object' && pp.plan?._id
          ? pp.plan._id.toString()
          : pp.plan.toString();
      return planId;
    });
    const newPackagePlanInputs = payload.plans as UpdatePlanInput[];
    const newPlanIds = newPackagePlanInputs.map((p: UpdatePlanInput) =>
      typeof p.plan === 'string' ? p.plan : p.plan.toString(),
    );

    // Find added, removed, and existing plans
    const addedPlanInputs = newPackagePlanInputs.filter(
      (p: UpdatePlanInput) =>
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
    const existingPlanInputs = newPackagePlanInputs.filter(
      (p: UpdatePlanInput) => {
        const planId = typeof p.plan === 'string' ? p.plan : p.plan.toString();
        return oldPlanIds.includes(planId);
      },
    );

    // 1. Remove (soft delete) plans
    if (removedPackagePlans.length > 0) {
      const { deletePackagePlan } = await import(
        '../package-plan/package-plan.service'
      );
      await Promise.all(
        removedPackagePlans.map((pp) =>
          deletePackagePlan(
            (
              pp as TPackagePlan & { _id: mongoose.Types.ObjectId }
            )._id.toString(),
          ),
        ),
      );
    }

    // 2. Add new plans
    if (addedPlanInputs.length > 0) {
      const planIdsToAdd = addedPlanInputs.map((p) =>
        typeof p.plan === 'string'
          ? new mongoose.Types.ObjectId(p.plan)
          : p.plan,
      );
      const planDocs = await Plan.find({
        _id: { $in: planIdsToAdd },
        is_active: true,
      })
        .session(session || null)
        .lean();

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
        token: input.token,
        is_initial: input.is_initial ?? false,
        is_active: input.is_active ?? true,
      }));
      await createPackagePlans(packagePlanDataToCreate, session);
    }

    // 3. Update existing plans
    if (existingPlanInputs.length > 0) {
      const { updatePackagePlan } = await import(
        '../package-plan/package-plan.service'
      );
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
          }) as (TPackagePlan & { _id: mongoose.Types.ObjectId }) | undefined;
          if (existingPackagePlan) {
            await updatePackagePlan(
              existingPackagePlan._id.toString(),
              {
                previous_price: existingPackagePlan.price,
                price: input.price,
                token: input.token,
                is_initial: input.is_initial,
                is_active: input.is_active,
              },
              session,
            );
          }
        }),
      );
    }

    // 4. Ensure at least one initial plan exists and only one
    const allCurrentPackagePlans = await getPackagePlansByPackage(id, false);
    const initialPlans = allCurrentPackagePlans.filter((pp) => pp.is_initial);

    if (allCurrentPackagePlans.length > 0 && initialPlans.length === 0) {
      // If no initial plan, set the first active one as initial
      const firstActivePlan = allCurrentPackagePlans.find(
        (pp) => pp.is_active,
      ) as (TPackagePlan & { _id: mongoose.Types.ObjectId }) | undefined;
      if (firstActivePlan) {
        const { updatePackagePlan } = await import(
          '../package-plan/package-plan.service'
        );
        await updatePackagePlan(
          firstActivePlan._id.toString(),
          { is_initial: true },
          session,
        );
      } else {
        // If no active plans, set the first available one as initial
        const { updatePackagePlan } = await import(
          '../package-plan/package-plan.service'
        );
        await updatePackagePlan(
          (
            allCurrentPackagePlans[0] as TPackagePlan & {
              _id: mongoose.Types.ObjectId;
            }
          )._id.toString(),
          { is_initial: true },
          session,
        );
      }
    } else if (initialPlans.length > 1) {
      // If more than one initial plan, unset all but the first one
      const { updatePackagePlan } = await import(
        '../package-plan/package-plan.service'
      );
      await Promise.all(
        initialPlans
          .slice(1)
          .map((pp) =>
            updatePackagePlan(
              (
                pp as TPackagePlan & { _id: mongoose.Types.ObjectId }
              )._id.toString(),
              { is_initial: false },
              session,
            ),
          ),
      );
    }

    // If is_initial is being set to true, ensure no other package has is_initial=true
    if (payload.is_initial === true) {
      await Package.updateMany(
        { is_initial: true, _id: { $ne: new mongoose.Types.ObjectId(id) } },
        { $set: { is_initial: false } },
        { session },
      );
    }

    // Update package.plans array with new plan IDs
    const { plans: _, ...packageFieldsToUpdate } = payload;
    const updatedPlanIds = newPackagePlanInputs.map((p: UpdatePlanInput) =>
      typeof p.plan === 'string' ? new mongoose.Types.ObjectId(p.plan) : p.plan,
    );
    const result = await Package.findByIdAndUpdate(
      id,
      { ...packageFieldsToUpdate, plans: updatedPlanIds },
      {
        new: true,
        runValidators: true,
      },
    ).session(session || null);

    return result!;
  }

  // If is_initial is being set to true, ensure no other package has is_initial=true
  if (payload.is_initial === true) {
    await Package.updateMany(
      { is_initial: true, _id: { $ne: new mongoose.Types.ObjectId(id) } },
      { $set: { is_initial: false } },
      { session },
    );
  }

  // Update package fields (excluding plans, as they are handled separately)
  const { plans: _, ...packageFieldsToUpdate } = payload;
  const result = await Package.findByIdAndUpdate(id, packageFieldsToUpdate, {
    new: true,
    runValidators: true,
  }).session(session || null);

  return result!;
};

export const updatePackages = async (
  ids: string[],
  payload: Partial<Pick<TPackage, 'is_active'>>,
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const packages = await Package.find({ _id: { $in: ids } }).lean();
  const foundIds = packages.map((pkg) => pkg._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await Package.updateMany(
    { _id: { $in: foundIds } },
    { ...payload },
  );

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const deletePackage = async (id: string): Promise<void> => {
  const packageData = await Package.findById(id);
  if (!packageData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  await packageData.softDelete();
  // Also soft delete associated package-plans
  await deletePackagePlansByPackage(id);
};

export const deletePackagePermanent = async (id: string): Promise<void> => {
  const packageData = await Package.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (!packageData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Package not found');
  }

  await Package.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
  // Also permanently delete associated package-plans
  const { PackagePlan } = await import('../package-plan/package-plan.model');
  await PackagePlan.deleteMany({ package: id }).setOptions({
    bypassDeleted: true,
  });
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
  // Also soft delete associated package-plans
  await Promise.all(
    foundIds.map((packageId) => deletePackagePlansByPackage(packageId)),
  );

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
  // Also permanently delete associated package-plans
  const { PackagePlan } = await import('../package-plan/package-plan.model');
  await PackagePlan.deleteMany({ package: { $in: foundIds } }).setOptions({
    bypassDeleted: true,
  });

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
  const { restorePackagePlansByPackage } = await import(
    '../package-plan/package-plan.service'
  );
  await restorePackagePlansByPackage(id);

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
  const { restorePackagePlansByPackage } = await import(
    '../package-plan/package-plan.service'
  );
  await Promise.all(
    restoredIds.map((packageId) => restorePackagePlansByPackage(packageId)),
  );

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

  return result.toObject();
};

export const giveInitialPackage = async (
  user_id: string,
  session?: mongoose.ClientSession,
): Promise<any> => {
  // Find the initial package
  const initialPackage = await Package.findOne({
    is_initial: true,
    is_active: true,
    is_deleted: { $ne: true },
  })
    .session(session || null)
    .lean();

  if (!initialPackage) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'No initial package found. Please set a package as initial first.',
    );
  }

  // Get the initial plan for this package
  const { getPackagePlansByPackage } = await import(
    '../package-plan/package-plan.service'
  );
  const packagePlans = await getPackagePlansByPackage(
    initialPackage._id.toString(),
    false,
  );

  const initialPlan = packagePlans.find((pp) => pp.is_initial === true);

  if (!initialPlan) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'No initial plan found for the initial package.',
    );
  }

  // Get plan details
  const planData = await Plan.findById(initialPlan.plan)
    .session(session || null)
    .lean();

  if (!planData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  // Calculate expires_at if plan has duration
  let expiresAt: Date | undefined;
  if (planData.duration && planData.duration > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planData.duration);
  }

  // Check if wallet exists (bypass expired check for initial package)
  const { UserWallet } = await import('../user-wallet/user-wallet.model');
  const { createUserWallet } = await import(
    '../user-wallet/user-wallet.service'
  );
  const existingWallet = await UserWallet.findOne({ user: user_id })
    .session(session || null)
    .setOptions({ bypassExpired: true })
    .lean();

  // If wallet doesn't exist, create it
  if (!existingWallet) {
    await createUserWallet(
      {
        user: new mongoose.Types.ObjectId(user_id),
        token: 0,
        package: null,
        plan: null,
        initial_token_given: false,
        initial_package_given: false,
        ...(expiresAt ? { expires_at: expiresAt } : {}),
      },
      session,
    );
  }

  // Check if initial package already given using atomic operation
  const updatedWallet = await UserWallet.findOneAndUpdate(
    {
      user: user_id,
      initial_package_given: { $ne: true },
    },
    {
      $inc: { token: initialPlan.token },
      $set: {
        package: initialPackage._id,
        plan: planData._id,
        initial_package_given: true,
        ...(expiresAt ? { expires_at: expiresAt } : {}),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .session(session || null)
    .setOptions({ bypassExpired: true });

  if (!updatedWallet) {
    // Check if package was already given
    const existingWallet = await UserWallet.findOne({ user: user_id })
      .session(session || null)
      .setOptions({ bypassExpired: true })
      .lean();

    if (existingWallet?.initial_package_given) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Initial package has already been given to this user',
      );
    }

    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  // Create token transaction record for tracking
  try {
    const { TokenTransaction } = await import(
      '../token-transaction/token-transaction.model'
    );
    await TokenTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(user_id),
          user_wallet: updatedWallet._id,
          type: 'increase',
          increase_source: 'bonus',
          token: initialPlan.token,
          plan: planData._id,
        },
      ],
      { session },
    );
  } catch (error) {
    // Log error but don't block the operation
    console.error(
      '[Give Initial Package] Failed to create transaction:',
      error,
    );
  }

  return updatedWallet.toObject();
};
