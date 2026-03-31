/* eslint-disable no-console */
import { Storage } from '@google-cloud/storage';
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import path from 'node:path';
import AppError from '../../builder/app-error';
import config from '../../config';
import { TStorageResult } from '../../middlewares/storage.middleware';
import { TJwtPayload } from '../../types/jsonwebtoken.type';
import { deleteFiles as deleteFilesFromDisk } from '../../utils/delete-files';
import * as FileRepository from './file.repository';
import { TFile, TFileInput } from './file.type';
import { getExtensionFromFilename, getFileTypeFromMime } from './file.utils';

// Initialize GCS client
const storageClient = new Storage({
  ...(config.gcp.credentials_path && {
    keyFilename: path.resolve(process.cwd(), config.gcp.credentials_path),
  }),
  ...(config.gcp.project_id && {
    projectId: config.gcp.project_id,
  }),
});

// ─── Create (Local) ─────────────────────────────────────────────────────────

export const createLocalFile = async (
  user: TJwtPayload,
  file: Express.Multer.File,
  payload: TFileInput,
  baseUrl: string = '',
): Promise<TFile> => {
  if (!file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No file uploaded');
  }

  const filePath = file.path.replace(/\\/g, '/');
  const extension = getExtensionFromFilename(file.filename);
  const fileType = getFileTypeFromMime(file.mimetype, extension);

  const fileData: Partial<TFile> = {
    name: payload.name || file.originalname,
    originalname: file.originalname,
    filename: file.filename,
    url: `${baseUrl}/${filePath}`,
    mimetype: file.mimetype,
    size: file.size,
    author: user._id as unknown as Types.ObjectId,
    provider: 'local',
    category: payload.category,
    description: payload.description,
    caption: payload.caption,
    status: payload.status || 'active',
    is_deleted: false,
    metadata: {
      path: filePath,
      extension,
      file_type: fileType,
    },
  };

  return await FileRepository.create(fileData);
};

// ─── Create (Cloud/GCS) ──────────────────────────────────────────────────────

export const createCloudFiles = async (
  user: TJwtPayload,
  results: TStorageResult[],
  payload: TFileInput,
): Promise<TFile[]> => {
  if (!results || results.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No storage results found');
  }

  const storagesData: Partial<TFile>[] = results.map((result) => {
    const extension = getExtensionFromFilename(result.filename);
    const fileType = getFileTypeFromMime(result.mimetype, extension);

    return {
      name: payload.name || result.originalName,
      originalname: result.originalName,
      filename: result.filename,
      url: result.publicUrl || '',
      mimetype: result.mimetype,
      size: result.size,
      author: user._id as unknown as Types.ObjectId,
      provider: 'gcs',
      category: payload.category,
      description: payload.description,
      caption: payload.caption,
      status: payload.status || 'active',
      is_deleted: false,
      metadata: {
        bucket: result.bucket,
        extension,
        file_type: fileType,
      },
    };
  });

  return await FileRepository.createMany(storagesData);
};

// ─── Get Single ───────────────────────────────────────────────────────────────

export const getFile = async (id: string): Promise<TFile> => {
  const result = await FileRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'File not found');
  }
  return result;
};

// ─── Get Many ────────────────────────────────────────────────────────────────

export const getFiles = async (
  query: Record<string, unknown>,
): Promise<{
  data: TFile[];
  meta: { total: number; page: number; limit: number };
}> => {
  // Map 'type' or 'file_type' to 'metadata.file_type' for compatibility with frontend
  const typeValue = query.file_type || query.type;
  if (typeValue) {
    query['metadata.file_type'] = typeValue;
    delete query.file_type;
    delete query.type;
  }
  return await FileRepository.findPaginated(query);
};

export const getSelfFiles = async (
  user: TJwtPayload,
  query: Record<string, unknown>,
): Promise<{
  data: TFile[];
  meta: { total: number; page: number; limit: number };
}> => {
  // Map 'type' or 'file_type' to 'metadata.file_type' for compatibility with frontend
  const typeValue = (query.file_type as string) || (query.type as string);
  if (typeValue) {
    query['metadata.file_type'] = typeValue;
    delete query.file_type;
    delete query.type;
  }
  return await FileRepository.findPaginated(query, { author: user._id });
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateFile = async (
  id: string,
  payload: Partial<
    Pick<TFile, 'name' | 'description' | 'category' | 'caption' | 'status'>
  >,
): Promise<TFile> => {
  const exists = await FileRepository.findByIdLean(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'File not found');
  }

  const result = await FileRepository.updateById(id, payload);
  return result!;
};

export const updateFiles = async (
  ids: string[],
  payload: Partial<Pick<TFile, 'status'>>,
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const files = await FileRepository.findManyByIds(ids);
  const foundIds = files.map((file) => file._id!.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await FileRepository.updateManyByIds(foundIds, payload);

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

// ─── Soft Delete ──────────────────────────────────────────────────────────────

export const deleteFile = async (id: string): Promise<void> => {
  const file = await FileRepository.findById(id);
  if (!file) {
    throw new AppError(httpStatus.NOT_FOUND, 'File not found');
  }

  await file.softDelete();
};

export const deleteFiles = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const files = await FileRepository.findManyByIds(ids);
  const foundIds = files.map((file) => file._id!.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await FileRepository.softDeleteManyByIds(foundIds);

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

// ─── Hard Delete ──────────────────────────────────────────────────────────────

export const deleteFilePermanent = async (id: string): Promise<void> => {
  const file = await FileRepository.findByIdWithDeleted(id);
  if (!file) {
    throw new AppError(httpStatus.NOT_FOUND, 'File not found');
  }

  // Delete physical file based on provider
  if (file.provider === 'local' && file.metadata?.path) {
    await deleteFilesFromDisk(file.metadata.path);
  } else if (file.provider === 'gcs' && file.metadata?.bucket) {
    try {
      const bucket = storageClient.bucket(file.metadata.bucket);
      const cloudFile = bucket.file(file.filename);
      await cloudFile.delete();
    } catch (error: unknown) {
      if ((error as { code?: number }).code !== 404) {
        console.error(
          `GCS Delete Error (${file.filename}):`,
          (error as Error).message,
        );
      }
    }
  }

  await FileRepository.hardDeleteById(id);
};

export const deleteFilesPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const files = await FileRepository.findManyDeletedByIds(ids);
  const foundIds = files.map((file) => file._id!.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  // Batch delete physical files
  for (const file of files) {
    if (file.provider === 'local' && file.metadata?.path) {
      await deleteFilesFromDisk(file.metadata.path);
    } else if (file.provider === 'gcs' && file.metadata?.bucket) {
      try {
        const bucket = storageClient.bucket(file.metadata.bucket);
        const cloudFile = bucket.file(file.filename);
        await cloudFile.delete();
      } catch (error: unknown) {
        if ((error as { code?: number }).code !== 404) {
          console.warn(
            `GCS Batch Delete Fail (${file.filename}):`,
            (error as Error).message,
          );
        }
      }
    }
  }

  await FileRepository.hardDeleteManyByIds(foundIds);

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

// ─── Restore ──────────────────────────────────────────────────────────────────

export const restoreFile = async (id: string): Promise<TFile> => {
  const file = await FileRepository.restoreById(id);
  if (!file) {
    throw new AppError(httpStatus.NOT_FOUND, 'File not found or not deleted');
  }
  return file;
};

export const restoreFiles = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await FileRepository.restoreManyByIds(ids);

  const restoredFiles = await FileRepository.findManyByIds(ids);
  const restoredIds = restoredFiles.map((file) => file._id!.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
