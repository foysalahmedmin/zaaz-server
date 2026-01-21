import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as CreditsUsageServices from './credits-usage.service';

export const createCreditsUsage = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CreditsUsageServices.createCreditsUsage(req.body);
    sendResponse(res, {
      status: httpStatus.CREATED,
      success: true,
      message: 'Credits usage log created successfully',
      data: result,
    });
  },
);

export const getCreditsUsages = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CreditsUsageServices.getCreditsUsages(req.query);
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Credits usage logs retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  },
);

export const getCreditsUsageById = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CreditsUsageServices.getCreditsUsageById(
      req.params.id,
    );
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Credits usage log retrieved successfully',
      data: result,
    });
  },
);

export const deleteCreditsUsage = catchAsync(
  async (req: Request, res: Response) => {
    await CreditsUsageServices.deleteCreditsUsage(req.params.id);
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Credits usage log deleted successfully',
      data: null,
    });
  },
);

/**
 * Get credits usage logs by usage_key
 */
export const getCreditsUsagesByUsageKey = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CreditsUsageServices.getCreditsUsagesByUsageKey(
      req.params.usage_key,
    );
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Credits usage logs retrieved successfully',
      data: result,
    });
  },
);
