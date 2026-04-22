import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import { withCache } from '../../utils/cache.utils';
import { clearCreditsProcessCache } from '../credits-process/credits-process.service';
import { DEFAULT_BILLING_SETTING } from './billing-setting.constant';
import * as BillingSettingRepository from './billing-setting.repository';
import { TBillingSetting } from './billing-setting.type';

const CACHE_TTL = 86400;

export const createBillingSetting = async (
  payload: TBillingSetting,
): Promise<TBillingSetting> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (payload.is_initial) {
      await BillingSettingRepository.updateMany(
        { is_initial: true },
        { is_initial: false },
        session,
      );
    } else {
      const count = await BillingSettingRepository.countDocuments(
        { is_deleted: { $ne: true } },
        session,
      );
      if (count === 0) payload.is_initial = true;
    }

    const result = await BillingSettingRepository.create(payload, session);
    await session.commitTransaction();
    await clearCreditsProcessCache('billing');
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getAllBillingSettings = async (
  query: Record<string, unknown>,
): Promise<any> => {
  return await BillingSettingRepository.findPaginated(query);
};

export const getBillingSetting = async (
  id: string,
): Promise<TBillingSetting> => {
  const result = await BillingSettingRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Billing Setting not found');
  }
  return result;
};

export const getInitialBillingSetting = async (): Promise<TBillingSetting> => {
  return await withCache('billing-setting:initial', CACHE_TTL, async () => {
    const result = await BillingSettingRepository.findOne({
      is_initial: true,
      is_active: true,
      is_deleted: { $ne: true },
    });

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
  const existing = await BillingSettingRepository.findById(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Billing Setting not found');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await BillingSettingRepository.createHistory(
      existing as TBillingSetting & { _id: any },
      session,
    );

    if (payload.is_initial) {
      await BillingSettingRepository.updateMany(
        { _id: { $ne: id }, is_initial: true },
        { is_initial: false },
        session,
      );
    }

    const result = await BillingSettingRepository.updateById(id, payload, session);
    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Billing Setting not found');
    }

    await session.commitTransaction();
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
  const result = await BillingSettingRepository.softDeleteById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Billing Setting not found');
  }
  await clearCreditsProcessCache('billing');
};

export const deleteBillingSettingPermanent = async (
  id: string,
): Promise<void> => {
  const result = await BillingSettingRepository.permanentDeleteById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Billing Setting not found');
  }
  await clearCreditsProcessCache('billing');
};

export const deleteBillingSettings = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const settings = await BillingSettingRepository.findByIds(ids);
  const foundIds = settings.map((s) => (s as any)._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  await BillingSettingRepository.softDeleteMany(foundIds);
  return { count: foundIds.length, not_found_ids };
};

export const deleteBillingSettingsPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const settings = await BillingSettingRepository.findByIds(ids, true);
  const deletable = settings.filter((s: any) => s.is_deleted);
  const foundIds = deletable.map((s: any) => s._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  await BillingSettingRepository.permanentDeleteMany(foundIds);
  return { count: foundIds.length, not_found_ids };
};

export const restoreBillingSetting = async (
  id: string,
): Promise<TBillingSetting> => {
  const result = await BillingSettingRepository.restore(id);
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
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await BillingSettingRepository.restoreMany(ids);

  const restored = await BillingSettingRepository.findByIds(ids);
  const restoredIds = restored.map((s: any) => s._id.toString());
  const not_found_ids = ids.filter((id) => !restoredIds.includes(id));

  return { count: result.modifiedCount, not_found_ids };
};
