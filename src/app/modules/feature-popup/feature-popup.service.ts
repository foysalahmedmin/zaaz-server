import { Storage } from '@google-cloud/storage';
import { Request } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import path from 'node:path';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { TStorageResult } from '../../middlewares/storage.middleware';
import { Feature } from '../feature/feature.model';
import { clearFeatureCache } from '../feature/feature.service';
import { FeaturePopup } from './feature-popup.model';
import { TFeaturePopup, TFeaturePopupAction } from './feature-popup.type';

// Helper to parse actions from string or array
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

// Helper to process file uploads from storage middleware
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
  // Convert value to lowercase
  const popupData: Partial<TFeaturePopup> = {
    ...data,
    value: data.value?.toLowerCase().trim(),
  };

  // Parse actions
  if (data.actions !== undefined) {
    popupData.actions = parseActions(data.actions as any);
  }

  // Process file uploads
  const imageFile = processFileUploads(req, 'image');
  if (imageFile) {
    popupData.image = imageFile;
  }

  const videoFile = processFileUploads(req, 'video');
  if (videoFile) {
    popupData.video = videoFile;
  }

  // Check if value already exists (for non-deleted records)
  if (popupData.value) {
    const existingPopup = await FeaturePopup.findOne({
      value: popupData.value,
      is_deleted: { $ne: true },
    })
      .setOptions({ bypassDeleted: true })
      .lean();

    if (existingPopup) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Feature popup with value '${popupData.value}' already exists`,
      );
    }
  }

  // Validate feature exists
  const feature = await Feature.findById(popupData.feature).lean();
  if (!feature) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
  }

  const result = await FeaturePopup.create(popupData);

  // Clear feature cache
  await clearFeatureCache();

  return result.toObject();
};

export const getFeaturePopup = async (id: string): Promise<TFeaturePopup> => {
  const result = await FeaturePopup.findById(id).populate('feature');
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature popup not found');
  }
  return result;
};

export const getFeaturePopups = async (
  query: Record<string, unknown>,
): Promise<{
  data: TFeaturePopup[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { feature, category, ...rest } = query;

  const filter: Record<string, unknown> = {};

  if (feature) {
    filter.feature = new mongoose.Types.ObjectId(feature as string);
  }

  if (category) {
    filter.category = category;
  }

  const popupQuery = new AppAggregationQuery<TFeaturePopup>(FeaturePopup, {
    ...rest,
    ...filter,
  });
  popupQuery
    .populate({ path: 'feature', justOne: true })
    .search(['name', 'value', 'description'])
    .filter()
    .sort(['name', 'category', 'is_active', 'created_at', 'updated_at'] as any)
    .paginate()
    .fields();

  const result = await popupQuery.execute([
    {
      key: 'active',
      filter: { is_active: true },
    },
    {
      key: 'inactive',
      filter: { is_active: false },
    },
    {
      key: 'single_time',
      filter: { category: 'single-time' },
    },
    {
      key: 'multi_time',
      filter: { category: 'multi-time' },
    },
  ]);

  return result;
};

export const getPublicFeaturePopups = async (
  query: Record<string, unknown>,
): Promise<{
  data: TFeaturePopup[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { feature, ...rest } = query;

  const filter: Record<string, unknown> = {
    is_active: true,
  };

  if (feature) {
    filter.feature = new mongoose.Types.ObjectId(feature as string);
  }

  const popupQuery = new AppAggregationQuery<TFeaturePopup>(FeaturePopup, {
    ...rest,
    ...filter,
  });
  popupQuery
    .populate({ path: 'feature', justOne: true })
    .search(['name', 'value', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await popupQuery.execute();

  return result;
};

export const updateFeaturePopup = async (
  id: string,
  payload: Partial<TFeaturePopup>,
  req: Request & { storages?: TStorageResult[]; oldFilePaths?: string[] },
): Promise<TFeaturePopup> => {
  const data = await FeaturePopup.findById(id).lean();
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature popup not found');
  }

  // Convert value to lowercase if provided
  const updateData: Partial<TFeaturePopup> = { ...payload };
  if (payload.value !== undefined) {
    updateData.value = payload.value.toLowerCase().trim();

    // Check if value already exists (for non-deleted records, excluding current popup)
    const existingPopup = await FeaturePopup.findOne({
      value: updateData.value,
      _id: { $ne: id },
      is_deleted: { $ne: true },
    })
      .setOptions({ bypassDeleted: true })
      .lean();

    if (existingPopup) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Feature popup with value '${updateData.value}' already exists`,
      );
    }
  }

  // Parse actions
  if (payload.actions !== undefined) {
    updateData.actions = parseActions(payload.actions as any);
  }

  // Track old file paths for deletion
  const oldFilePaths: string[] = [];

  // Process file uploads (new files)
  const imageFile = processFileUploads(req, 'image');
  if (imageFile) {
    // If new image uploaded and old image exists, mark old image for deletion
    if (data.image) {
      oldFilePaths.push(data.image);
    }
    updateData.image = imageFile;
  }

  const videoFile = processFileUploads(req, 'video');
  if (videoFile) {
    // If new video uploaded and old video exists, mark old video for deletion
    if (data.video) {
      oldFilePaths.push(data.video);
    }
    updateData.video = videoFile;
  }

  // Set oldFilePaths on request for storage middleware to handle deletion
  if (oldFilePaths.length > 0) {
    (req as Request & { oldFilePaths?: string[] }).oldFilePaths = oldFilePaths;
  }

  // Validate feature exists if provided
  if (updateData.feature) {
    const feature = await Feature.findById(updateData.feature).lean();
    if (!feature) {
      throw new AppError(httpStatus.NOT_FOUND, 'Feature not found');
    }
  }

  const result = await FeaturePopup.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate('feature');

  // Clear feature cache
  await clearFeatureCache();

  // Delete old files from cloud storage if new files were uploaded
  if (oldFilePaths.length > 0) {
    try {
      // Resolve credentials path
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? path.resolve(
            process.cwd(),
            process.env.GOOGLE_APPLICATION_CREDENTIALS,
          )
        : undefined;

      // Initialize Storage client
      const storageClient = new Storage({
        ...(credentialsPath && { keyFilename: credentialsPath }),
        ...(process.env.GOOGLE_CLOUD_PROJECT_ID && {
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        }),
      });

      const defaultBucket =
        process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'zaaz-public-assets';

      // Delete old files
      for (const oldPath of oldFilePaths) {
        try {
          // Parse oldPath format: "bucket-name/filename" or "https://storage.googleapis.com/bucket/filename" or just "filename"
          let oldBucketName = defaultBucket;
          let oldFilename = oldPath;

          if (oldPath.startsWith('https://storage.googleapis.com/')) {
            // Extract from full URL
            const urlParts = oldPath
              .replace('https://storage.googleapis.com/', '')
              .split('/');
            if (urlParts.length >= 2) {
              oldBucketName = urlParts[0];
              oldFilename = urlParts.slice(1).join('/');
            } else {
              oldFilename = urlParts[0];
            }
          } else {
            // Check if it contains bucket name
            const pathParts = oldPath.split('/');
            if (pathParts.length > 1) {
              oldBucketName = pathParts[0];
              oldFilename = pathParts.slice(1).join('/');
            }
          }

          const oldBucket = storageClient.bucket(oldBucketName);
          const oldFile = oldBucket.file(oldFilename);

          await oldFile.delete();
        } catch (deleteError: any) {
          // Ignore errors if file doesn't exist (404)
          if (deleteError.code !== 404) {
            console.warn(
              `[Feature Popup] Failed to delete old file from cloud storage: ${oldPath}`,
              deleteError.message,
            );
          }
        }
      }
    } catch (error: any) {
      // Log error but don't fail the update
      console.error(
        '[Feature Popup] Failed to initialize Storage client for old file deletion:',
        error,
      );
    }
  }

  return result!.toObject();
};

export const deleteFeaturePopup = async (id: string): Promise<void> => {
  const popup = await FeaturePopup.findById(id);
  if (!popup) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature popup not found');
  }

  await popup.softDelete();

  // Clear feature cache
  await clearFeatureCache();
};

export const deleteFeaturePopupPermanent = async (
  id: string,
): Promise<void> => {
  const popup = await FeaturePopup.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (!popup) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature popup not found');
  }

  await FeaturePopup.findByIdAndDelete(id).setOptions({ bypassDeleted: true });

  // Clear feature cache
  await clearFeatureCache();
};

export const deleteFeaturePopups = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const popups = await FeaturePopup.find({ _id: { $in: ids } }).lean();
  const foundIds = popups.map((popup) => popup._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await FeaturePopup.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  // Clear feature cache
  await clearFeatureCache();

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteFeaturePopupsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const popups = await FeaturePopup.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();

  const foundIds = popups.map((popup) => popup._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await FeaturePopup.deleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });

  // Clear feature cache
  await clearFeatureCache();

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreFeaturePopup = async (
  id: string,
): Promise<TFeaturePopup> => {
  const popup = await FeaturePopup.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  ).populate('feature');

  if (!popup) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Feature popup not found or not deleted',
    );
  }

  // Clear feature cache
  await clearFeatureCache();

  return popup.toObject();
};

export const restoreFeaturePopups = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await FeaturePopup.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredPopups = await FeaturePopup.find({ _id: { $in: ids } }).lean();
  const restoredIds = restoredPopups.map((popup) => popup._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  // Clear feature cache
  await clearFeatureCache();

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
