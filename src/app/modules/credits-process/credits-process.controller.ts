import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as CreditsProcessServices from './credits-process.service';

export const creditsProcessStart = catchAsync(async (req, res) => {
  const result = await CreditsProcessServices.creditsProcessStart(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits process started successfully',
    data: result,
  });
});

export const creditsProcessEnd = catchAsync(async (req, res) => {
  const result = await CreditsProcessServices.creditsProcessEnd(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits process ended successfully',
    data: result,
  });
});

export const creditsProcessEndMultimodel = catchAsync(async (req, res) => {
  const result = await CreditsProcessServices.creditsProcessEndMultimodel(
    req.body,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Multi-model credits process ended successfully',
    data: result,
  });
});
