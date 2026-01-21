import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as AiModelHistoryServices from './ai-model-history.service';

export const getAiModelHistories = catchAsync(async (req, res) => {
  const { packageId: aiModelId } = req.params; // Using packageId as alias if using same route structure or just aiModelId
  const result = await AiModelHistoryServices.getAiModelHistories(
    aiModelId,
    req.query,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'AI Model histories retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getAiModelHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AiModelHistoryServices.getAiModelHistory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'AI Model history retrieved successfully',
    data: result,
  });
});

export const deleteAiModelHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  await AiModelHistoryServices.deleteAiModelHistory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'AI Model history soft deleted successfully',
    data: null,
  });
});

export const deleteAiModelHistoryPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await AiModelHistoryServices.deleteAiModelHistoryPermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'AI Model history permanently deleted successfully',
    data: null,
  });
});

export const deleteAiModelHistories = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await AiModelHistoryServices.deleteAiModelHistories(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} AI Model histories soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteAiModelHistoriesPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await AiModelHistoryServices.deleteAiModelHistoriesPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} AI Model histories permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restoreAiModelHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AiModelHistoryServices.restoreAiModelHistory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'AI Model history restored successfully',
    data: result,
  });
});

export const restoreAiModelHistories = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await AiModelHistoryServices.restoreAiModelHistories(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} AI Model histories restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
