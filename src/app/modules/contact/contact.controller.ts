import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as ContactServices from './contact.service';

export const createContact = catchAsync(async (req, res) => {
  const payload = req.body || {};

  const result = await ContactServices.createContact(payload);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Contact message sent successfully',
    data: result,
  });
});

