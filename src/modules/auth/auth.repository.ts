/**
 * Auth Repository
 *
 * Handles direct database interactions for the Auth module.
 * Primarily interacts with the User model for authentication-related queries.
 */

import { User } from '../user/user.model';
import mongoose from 'mongoose';

/**
 * Find a user by email, specifically for authentication.
 * Includes methods needed for auth checks (e.g. isUserExistByEmail).
 */
export const findByEmail = async (email: string): Promise<any | null> => {
  // Using the static method from the User model if it exists, otherwise standard findOne
  // In the current codebase, User model has isUserExistByEmail
  return await (User as any).isUserExistByEmail(email);
};

/**
 * Find a user by ID.
 */
export const findById = async (id: string): Promise<any | null> => {
  return await (User as any).isUserExist(id);
};

/**
 * Create a new user (Signup).
 */
export const createUser = async (payload: any): Promise<any> => {
  return await User.create(payload);
};

/**
 * Update user information (e.g., password reset, email verification).
 */
export const updateById = async (
  id: string | mongoose.Types.ObjectId,
  payload: Record<string, any>,
  options = { new: true, runValidators: true }
): Promise<any | null> => {
  return await User.findByIdAndUpdate(id, payload, options);
};

/**
 * Update user by email and role (used in change password).
 */
export const updateByEmailAndRole = async (
  email: string,
  role: string,
  payload: Record<string, any>
): Promise<any | null> => {
  return await User.findOneAndUpdate(
    { email, role },
    payload,
    { new: true, runValidators: true }
  );
};
