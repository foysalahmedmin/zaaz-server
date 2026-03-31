import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import * as CreditsUsageServices from './credits-usage.service';

export const createCreditsUsage = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CreditsUsageServices.createCreditsUsage(req.body);
    responseFormatter(res, {
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
    responseFormatter(res, {
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
    responseFormatter(res, {
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
    responseFormatter(res, {
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
    responseFormatter(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Credits usage logs retrieved successfully',
      data: result,
    });
  },
);


