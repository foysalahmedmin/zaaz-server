import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import { Feature } from '../feature/feature.model';
import { notifyAdmins } from '../notification/notification.service';
import * as FeatureFeedbackRepository from './feature-feedback.repository';
import { TFeatureFeedback } from './feature-feedback.type';

export const createFeatureFeedback = async (
  data: TFeatureFeedback,
): Promise<TFeatureFeedback> => {
  const result = await FeatureFeedbackRepository.create(data);

  const feature = await Feature.findById(data.feature).lean();

  await notifyAdmins(
    {
      title: 'New Feature Feedback Received',
      message: `A user has provided feedback for the feature: ${feature?.name || 'Unknown'}. Rating: ${data.rating}/5.`,
      url: `/feature-feedbacks`,
    },
    {
      source: 'feature-feedback',
      reference: (result as any)._id.toString(),
    },
  );

  return result;
};

export const getFeatureFeedbacks = async (
  query: Record<string, unknown>,
): Promise<{ data: TFeatureFeedback[]; meta: any }> => {
  return await FeatureFeedbackRepository.findPaginated(query);
};

export const updateFeatureFeedback = async (
  id: string,
  payload: Partial<TFeatureFeedback>,
): Promise<TFeatureFeedback> => {
  const result = await FeatureFeedbackRepository.updateById(id, payload);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feedback not found');
  }
  return result;
};

export const deleteFeatureFeedback = async (id: string): Promise<void> => {
  const existing = await FeatureFeedbackRepository.findById(id);
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feedback not found');
  }
  await FeatureFeedbackRepository.softDeleteById(id);
};

export const deleteFeatureFeedbacks = async (ids: string[]): Promise<void> => {
  await FeatureFeedbackRepository.softDeleteMany(ids);
};

export const updateFeatureFeedbacksStatus = async (
  ids: string[],
  status: string,
): Promise<void> => {
  await FeatureFeedbackRepository.updateManyStatus(ids, status);
};
