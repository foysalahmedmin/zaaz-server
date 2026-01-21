import { Storage } from '@google-cloud/storage';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import multer, { FileFilterCallback } from 'multer';
import path from 'node:path';
import AppError from '../builder/AppError';
import catchAsync from '../utils/catchAsync';

export type TStorageResult = {
  fieldName: string;
  originalName: string;
  filename: string;
  bucket: string;
  publicUrl?: string;
  size: number;
  mimetype: string;
  uploadedAt: Date;
};

export type TStorageFile = {
  name: string;
  size?: number;
  maxCount?: number;
  minCount?: number;
  allowedTypes?: string[];
  bucket?: string; // Optional bucket name, defaults to env variable
  makePublic?: boolean; // Whether to make file publicly accessible
};

const storage = (...files: TStorageFile[]) => {
  // Resolve credentials path relative to project root
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : undefined;

  // Initialize Google Cloud Storage client
  const storageClient = new Storage({
    ...(credentialsPath && { keyFilename: credentialsPath }),
    ...(process.env.GOOGLE_CLOUD_PROJECT_ID && {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    }),
  });

  // Get default bucket from environment with fallback
  const defaultBucket =
    process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'zaaz-public-assets';

  // Use memory storage since we'll upload to cloud
  const memoryStorage = multer.memoryStorage();

  // Global max size for multer limits (max of all per-field size limits)
  const globalMaxSize = Math.max(...files.map((f) => f.size || 5_000_000));

  // File filter for validating mimetype per field
  const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    const config = files.find((f) => f.name === file.fieldname);
    if (!config) {
      return cb(
        new AppError(
          httpStatus.BAD_REQUEST,
          `Unexpected field "${file.fieldname}"`,
        ),
      );
    }

    if (config.allowedTypes && !config.allowedTypes.includes(file.mimetype)) {
      return cb(
        new AppError(
          httpStatus.BAD_REQUEST,
          `Invalid file type for field "${file.fieldname}". Allowed types: ${config.allowedTypes.join(', ')}`,
        ),
      );
    }

    cb(null, true);
  };

  // Setup multer upload with memory storage
  const upload = multer({
    storage: memoryStorage,
    limits: { fileSize: globalMaxSize },
    fileFilter,
  }).fields(
    files.map((f) => ({
      name: f.name,
      maxCount: f.maxCount || 1,
    })),
  );

  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async (err: any) => {
      if (err) {
        return next(
          new AppError(
            httpStatus.BAD_REQUEST,
            err.message || 'File upload error',
          ),
        );
      }

      try {
        // Check minCount
        const missing = files.filter((file) => {
          const uploaded = (
            req.files as Record<string, Express.Multer.File[]>
          )?.[file.name];
          return (
            file.minCount && (!uploaded || uploaded.length < file.minCount)
          );
        });

        if (missing.length) {
          const fields = missing.map((f) => `"${f.name}"`).join(', ');
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `At least ${missing[0].minCount} file(s) required for: ${fields}`,
          );
        }

        // Upload files to Google Cloud Storage
        const storageResults: TStorageResult[] = [];

        if (req.files) {
          const filesRecord = req.files as Record<
            string,
            Express.Multer.File[]
          >;

          for (const fileConfig of files) {
            const uploadedFiles = filesRecord[fileConfig.name];
            if (!uploadedFiles || uploadedFiles.length === 0) continue;

            const bucketName = fileConfig.bucket || defaultBucket;
            const bucket = storageClient.bucket(bucketName);
            const makePublic = fileConfig.makePublic ?? false;

            for (const file of uploadedFiles) {
              try {
                // Validate file buffer exists (required for memory storage)
                if (!file.buffer) {
                  throw new AppError(
                    httpStatus.BAD_REQUEST,
                    `File buffer is missing for "${file.originalname}"`,
                  );
                }

                // Generate unique filename
                const ext = path.extname(file.originalname);
                const baseName = path.basename(file.originalname, ext);
                const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                const filename = `${baseName}-${uniqueSuffix}${ext}`;

                // Create file reference in bucket
                const bucketFile = bucket.file(filename);

                // Upload file buffer to bucket
                await bucketFile.save(file.buffer, {
                  metadata: {
                    contentType: file.mimetype,
                    metadata: {
                      originalName: file.originalname,
                      fieldName: file.fieldname,
                    },
                  },
                });

                // Make file public if requested
                // Note: If uniform bucket-level access is enabled, makePublic() will fail
                // In that case, we assume the bucket is already public and generate the URL
                if (makePublic) {
                  try {
                    await bucketFile.makePublic();
                  } catch (makePublicError: any) {
                    // If uniform bucket-level access is enabled, makePublic() will fail
                    // but the file can still be accessed if the bucket is public
                    if (
                      makePublicError.message?.includes(
                        'uniform bucket-level access',
                      )
                    ) {
                      console.warn(
                        `[Storage] Uniform bucket-level access enabled. Skipping makePublic() for ${filename}. Assuming bucket is public.`,
                      );
                      // Continue - we'll still generate the public URL
                    } else {
                      // Re-throw other errors
                      throw makePublicError;
                    }
                  }
                }

                // Get public URL
                // If makePublic is true, generate public URL (works even with uniform bucket-level access if bucket is public)
                const publicUrl = makePublic
                  ? `https://storage.googleapis.com/${bucketName}/${filename}`
                  : undefined;

                // Store result
                storageResults.push({
                  fieldName: file.fieldname,
                  originalName: file.originalname,
                  filename,
                  bucket: bucketName,
                  publicUrl,
                  size: file.size,
                  mimetype: file.mimetype,
                  uploadedAt: new Date(),
                });
              } catch (uploadError: any) {
                console.error(
                  `Failed to upload file ${file.originalname} to Google Cloud Storage:`,
                  uploadError,
                );
                throw new AppError(
                  httpStatus.INTERNAL_SERVER_ERROR,
                  `Failed to upload file "${file.originalname}": ${uploadError.message || 'Unknown error'}`,
                );
              }
            }
          }
        }

        // Attach storage results to request object
        (req as Request & { storages: TStorageResult[] }).storages =
          storageResults;

        // Handle old file deletion from cloud storage (if oldFilePaths provided)
        const oldFilePaths = (req as Request & { oldFilePaths?: string[] })
          .oldFilePaths;
        if (oldFilePaths?.length) {
          // Delete old files from cloud storage
          for (const oldPath of oldFilePaths) {
            try {
              // Parse oldPath format: "bucket-name/filename" or just "filename" (uses default bucket)
              const pathParts = oldPath.split('/');
              const oldBucketName =
                pathParts.length > 1 ? pathParts[0] : defaultBucket;
              const oldFilename =
                pathParts.length > 1
                  ? pathParts.slice(1).join('/')
                  : pathParts[0];

              const oldBucket = storageClient.bucket(oldBucketName);
              const oldFile = oldBucket.file(oldFilename);

              await oldFile.delete();
            } catch (deleteError: any) {
              // Ignore errors if file doesn't exist (404)
              if (deleteError.code !== 404) {
                console.warn(
                  `Failed to delete old file from cloud storage: ${oldPath}`,
                  deleteError.message,
                );
              }
            }
          }
        } else {
          // Handle single old file path
          const oldFilePath = (req as Request & { oldFilePath?: string })
            .oldFilePath;
          if (oldFilePath) {
            try {
              // Parse oldFilePath format: "bucket-name/filename" or just "filename"
              const pathParts = oldFilePath.split('/');
              const oldBucketName =
                pathParts.length > 1 ? pathParts[0] : defaultBucket;
              const oldFilename =
                pathParts.length > 1
                  ? pathParts.slice(1).join('/')
                  : pathParts[0];

              const oldBucket = storageClient.bucket(oldBucketName);
              const oldFile = oldBucket.file(oldFilename);

              await oldFile.delete();
            } catch (deleteError: any) {
              // Ignore errors if file doesn't exist (404)
              if (deleteError.code !== 404) {
                console.warn(
                  `Failed to delete old file from cloud storage: ${oldFilePath}`,
                  deleteError.message,
                );
              }
            }
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    });
  });
};

export default storage;
