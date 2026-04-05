import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import { TJwtPayload } from '../../types/jsonwebtoken.type';
import { deleteFiles } from '../../utils/delete-files';
import * as UserRepository from './user.repository';
import { TUser } from './user.type';

export const getUser = async (id: string): Promise<TUser> => {
  const result = await UserRepository.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  return result;
};

export const getWritersUsers = async (
  query: Record<string, unknown>,
): Promise<{
  data: TUser[];
  meta: { total: number; page: number; limit: number };
}> => {
  const result = await UserRepository.findWritersPaginated(query);
  return result;
};

export const getUsers = async (
  query: Record<string, unknown>,
): Promise<{
  data: TUser[];
  meta: { total: number; page: number; limit: number };
}> => {
  const result = await UserRepository.findPaginated(query);
  return result;
};

export const updateSelf = async (
  user: TJwtPayload,
  payload: Partial<Pick<TUser, 'name' | 'email' | 'image'>>,
): Promise<TUser> => {
  const data = await UserRepository.findById(user._id);
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (payload.email && data.email !== payload.email) {
    const emailExists = await UserRepository.findByEmail(payload.email);
    if (emailExists) {
      throw new AppError(httpStatus.CONFLICT, 'Email already exists');
    }
  }

  if (payload?.image !== data.image && data.image) {
    deleteFiles(data.image, 'user/images');
    payload.image = payload.image || '';
  }

  const result = await UserRepository.updateById(user._id, {
    ...payload,
    $inc: { token_version: 1 },
  });

  return result!;
};

export const updateUser = async (
  id: string,
  payload: Partial<
    Pick<TUser, 'name' | 'email' | 'role' | 'status' | 'is_verified'>
  >,
): Promise<TUser> => {
  const data = await UserRepository.findById(id);
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const updatedUser = await UserRepository.updateById(id, {
    ...payload,
    $inc: { token_version: 1 },
  });

  return updatedUser!;
};

export const updateUsers = async (
  ids: string[],
  payload: Partial<Pick<TUser, 'role' | 'status' | 'is_verified'>>,
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const users = await UserRepository.findMany(ids);
  const foundIds = users.map((user) => user._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await UserRepository.updateManyByIds(foundIds, {
    ...payload,
    $inc: { token_version: 1 },
  });

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const deleteUser = async (id: string): Promise<void> => {
  const user = await UserRepository.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  await UserRepository.softDeleteById(id);
};

export const deleteUserPermanent = async (id: string): Promise<void> => {
  const user = await UserRepository.findByIdWithDeleted(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  await UserRepository.hardDeleteById(id);
};

export const deleteUsers = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const users = await UserRepository.findMany(ids);
  const foundIds = users.map((user) => user._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await UserRepository.softDeleteManyByIds(foundIds);

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteUsersPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const users = await UserRepository.findManyWithDeleted(ids);
  const foundIds = users.map((user) => user._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await UserRepository.hardDeleteManyByIds(foundIds);

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreUser = async (id: string): Promise<TUser> => {
  const user = await UserRepository.restoreById(id);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found or not deleted');
  }

  return user;
};

export const restoreUsers = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await UserRepository.restoreManyByIds(ids);

  const restoredUsers = await UserRepository.findMany(ids);
  const restoredIds = restoredUsers.map((user) => user._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
