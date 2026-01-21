import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppAggregationQuery from '../../builder/AppAggregationQuery';
import AppError from '../../builder/AppError';
import { withCache } from '../../utils/cache.utils';
import { AiModelHistory } from '../ai-model-history/ai-model-history.model';
import { clearCreditsProcessCache } from '../credits-process/credits-process.service';
import { DEFAULT_AI_MODEL } from './ai-model.constant';
import { AiModel } from './ai-model.model';
import { TAiModel } from './ai-model.type';

const CACHE_TTL = 86400; // 24 hours

export const createAiModel = async (payload: TAiModel): Promise<TAiModel> => {
  // Check if value already exists
  const isExist = await AiModel.isAiModelExistByValue(payload.value);
  if (isExist) {
    throw new AppError(
      httpStatus.CONFLICT,
      'AI Model with this value already exists',
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // If is_initial is true, unset others
    if (payload.is_initial) {
      await AiModel.updateMany(
        { is_initial: true },
        { is_initial: false },
        { session },
      );
    } else {
      // If this is the first model ever, make it initial by default
      const count = await AiModel.countDocuments({
        is_deleted: { $ne: true },
      }).session(session);
      if (count === 0) {
        payload.is_initial = true;
      }
    }

    const result = await AiModel.create([payload], { session });

    await session.commitTransaction();

    // Clear credits process cache
    await clearCreditsProcessCache('ai-model', result[0].value);

    return result[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getAllAiModels = async (query: Record<string, unknown>) => {
  const aiModelQuery = new AppAggregationQuery(AiModel, query)
    .search(['name', 'value', 'provider'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await aiModelQuery.execute();
  return result;
};

export const getAiModel = async (id: string): Promise<TAiModel> => {
  const result = await AiModel.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'AI Model not found');
  }
  return result;
};

export const getAiModelByValueOrInitial = async (
  value?: string,
): Promise<TAiModel> => {
  return await withCache(
    `ai-model:${value || 'initial'}`,
    CACHE_TTL,
    async () => {
      const filter: any = {
        is_active: true,
        is_deleted: { $ne: true },
      };
      if (value) {
        filter.value = value;
      } else {
        filter.is_initial = true;
      }
      const result = await AiModel.findOne(filter).lean();
      if (!result) {
        console.warn(
          `[AI Model] AI Model "${value || 'initial'}" not found in DB. Falling back to system defaults.`,
        );
        return {
          name: value || DEFAULT_AI_MODEL.name,
          value: value || DEFAULT_AI_MODEL.value,
          provider: DEFAULT_AI_MODEL.provider,
          input_token_price: DEFAULT_AI_MODEL.input_token_price,
          output_token_price: DEFAULT_AI_MODEL.output_token_price,
          currency: DEFAULT_AI_MODEL.currency,
          is_initial: true,
          is_active: true,
        } as TAiModel;
      }
      return result;
    },
  );
};

export const getAiModelsByValuesOrInitial = async (
  values: string[],
): Promise<TAiModel[]> => {
  // 1. Fetch requested models
  const models = await AiModel.find({
    value: { $in: values },
    is_active: true,
    is_deleted: { $ne: true },
  }).lean();

  // 2. Fetch initial model as fallback
  const initialModel = await AiModel.findOne({
    is_initial: true,
    is_active: true,
    is_deleted: { $ne: true },
  }).lean();

  const result = models;
  if (initialModel && !models.find((m) => m.is_initial)) {
    result.push(initialModel);
  }

  return result;
};

export const updateAiModel = async (
  id: string,
  payload: Partial<TAiModel>,
): Promise<TAiModel> => {
  const existingAiModel = await AiModel.findById(id).lean();
  if (!existingAiModel) {
    throw new AppError(httpStatus.NOT_FOUND, 'AI Model not found');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create history before update
    await AiModelHistory.create(
      [
        {
          ai_model: existingAiModel._id,
          name: existingAiModel.name,
          value: existingAiModel.value,
          provider: existingAiModel.provider,
          input_token_price: existingAiModel.input_token_price,
          output_token_price: existingAiModel.output_token_price,
          currency: existingAiModel.currency,
          is_active: existingAiModel.is_active,
          is_initial: existingAiModel.is_initial,
          is_deleted: existingAiModel.is_deleted,
        },
      ],
      { session },
    );

    // If is_initial is true, unset others
    if (payload.is_initial) {
      await AiModel.updateMany(
        { _id: { $ne: id }, is_initial: true },
        { is_initial: false },
        { session },
      );
    }

    // prevent setting is_initial to false if it's the only one?
    // User said "only ekta model e hobe initial model".
    // If user tries to set is_initial: false, we might want to check if there are others.
    // But usually we just follow the payload. If they turn it off, no initial model might exist, which might be an issue.
    // However, the rule is "one model will be initial".
    // Let's ensure if we set it to false, we warn or something?
    // Actually, usually you set another one to true to "switch".
    // If I update the *current* initial model to `is_initial: false`, system will have 0 initial models.
    // I will allow this for flexibility unless strict business rule prevents 0 initials.
    // Looking at package implementation: it seems to just unset others if payload is true.

    const result = await AiModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
      session,
    });

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'AI Model not found');
    }

    await session.commitTransaction();

    // Clear credits process cache
    await clearCreditsProcessCache('ai-model', result.value);

    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const deleteAiModel = async (id: string): Promise<TAiModel> => {
  const result = await AiModel.findById(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'AI Model not found');
  }

  await result.softDelete();

  // Clear credits process cache
  await clearCreditsProcessCache('ai-model', result.value);

  return result;
};

export const deleteAiModelPermanent = async (id: string): Promise<void> => {
  const result = await AiModel.findByIdAndDelete(id).setOptions({
    bypassDeleted: true,
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'AI Model not found');
  }

  // Clear credits process cache
  await clearCreditsProcessCache('ai-model');
};

export const deleteAiModels = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const models = await AiModel.find({ _id: { $in: ids } }).lean();
  const foundIds = models.map((model) => model._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await AiModel.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteAiModelsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const models = await AiModel.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();

  const foundIds = models.map((model) => model._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await AiModel.deleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreAiModel = async (id: string): Promise<TAiModel> => {
  const result = await AiModel.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );

  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'AI Model not found or not deleted',
    );
  }

  return result;
};

export const restoreAiModels = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await AiModel.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredModels = await AiModel.find({ _id: { $in: ids } }).lean();
  const restoredIds = restoredModels.map((model) => model._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
