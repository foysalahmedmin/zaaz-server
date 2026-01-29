import httpStatus from 'http-status';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { Feature } from '../feature/feature.model';
import { notifyAdmins } from '../notification/notification.service';
import { FeatureFeedback } from './feature-feedback.model';
import { TFeatureFeedback } from './feature-feedback.type';

export const createFeatureFeedback = async (
  data: TFeatureFeedback,
): Promise<TFeatureFeedback> => {
  const result = await FeatureFeedback.create(data);

  // Trigger notification for admins
  const feature = await Feature.findById(data.feature).lean();

  await notifyAdmins(
    {
      title: 'New Feature Feedback Received',
      message: `A user has provided feedback for the feature: ${feature?.name || 'Unknown'}. Rating: ${data.rating}/5.`,
      url: `/feature-feedbacks`, // Deep link to admin page
    },
    {
      source: 'feature-feedback',
      reference: result._id.toString(),
    },
  );

  return result.toObject();
};

export const getFeatureFeedbacks = async (
  query: Record<string, unknown>,
): Promise<{
  data: TFeatureFeedback[];
  meta: { total: number; page: number; limit: number };
}> => {
  const feedbackQuery = new AppAggregationQuery<TFeatureFeedback>(
    FeatureFeedback,
    query,
  )
    .populate([
      { path: 'user', select: 'name email image' },
      { path: 'feature', select: 'name value' },
    ])
    .search(['comment', 'category', 'status'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await feedbackQuery.execute();
  return result;
};

export const updateFeatureFeedback = async (
  id: string,
  payload: Partial<TFeatureFeedback>,
): Promise<TFeatureFeedback> => {
  const result = await FeatureFeedback.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feedback not found');
  }

  return result;
};

export const deleteFeatureFeedback = async (id: string): Promise<void> => {
  const feedback = await FeatureFeedback.findById(id);
  if (!feedback) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feedback not found');
  }

  await feedback.softDelete();
};

export const deleteFeatureFeedbacks = async (ids: string[]): Promise<void> => {
  await FeatureFeedback.updateMany({ _id: { $in: ids } }, { is_deleted: true });
};

export const updateFeatureFeedbacksStatus = async (
  ids: string[],
  status: string,
): Promise<void> => {
  await FeatureFeedback.updateMany({ _id: { $in: ids } }, { status });
};
