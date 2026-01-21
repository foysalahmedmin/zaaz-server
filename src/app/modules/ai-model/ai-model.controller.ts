import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as AiModelService from './ai-model.service';

export const createAiModel = catchAsync(async (req: Request, res: Response) => {
  const result = await AiModelService.createAiModel(req.body);

  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'AI Model created successfully',
    data: result,
  });
});

export const getAllAiModels = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AiModelService.getAllAiModels(req.query);

    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: 'AI Models retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  },
);

export const getAiModel = catchAsync(async (req: Request, res: Response) => {
  const result = await AiModelService.getAiModel(req.params.id);

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'AI Model retrieved successfully',
    data: result,
  });
});

export const updateAiModel = catchAsync(async (req: Request, res: Response) => {
  const result = await AiModelService.updateAiModel(req.params.id, req.body);

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'AI Model updated successfully',
    data: result,
  });
});

export const deleteAiModel = catchAsync(async (req: Request, res: Response) => {
  const result = await AiModelService.deleteAiModel(req.params.id);

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'AI Model soft deleted successfully',
    data: result,
  });
});

export const deleteAiModelPermanent = catchAsync(
  async (req: Request, res: Response) => {
    await AiModelService.deleteAiModelPermanent(req.params.id);

    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: 'AI Model permanently deleted successfully',
      data: null,
    });
  },
);

export const deleteAiModels = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AiModelService.deleteAiModels(req.body.ids);

    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: `${result.count} AI Models soft deleted successfully`,
      data: { not_found_ids: result.not_found_ids },
    });
  },
);

export const deleteAiModelsPermanent = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AiModelService.deleteAiModelsPermanent(req.body.ids);

    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: `${result.count} AI Models permanently deleted successfully`,
      data: { not_found_ids: result.not_found_ids },
    });
  },
);

export const restoreAiModel = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AiModelService.restoreAiModel(req.params.id);

    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: 'AI Model restored successfully',
      data: result,
    });
  },
);

export const restoreAiModels = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AiModelService.restoreAiModels(req.body.ids);

    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: `${result.count} AI Models restored successfully`,
      data: { not_found_ids: result.not_found_ids },
    });
  },
);
