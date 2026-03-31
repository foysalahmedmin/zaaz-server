import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import * as PackageTransactionServices from './package-transaction.service';

export const getPackageTransactions = catchAsync(async (req, res) => {
  const result = await PackageTransactionServices.getPackageTransactions(
    req.query,
  );
  responseFormatter(res, {
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
  responseFormatter(res, {
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
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Package transaction retrieved successfully',
    data: result,
  });
});

export const deletePackageTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PackageTransactionServices.deletePackageTransaction(id);
  responseFormatter(res, {
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
    responseFormatter(res, {
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
  responseFormatter(res, {
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
    responseFormatter(res, {
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
  responseFormatter(res, {
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
  responseFormatter(res, {
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


