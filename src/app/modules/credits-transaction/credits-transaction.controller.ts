import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as CreditsTransactionServices from './credits-transaction.service';

export const createCreditsTransaction = catchAsync(async (req, res) => {
  const result = await CreditsTransactionServices.executeCreditsTransaction(
    req.body,
  );
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Credits transaction created successfully',
    data: result,
  });
});

export const getSelfCreditsTransactions = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await CreditsTransactionServices.getCreditsTransactions(
    {
      ...req.query,
      user: userId,
    },
    { isPublic: true },
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits transactions retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getCreditsTransactions = catchAsync(async (req, res) => {
  const result = await CreditsTransactionServices.getCreditsTransactions(
    req.query,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits transactions retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getCreditsTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CreditsTransactionServices.getCreditsTransaction(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits transaction retrieved successfully',
    data: result,
  });
});

export const deleteCreditsTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  await CreditsTransactionServices.deleteCreditsTransaction(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits transaction soft deleted successfully',
    data: null,
  });
});

export const deleteCreditsTransactionPermanent = catchAsync(
  async (req, res) => {
    const { id } = req.params;
    await CreditsTransactionServices.deleteCreditsTransactionPermanent(id);
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Credits transaction permanently deleted successfully',
      data: null,
    });
  },
);

export const deleteCreditsTransactions = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await CreditsTransactionServices.deleteCreditsTransactions(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} credits transactions soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteCreditsTransactionsPermanent = catchAsync(
  async (req, res) => {
    const { ids } = req.body;
    const result =
      await CreditsTransactionServices.deleteCreditsTransactionsPermanent(ids);
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: `${result.count} credits transactions permanently deleted successfully`,
      data: {
        not_found_ids: result.not_found_ids,
      },
    });
  },
);

export const restoreCreditsTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CreditsTransactionServices.restoreCreditsTransaction(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Credits transaction restored successfully',
    data: result,
  });
});

export const restoreCreditsTransactions = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await CreditsTransactionServices.restoreCreditsTransactions(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} credits transactions restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
