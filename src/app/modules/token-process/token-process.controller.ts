import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as TokenProcessServices from './token-process.service';
import {
  TTokenProcessEndPayload,
  TTokenProcessStartPayload,
} from './token-process.type';

export const tokenProcessStart = catchAsync(async (req, res) => {
  const payload: TTokenProcessStartPayload = {
    user_id: req.body.user_id,
    feature_endpoint_id: req.body.feature_endpoint_id,
  };

  const result = await TokenProcessServices.tokenProcessStart(payload);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token process started successfully',
    data: result,
  });
});

export const tokenProcessEnd = catchAsync(async (req, res) => {
  const payload: TTokenProcessEndPayload = {
    cost: req.body.cost,
    user_id: req.body.user_id,
    feature_endpoint_id: req.body.feature_endpoint_id,
  };

  const result = await TokenProcessServices.tokenProcessEnd(payload);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token process ended successfully',
    data: result,
  });
});
