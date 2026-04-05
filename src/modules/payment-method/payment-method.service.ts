import httpStatus from 'http-status';
import AppAggregationQuery from '../../builder/app-aggregation-query';
import AppError from '../../builder/app-error';
import * as PaymentMethodRepository from './payment-method.repository';
import { TPaymentMethod } from './payment-method.type';

export const createPaymentMethod = async (
  data: TPaymentMethod,
): Promise<TPaymentMethod> => {
  // Create payment method first
  const result = await PaymentMethodRepository.create(data);

  return result;
};

export const getPublicPaymentMethod = async (
  id: string,
): Promise<TPaymentMethod> => {
  const result = await PaymentMethodRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment method not found');
  }
  return result;
};

export const getPaymentMethod = async (id: string): Promise<TPaymentMethod> => {
  const result = await PaymentMethodRepository.findById(id);
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
    filter.currencies = currency;
  }

  const paymentMethodQuery = new AppAggregationQuery<TPaymentMethod>(
    PaymentMethodRepository.PaymentMethod,
    { ...rest, ...filter },
  )
    .search(['name', 'value', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields([
      'name',
      'value',
      'description',
      'currencies',
      'is_test',
      'is_active',
      'is_deleted',
    ]);

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
    filter.currencies = currency;
  }

  const paymentMethodQuery = new AppAggregationQuery<TPaymentMethod>(
    PaymentMethodRepository.PaymentMethod,
    { ...rest, ...filter },
  )
    .search(['name', 'value', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields();

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
  const data = await PaymentMethodRepository.findById(id);
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment method not found');
  }

  const result = await PaymentMethodRepository.updateById(id, payload);

  return result!;
};

export const updatePaymentMethods = async (
  ids: string[],
  payload: Partial<Pick<TPaymentMethod, 'is_active'>>,
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const paymentMethods = await PaymentMethodRepository.findMany(ids);
  const foundIds = paymentMethods.map((pm: any) => pm._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await PaymentMethodRepository.updateMany(
    { _id: { $in: foundIds } },
    { ...payload },
  );

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const deletePaymentMethod = async (id: string): Promise<void> => {
  await PaymentMethodRepository.softDeleteById(id);
};

export const deletePaymentMethodPermanent = async (
  id: string,
): Promise<void> => {
  const paymentMethod = await PaymentMethodRepository.findById(id);

  if (!paymentMethod) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment method not found');
  }

  await PaymentMethodRepository.hardDeleteById(id);
};

export const deletePaymentMethods = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const paymentMethods = await PaymentMethodRepository.findMany(ids);
  const foundIds = paymentMethods.map((pm: any) => pm._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await PaymentMethodRepository.updateMany(
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
  const paymentMethods = await PaymentMethodRepository.findManyWithDeleted(ids);

  const foundIds = paymentMethods.map((pm: any) => pm._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await PaymentMethodRepository.hardDeleteMany(foundIds);

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restorePaymentMethod = async (
  id: string,
): Promise<TPaymentMethod> => {
  const paymentMethod = await PaymentMethodRepository.restoreById(id);

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
  const result = await PaymentMethodRepository.restoreMany(ids);

  const restoredPaymentMethods = await PaymentMethodRepository.findMany(ids);
  const restoredIds = restoredPaymentMethods.map((pm: any) => pm._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};




