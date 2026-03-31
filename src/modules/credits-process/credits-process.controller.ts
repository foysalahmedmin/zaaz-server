import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import * as CreditsProcessServices from './credits-process.service';

export const creditsProcessStart = catchAsync(async (req, res) => {
  const payload = {
    ...req.body,
    user_id: (req as any).user?._id?.toString(),
    user_email: (req as any).user?.email,
  };
  const result = await CreditsProcessServices.creditsProcessStart(payload);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits process started successfully',
    data: result,
  });
});

export const creditsProcessEnd = catchAsync(async (req, res) => {
  const payload = {
    ...req.body,
    user_id: (req as any).user?._id?.toString(),
  };
  const result = await CreditsProcessServices.creditsProcessEnd(payload);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits process ended successfully',
    data: result,
  });
});


