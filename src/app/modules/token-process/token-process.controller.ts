import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
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
    user_id: req.body.user_id,
    feature_endpoint_id: req.body.feature_endpoint_id,
    input_token: req.body.input_token,
    output_token: req.body.output_token,
    model: req.body.model,
  };

  const result = await TokenProcessServices.tokenProcessEnd(payload);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Token process ended successfully',
    data: result,
  });
});
