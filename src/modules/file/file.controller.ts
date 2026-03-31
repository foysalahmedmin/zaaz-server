import { Request } from 'express';
import httpStatus from 'http-status';
import { TStorageResult } from '../../middlewares/storage.middleware';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import * as FileServices from './file.service';

// ─── Create ───────────────────────────────────────────────────────────────────

export const createLocalFile = catchAsync(async (req, res) => {
  const files = req.files as Record<string, Express.Multer.File[]>;
  const file = files?.file?.[0];

  const baseUrl = req.protocol + '://' + req.get('host');
  const result = await FileServices.createLocalFile(
    req.user!,
    file,
    req.body,
    baseUrl,
  );

  responseFormatter(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'File uploaded to local storage successfully',
    data: result,
  });
});

export const createCloudFiles = catchAsync(async (req, res) => {
  const storages = (req as Request & { storages: TStorageResult[] }).storages;

  const result = await FileServices.createCloudFiles(
    req.user!,
    storages,
    req.body,
  );

  responseFormatter(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Assets uploaded to cloud storage successfully',
    data: result,
  });
});

// ─── Get ──────────────────────────────────────────────────────────────────────

export const getFile = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FileServices.getFile(id);

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'File retrieved successfully',
    data: result,
  });
});

export const getFiles = catchAsync(async (req, res) => {
  const result = await FileServices.getFiles(req.query);

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Files retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getSelfFiles = catchAsync(async (req, res) => {
  const result = await FileServices.getSelfFiles(req.user!, req.query);

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Your files retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateFile = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FileServices.updateFile(id, req.body);

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'File metadata updated successfully',
    data: result,
  });
});

export const updateFiles = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result = await FileServices.updateFiles(ids, payload);

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Files status updated successfully',
    data: result,
  });
});

// ─── Delete ───────────────────────────────────────────────────────────────────

export const deleteFile = catchAsync(async (req, res) => {
  const { id } = req.params;
  await FileServices.deleteFile(id);

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'File soft deleted successfully',
    data: null,
  });
});

export const deleteFiles = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await FileServices.deleteFiles(ids);

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} files soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteFilePermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await FileServices.deleteFilePermanent(id);

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'File and physical storage permanently deleted',
    data: null,
  });
});

export const deleteFilesPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await FileServices.deleteFilesPermanent(ids);

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} files and assets permanently deleted`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

// ─── Restore ──────────────────────────────────────────────────────────────────

export const restoreFile = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FileServices.restoreFile(id);

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'File restored successfully',
    data: result,
  });
});

export const restoreFiles = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await FileServices.restoreFiles(ids);

  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} files restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
