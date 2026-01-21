import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { withCache } from '../../utils/cache.utils';
import { BillingSettingHistory } from '../billing-setting-history/billing-setting-history.model';
import { clearCreditsProcessCache } from '../credits-process/credits-process.service';
import { DEFAULT_BILLING_SETTING } from './billing-setting.constant';
import { BillingSetting } from './billing-setting.model';
import { TBillingSetting } from './billing-setting.type';

const CACHE_TTL = 86400; // 24 hours

export const createBillingSetting = async (
  payload: TBillingSetting,
): Promise<TBillingSetting> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // If is_initial is true, unset others
    if (payload.is_initial) {
      await BillingSetting.updateMany(
        { is_initial: true },
        { is_initial: false },
        { session },
      );
    } else {
      // If this is the first settings, make it initial by default
      const count = await BillingSetting.countDocuments({
        is_deleted: { $ne: true },
      }).session(session);
      if (count === 0) {
        payload.is_initial = true;
      }
    }

    const result = await BillingSetting.create([payload], { session });

    await session.commitTransaction();

    // Clear credits process cache
    await clearCreditsProcessCache('billing');

    return result[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getAllBillingSettings = async (query: Record<string, unknown>) => {
  const billingSettingQuery = new AppAggregationQuery(BillingSetting, query)
    .sort()
    .paginate()
    .fields();

  const result = await billingSettingQuery.execute();
  return result;
};

export const getBillingSetting = async (
  id: string,
): Promise<TBillingSetting> => {
  const result = await BillingSetting.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Billing Setting not found');
  }
  return result;
};

export const getInitialBillingSetting = async (): Promise<TBillingSetting> => {
  return await withCache('billing-setting:initial', CACHE_TTL, async () => {
    const result = await BillingSetting.findOne({
      is_initial: true,
      is_active: true,
      is_deleted: { $ne: true },
    }).lean();

    if (!result) {
      console.warn(
        '[Billing Setting] Initial billing setting not found in DB. Falling back to system defaults.',
      );
      return DEFAULT_BILLING_SETTING as TBillingSetting;
    }
    return result;
  });
};

export const updateBillingSetting = async (
  id: string,
  payload: Partial<TBillingSetting>,
): Promise<TBillingSetting> => {
  const existingSetting = await BillingSetting.findById(id).lean();
  if (!existingSetting) {
    throw new AppError(httpStatus.NOT_FOUND, 'Billing Setting not found');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create history before update
    await BillingSettingHistory.create(
      [
        {
          billing_setting: existingSetting._id,
          credit_price: existingSetting.credit_price,
          currency: existingSetting.currency,
          status: existingSetting.status,
          applied_at: existingSetting.applied_at,
          is_active: existingSetting.is_active,
          is_initial: existingSetting.is_initial,
          is_deleted: existingSetting.is_deleted,
        },
      ],
      { session },
    );

    // If is_initial is true, unset others
    if (payload.is_initial) {
      await BillingSetting.updateMany(
        { _id: { $ne: id }, is_initial: true },
        { is_initial: false },
        { session },
      );
    }

    const result = await BillingSetting.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
      session,
    });

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Billing Setting not found');
    }

    await session.commitTransaction();

    // Clear credits process cache
    await clearCreditsProcessCache('billing');

    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const deleteBillingSetting = async (id: string): Promise<void> => {
  const result = await BillingSetting.findById(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Billing Setting not found');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (result as any).softDelete();

  // Clear credits process cache
  await clearCreditsProcessCache('billing');
};

export const deleteBillingSettingPermanent = async (
  id: string,
): Promise<void> => {
  const result = await BillingSetting.findByIdAndDelete(id).setOptions({
    bypassDeleted: true,
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Billing Setting not found');
  }

  // Clear credits process cache
  await clearCreditsProcessCache('billing');
};

export const deleteBillingSettings = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const settings = await BillingSetting.find({ _id: { $in: ids } }).lean();
  const foundIds = settings.map((s) => s._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await BillingSetting.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteBillingSettingsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const settings = await BillingSetting.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();

  const foundIds = settings.map((s) => s._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await BillingSetting.deleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreBillingSetting = async (
  id: string,
): Promise<TBillingSetting> => {
  const result = await BillingSetting.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false, is_active: false }, // Restored items inactive by default to avoid conflicts
    { new: true },
  );

  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Billing Setting not found or not deleted',
    );
  }

  return result;
};

export const restoreBillingSettings = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await BillingSetting.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false, is_active: false },
  );

  const restoredSettings = await BillingSetting.find({
    _id: { $in: ids },
  }).lean();
  const restoredIds = restoredSettings.map((s) => s._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
