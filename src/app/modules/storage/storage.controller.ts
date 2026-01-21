import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { TStorageResult } from '../../middlewares/storage.middleware';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StorageService } from './storage.service';

const uploadFiles = catchAsync(async (req: Request, res: Response) => {
  const files = (req as Request & { storages?: TStorageResult[] }).storages;

  if (!files || files.length === 0) {
    sendResponse(res, {
      status: httpStatus.BAD_REQUEST,
      success: false,
      message: 'No files uploaded',
      data: null,
    });
    return;
  }

  const result = await StorageService.saveStorageRecords(files);

  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Files uploaded and saved successfully',
    data: result,
  });
});

export const StorageController = {
  uploadFiles,
};
