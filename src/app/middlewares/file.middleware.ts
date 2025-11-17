import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import httpStatus from 'http-status';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import AppError from '../builder/AppError';
import catchAsync from '../utils/catchAsync';

type TFile = {
  name: string;
  folder: string;
  size?: number;
  maxCount?: number;
  minCount?: number;
  allowedTypes?: string[];
};

const file = (...files: TFile[]) => {
  const storage = multer.diskStorage({
    destination: (_req, file, cb) => {
      const folder = files.find((f) => f.name === file.fieldname)?.folder || '';
      const safeFolder = folder.replace(/^\/+/, ''); // remove leading slash
      const dir = path.join('uploads', safeFolder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    },
  });

  // Global max size for multer limits (max of all per-field size limits)
  const globalMaxSize = Math.max(...files.map((f) => f.size || 5_000_000));

  // File filter for validating mimetype and size per field
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
          `Invalid file type for field "${file.fieldname}"`,
        ),
      );
    }

    cb(null, true);
  };

  // Setup multer upload
  const upload = multer({
    storage,
    limits: { fileSize: globalMaxSize },
    fileFilter,
  }).fields(
    files.map((f) => ({
      name: f.name,
      maxCount: f.maxCount || 1,
    })),
  );

  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err: any) => {
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

        // Delete old files support (single or multiple)
        const oldFilePaths = (
          req as Request & { oldFilePath?: string; oldFilePaths?: string[] }
        ).oldFilePaths;
        if (oldFilePaths?.length) {
          oldFilePaths.forEach((oldPath) => {
            const fullPath = path.resolve(oldPath);
            fs.unlink(fullPath, (unlinkErr) => {
              if (unlinkErr && unlinkErr.code !== 'ENOENT') {
                console.warn(
                  `Failed to delete old file: ${fullPath}`,
                  unlinkErr.message,
                );
              }
            });
          });
        } else {
          const oldFilePath = (req as Request & { oldFilePath?: string })
            .oldFilePath;
          if (oldFilePath) {
            const fullPath = path.resolve(oldFilePath);
            fs.unlink(fullPath, (unlinkErr) => {
              if (unlinkErr && unlinkErr.code !== 'ENOENT') {
                console.warn(
                  `Failed to delete old file: ${fullPath}`,
                  unlinkErr.message,
                );
              }
            });
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    });
  });
};

export default file;
