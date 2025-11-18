import httpStatus from 'http-status';
import AppError from '../../builder/AppError';
import AppQuery from '../../builder/AppQuery';
import { PaymentMethod } from './payment-method.model';
import { TPaymentMethod } from './payment-method.type';

export const createPaymentMethod = async (
  data: TPaymentMethod,
): Promise<TPaymentMethod> => {
  const result = await PaymentMethod.create(data);
  return result.toObject();
};

export const getPublicPaymentMethod = async (
  id: string,
): Promise<TPaymentMethod> => {
  const result = await PaymentMethod.findOne({
    _id: id,
    is_active: true,
  });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment method not found');
  }
  return result;
};

export const getPaymentMethod = async (
  id: string,
): Promise<TPaymentMethod> => {
  const result = await PaymentMethod.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment method not found');
  }
  return result;
};

export const getPublicPaymentMethods = async (
  query: Record<string, unknown>,
): Promise<{
  data: TPaymentMethod[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { currency, ...rest } = query;

  const filter: Record<string, unknown> = {
    is_active: true,
  };

  if (currency) {
    filter.currency = currency;
  }

  const paymentMethodQuery = new AppQuery<TPaymentMethod>(
    PaymentMethod.find(),
    { ...rest, ...filter },
  )
    .search(['name', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await paymentMethodQuery.execute();

  return result;
};

export const getPaymentMethods = async (
  query: Record<string, unknown>,
): Promise<{
  data: TPaymentMethod[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { currency, ...rest } = query;

  const filter: Record<string, unknown> = {};

  if (currency) {
    filter.currency = currency;
  }

  const paymentMethodQuery = new AppQuery<TPaymentMethod>(
    PaymentMethod.find(),
    { ...rest, ...filter },
  )
    .search(['name', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await paymentMethodQuery.execute([
    {
      key: 'active',
      filter: { is_active: true },
    },
    {
      key: 'inactive',
      filter: { is_active: false },
    },
  ]);

  return result;
};

export const updatePaymentMethod = async (
  id: string,
  payload: Partial<TPaymentMethod>,
): Promise<TPaymentMethod> => {
  const data = await PaymentMethod.findById(id).lean();
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment method not found');
  }

  const result = await PaymentMethod.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result!;
};

export const updatePaymentMethods = async (
  ids: string[],
  payload: Partial<Pick<TPaymentMethod, 'is_active'>>,
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const paymentMethods = await PaymentMethod.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = paymentMethods.map((pm) => pm._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await PaymentMethod.updateMany(
    { _id: { $in: foundIds } },
    { ...payload },
  );

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const deletePaymentMethod = async (id: string): Promise<void> => {
  const paymentMethod = await PaymentMethod.findById(id);
  if (!paymentMethod) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment method not found');
  }

  await paymentMethod.softDelete();
};

export const deletePaymentMethodPermanent = async (
  id: string,
): Promise<void> => {
  const paymentMethod = await PaymentMethod.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (!paymentMethod) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment method not found');
  }

  await PaymentMethod.findByIdAndDelete(id).setOptions({
    bypassDeleted: true,
  });
};

export const deletePaymentMethods = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const paymentMethods = await PaymentMethod.find({
    _id: { $in: ids },
  }).lean();
  const foundIds = paymentMethods.map((pm) => pm._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await PaymentMethod.updateMany(
    { _id: { $in: foundIds } },
    { is_deleted: true },
  );

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deletePaymentMethodsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const paymentMethods = await PaymentMethod.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();

  const foundIds = paymentMethods.map((pm) => pm._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await PaymentMethod.deleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restorePaymentMethod = async (
  id: string,
): Promise<TPaymentMethod> => {
  const paymentMethod = await PaymentMethod.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );

  if (!paymentMethod) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Payment method not found or not deleted',
    );
  }

  return paymentMethod;
};

export const restorePaymentMethods = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await PaymentMethod.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredPaymentMethods = await PaymentMethod.find({
    _id: { $in: ids },
  }).lean();
  const restoredIds = restoredPaymentMethods.map((pm) => pm._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

