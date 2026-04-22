import { Storage } from '@google-cloud/storage';
import { Request } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import path from 'node:path';
import AppError from '../../builder/app-error';
import { TStorageResult } from '../../middlewares/storage.middleware';
import { Feature } from '../feature/feature.model';
import { clearFeatureCache } from '../feature/feature.service';
import * as FeaturePopupRepository from './feature-popup.repository';
import { TFeaturePopup, TFeaturePopupAction } from './feature-popup.type';

const parseActions = (
  actions: string | TFeaturePopupAction[] | undefined,
): TFeaturePopupAction[] => {
  if (!actions) return [];
  if (typeof actions === 'string') {
    try {
      const parsed = JSON.parse(actions);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(actions) ? actions : [];
};

const processFileUploads = (
  req: Request & { storages?: TStorageResult[] },
  fieldName: 'image' | 'video',
): string | undefined => {
  const storages = req.storages || [];
  const file = storages.find((s) => s.fieldName === fieldName);
  return file?.publicUrl || file?.filename || undefined;
};

export const createFeaturePopup = async (
  data: Partial<TFeaturePopup>,
  req: Request & { storages?: TStorageResult[] },
): Promise<TFeaturePopup> => {
  const popupData: Partial<TFeaturePopup> = {
    ...data,
    value: data.value?.toLowerCase().trim(),
  };

  if (data.actions !== undefined) {
    popupData.actions = parseActions(data.actions as any);
  }

  const imageFile = processFileUploads(req, 'image');
  if (imageFile) popupData.image = imageFile;

  const videoFile = processFileUploads(req, 'video');
  if (videoFile) popupData.video = videoFile;

  if (popupData.value) {
    const existing = await FeaturePopupRepository.findOne(
      { value: popupData.value, is_deleted: { $ne: true } },
      true,
    );
    if (existing) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Feature popup with value '${popupData.value}' already exists`,
      );
    }
  }

  const feature = await Feature.findById(popupData.feature).lean();
  if (!feature) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
  }

  const result = await FeaturePopupRepository.create(popupData);
  await clearFeatureCache();
  return result;
};

export const getFeaturePopup = async (id: string): Promise<TFeaturePopup> => {
  const result = await FeaturePopupRepository.findById(id, true);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature popup not found');
  }
  return result;
};

export const getFeaturePopups = async (
  query: Record<string, unknown>,
): Promise<{ data: TFeaturePopup[]; meta: any }> => {
  const { feature, category, ...rest } = query;
  const filter: Record<string, unknown> = {};

  if (feature) filter.feature = new mongoose.Types.ObjectId(feature as string);
  if (category) filter.category = category;

  return await FeaturePopupRepository.findPaginated(rest, filter, [
    { key: 'active', filter: { is_active: true } },
    { key: 'inactive', filter: { is_active: false } },
    { key: 'single_time', filter: { category: 'single-time' } },
    { key: 'multi_time', filter: { category: 'multi-time' } },
  ]);
};

export const getPublicFeaturePopups = async (
  query: Record<string, unknown>,
): Promise<{ data: TFeaturePopup[]; meta: any }> => {
  const { feature, ...rest } = query;
  const filter: Record<string, unknown> = { is_active: true };

  if (feature) filter.feature = new mongoose.Types.ObjectId(feature as string);

  return await FeaturePopupRepository.findPaginated(rest, filter);
};

export const updateFeaturePopup = async (
  id: string,
  payload: Partial<TFeaturePopup>,
  req: Request & { storages?: TStorageResult[]; oldFilePaths?: string[] },
): Promise<TFeaturePopup> => {
  const existing = await FeaturePopupRepository.findById(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature popup not found');
  }

  const updateData: Partial<TFeaturePopup> = { ...payload };
  if (payload.value !== undefined) {
    updateData.value = payload.value.toLowerCase().trim();
    const conflict = await FeaturePopupRepository.findOne(
      { value: updateData.value, _id: { $ne: id }, is_deleted: { $ne: true } },
      true,
    );
    if (conflict) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Feature popup with value '${updateData.value}' already exists`,
      );
    }
  }

  if (payload.actions !== undefined) {
    updateData.actions = parseActions(payload.actions as any);
  }

  const oldFilePaths: string[] = [];

  const imageFile = processFileUploads(req, 'image');
  if (imageFile) {
    if (existing.image) oldFilePaths.push(existing.image);
    updateData.image = imageFile;
  }

  const videoFile = processFileUploads(req, 'video');
  if (videoFile) {
    if (existing.video) oldFilePaths.push(existing.video);
    updateData.video = videoFile;
  }

  if (oldFilePaths.length > 0) {
    (req as any).oldFilePaths = oldFilePaths;
  }

  if (updateData.feature) {
    const feature = await Feature.findById(updateData.feature).lean();
    if (!feature) {
      throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
    }
  }

  const result = await FeaturePopupRepository.updateById(id, updateData);
  await clearFeatureCache();

  if (oldFilePaths.length > 0) {
    try {
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS)
        : undefined;

      const storageClient = new Storage({
        ...(credentialsPath && { keyFilename: credentialsPath }),
        ...(process.env.GOOGLE_CLOUD_PROJECT_ID && {
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        }),
      });

      const defaultBucket = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'zaaz-public-assets';

      for (const oldPath of oldFilePaths) {
        try {
          let oldBucketName = defaultBucket;
          let oldFilename = oldPath;

          if (oldPath.startsWith('https://storage.googleapis.com/')) {
            const urlParts = oldPath.replace('https://storage.googleapis.com/', '').split('/');
            if (urlParts.length >= 2) {
              oldBucketName = urlParts[0];
              oldFilename = urlParts.slice(1).join('/');
            } else {
              oldFilename = urlParts[0];
            }
          } else {
            const pathParts = oldPath.split('/');
            if (pathParts.length > 1) {
              oldBucketName = pathParts[0];
              oldFilename = pathParts.slice(1).join('/');
            }
          }

          await storageClient.bucket(oldBucketName).file(oldFilename).delete();
        } catch (deleteError: any) {
          if (deleteError.code !== 404) {
            console.warn(`[Feature Popup] Failed to delete old file: ${oldPath}`, deleteError.message);
          }
        }
      }
    } catch (error: any) {
      console.error('[Feature Popup] Storage client init error:', error);
    }
  }

  return result!;
};

export const deleteFeaturePopup = async (id: string): Promise<void> => {
  const existing = await FeaturePopupRepository.findById(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature popup not found');
  }
  await FeaturePopupRepository.softDeleteById(id);
  await clearFeatureCache();
};

export const deleteFeaturePopupPermanent = async (id: string): Promise<void> => {
  const existing = await FeaturePopupRepository.findById(id, false, true);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature popup not found');
  }
  await FeaturePopupRepository.permanentDeleteById(id);
  await clearFeatureCache();
};

export const deleteFeaturePopups = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await FeaturePopupRepository.findByIds(ids);
  const foundIds = existing.map((p) => (p as any)._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  await FeaturePopupRepository.softDeleteMany(foundIds);
  await clearFeatureCache();
  return { count: foundIds.length, not_found_ids };
};

export const deleteFeaturePopupsPermanent = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const existing = await FeaturePopupRepository.findByIds(ids, true);
  const deletable = existing.filter((p: any) => p.is_deleted);
  const foundIds = deletable.map((p: any) => p._id.toString());
  const not_found_ids = ids.filter((id) => !foundIds.includes(id));

  await FeaturePopupRepository.permanentDeleteMany(foundIds);
  await clearFeatureCache();
  return { count: foundIds.length, not_found_ids };
};

export const restoreFeaturePopup = async (id: string): Promise<TFeaturePopup> => {
  const result = await FeaturePopupRepository.restore(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature popup not found or not deleted');
  }
  await clearFeatureCache();
  return result;
};

export const restoreFeaturePopups = async (
  ids: string[],
): Promise<{ count: number; not_found_ids: string[] }> => {
  const result = await FeaturePopupRepository.restoreMany(ids);

  const restored = await FeaturePopupRepository.findByIds(ids);
  const restoredIds = restored.map((p: any) => p._id.toString());
  const not_found_ids = ids.filter((id) => !restoredIds.includes(id));

  await clearFeatureCache();
  return { count: result.modifiedCount, not_found_ids };
};
