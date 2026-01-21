import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as PackageTransactionServices from './package-transaction.service';

export const getPackageTransactions = catchAsync(async (req, res) => {
  const result = await PackageTransactionServices.getPackageTransactions(
    req.query,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package transactions retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getSelfPackageTransactions = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await PackageTransactionServices.getPackageTransactions({
    ...req.query,
    user: userId,
  });
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Self package transactions retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getPackageTransactionById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackageTransactionServices.getPackageTransactionById(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package transaction retrieved successfully',
    data: result,
  });
});

export const deletePackageTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PackageTransactionServices.deletePackageTransaction(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package transaction soft deleted successfully',
    data: null,
  });
});

export const deletePackageTransactionPermanent = catchAsync(
  async (req, res) => {
    const { id } = req.params;
    await PackageTransactionServices.deletePackageTransactionPermanent(id);
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: 'Package transaction permanently deleted successfully',
      data: null,
    });
  },
);

export const deletePackageTransactions = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await PackageTransactionServices.deletePackageTransactions(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} package transactions soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deletePackageTransactionsPermanent = catchAsync(
  async (req, res) => {
    const { ids } = req.body;
    const result =
      await PackageTransactionServices.deletePackageTransactionsPermanent(ids);
    sendResponse(res, {
      status: httpStatus.OK,
      success: true,
      message: `${result.count} package transactions permanently deleted successfully`,
      data: {
        not_found_ids: result.not_found_ids,
      },
    });
  },
);

export const restorePackageTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackageTransactionServices.restorePackageTransaction(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package transaction restored successfully',
    data: result,
  });
});

export const restorePackageTransactions = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result =
    await PackageTransactionServices.restorePackageTransactions(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} package transactions restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const PackageTransactionControllers = {
  getPackageTransactions,
  getSelfPackageTransactions,
  getPackageTransactionById,
  deletePackageTransaction,
  deletePackageTransactionPermanent,
  deletePackageTransactions,
  deletePackageTransactionsPermanent,
  restorePackageTransaction,
  restorePackageTransactions,
};
