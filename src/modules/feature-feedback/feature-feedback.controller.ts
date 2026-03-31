import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import * as FeatureFeedbackService from './feature-feedback.service';

export const createFeatureFeedback = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;
    const result = await FeatureFeedbackService.createFeatureFeedback({
      ...req.body,
      user: user._id,
    });

    responseFormatter(res, {
      status: httpStatus.CREATED,
      success: true,
      message: 'Feedback submitted successfully',
      data: result,
    });
  },
);

export const getFeatureFeedbacks = catchAsync(
  async (req: Request, res: Response) => {
    const result = await FeatureFeedbackService.getFeatureFeedbacks(req.query);

    responseFormatter(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Feedbacks retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  },
);

export const updateFeatureFeedback = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await FeatureFeedbackService.updateFeatureFeedback(
    id,
    req.body,
  );
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature feedback updated successfully',
    data: result,
  });
});

export const deleteFeatureFeedback = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await FeatureFeedbackService.deleteFeatureFeedback(id);

    responseFormatter(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Feature feedback deleted successfully',
      data: null,
    });
  },
);

export const deleteFeatureFeedbacks = catchAsync(async (req, res) => {
  const { ids } = req.body;
  await FeatureFeedbackService.deleteFeatureFeedbacks(ids);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature feedbacks deleted successfully',
    data: null,
  });
});

export const updateFeatureFeedbacksStatus = catchAsync(async (req, res) => {
  const { ids, status } = req.body;
  await FeatureFeedbackService.updateFeatureFeedbacksStatus(ids, status);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Feature feedbacks updated successfully',
    data: null,
  });
});


