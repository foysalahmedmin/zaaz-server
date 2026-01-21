import { TStorageResult } from '../../middlewares/storage.middleware';
import { Storage } from './storage.model';
import { TStorage } from './storage.type';

const saveStorageRecords = async (
  files: TStorageResult[],
): Promise<TStorage[]> => {
  const storageFiles = files.map((file) => ({
    field_name: file.fieldName,
    name: file.originalName,
    file_name: file.filename,
    bucket: file.bucket,
    url: file.publicUrl,
    path: file.filename, // Using filename as path since it's at bucket root
    size: file.size,
    mime_type: file.mimetype,
    uploaded_at: file.uploadedAt || new Date(),
  }));

  const result = await Storage.insertMany(storageFiles);
  return result;
};

const getStorageRecords = async (query: Record<string, unknown>) => {
  const result = await Storage.find(query);
  return result;
};

export const StorageService = {
  saveStorageRecords,
  getStorageRecords,
};
