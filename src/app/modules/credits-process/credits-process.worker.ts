import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/AppError';
import { emitToUser } from '../../socket';
import * as CreditsProfitServices from '../credits-profit/credits-profit.service';
import * as CreditsTransactionServices from '../credits-transaction/credits-transaction.service';
import * as FeatureEndpointServices from '../feature-endpoint/feature-endpoint.service';
import * as UserWalletServices from '../user-wallet/user-wallet.service';
import {
  creditsProcessDuration,
  creditsProcessErrors,
  creditsProcessTotal,
} from './credits-process.metrics';
import {
  TCreditsProcessEndMultimodelPayload,
  TCreditsProcessEndResponse,
} from './credits-process.type';
import * as CreditsProcessUtils from './credits-process.utils';

// Constants & Configuration
const DEFAULT_CREDIT_PRICE = Number(
  process.env.DEFAULT_CREDIT_PRICE || 0.00001,
);
const DEFAULT_INPUT_TOKEN_PRICE = Number(
  process.env.DEFAULT_INPUT_TOKEN_PRICE || 0.0000003,
);
const DEFAULT_OUTPUT_TOKEN_PRICE = Number(
  process.env.DEFAULT_OUTPUT_TOKEN_PRICE || 0.0000025,
);

/**
 * Deduct credits from user wallet after AI feature usage
 * This is the heavy worker function that performs DB updates
 */
export const executeCreditsProcessEnd = async (
  payload: TCreditsProcessEndMultimodelPayload,
  externalSession?: mongoose.ClientSession,
  options: { skipEmit?: boolean } = {},
): Promise<TCreditsProcessEndResponse> => {
  const {
    user_id,
    feature_endpoint_id,
    feature_endpoint_value,
    usage_key,
    usages = [],
  } = payload;

  const endTimer = creditsProcessDuration.startTimer({
    method: 'executeCreditsProcessEnd',
    mode: 'worker',
  });
  creditsProcessTotal.inc({
    method: 'executeCreditsProcessEnd',
    status: 'attempt',
  });

  try {
    // 1. Fetch feature endpoint (Cached)
    const featureEndpoint =
      await FeatureEndpointServices.getPublicFeatureEndpointByIdOrValue({
        _id: feature_endpoint_id,
        value: feature_endpoint_value,
      });

    if (!featureEndpoint || !featureEndpoint?._id) {
      throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
    }

    const endpointId = featureEndpoint._id.toString();

    // 2. Fetch collective profit margin (Cached)
    const totalProfitPercentage =
      await CreditsProfitServices.getTotalProfitPercentage();

    // 3. Process each usage and aggregate costs (Optimized batch calculation)
    // Ensure we have usage data to process
    if (!usages || usages.length === 0) {
      console.warn(
        `[Credits Process Multimodel] No usage data provided for usage_key: ${usage_key}`,
      );
    }

    const usesInfos = await getFeatureUsageInfo(usages);

    const processedItems = usesInfos.map((info: any) => {
      const audit = CreditsProcessUtils.calculateAuditCredits(
        info.base_cost_credits,
        totalProfitPercentage,
        info.credit_price,
      );

      return {
        info,
        audit,
        mapping: CreditsProcessUtils.mapUsageAuditDetails(
          { ...info, profit_credits_percentage: totalProfitPercentage },
          audit,
        ),
      };
    });

    const totalAggregatedCredits = processedItems.reduce(
      (sum, item) => sum + item.audit.final_total_credits,
      0,
    );

    // 4. Atomic Update Execution
    const session = externalSession || (await mongoose.startSession());
    const isInternalSession = !externalSession;

    if (isInternalSession) {
      session.startTransaction();
    }

    let updatedCredits = 0;

    try {
      // A. Deduct total credits from wallet
      const updatedWallet = await UserWalletServices.decrementWalletCredits(
        user_id,
        totalAggregatedCredits,
        session,
      );

      const userWalletId = updatedWallet._id?.toString();
      if (!userWalletId) {
        throw new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          'User wallet ID not found after update',
        );
      }
      const userEmail = updatedWallet.email;
      updatedCredits = updatedWallet.credits || 0;

      // B. Create an audit-ready transaction record (Single record for total)
      const transaction =
        await CreditsTransactionServices.createCreditsTransaction(
          {
            user: new mongoose.Types.ObjectId(user_id),
            user_wallet: new mongoose.Types.ObjectId(userWalletId),
            email: userEmail,
            type: 'decrease',
            credits: totalAggregatedCredits,
            decrease_source: new mongoose.Types.ObjectId(endpointId),
            usage_key,
            is_active: true,
          },
          session,
        );

      const transactionId = transaction._id;

      // C. Create detailed usage logs (Bulk insert)
      if (processedItems.length > 0) {
        const usageLogs = processedItems.map((item) => ({
          user: new mongoose.Types.ObjectId(user_id),
          user_wallet: new mongoose.Types.ObjectId(userWalletId),
          email: userEmail,
          usage_key,
          feature_endpoint: new mongoose.Types.ObjectId(endpointId),
          credits_transaction: transactionId,
          ...item.mapping,
        }));

        // Perform bulk insertion using the model directly to optimize performance
        const [{ CreditsUsage }] = await Promise.all([
          import('../credits-usage/credits-usage.model'),
        ]);
        await CreditsUsage.insertMany(usageLogs, { session });
      }

      if (isInternalSession) {
        await session.commitTransaction();
      }
    } catch (dbError) {
      if (isInternalSession && session.inTransaction()) {
        await session.abortTransaction();
      }
      throw dbError;
    } finally {
      if (isInternalSession) {
        session.endSession();
      }
    }

    // 5. Real-time Synchronization (Non-blocking)
    if (!options.skipEmit) {
      try {
        emitToUser(String(user_id), 'wallet:credits-updated', {
          credits: updatedCredits,
          cost_credits: totalAggregatedCredits,
          timestamp: new Date().toISOString(),
        });
      } catch (socketError) {
        console.error('[Credits Process] Socket Sync Failed:', socketError);
      }
    }

    endTimer({ status: 'success' });
    creditsProcessTotal.inc({
      method: 'executeCreditsProcessEnd',
      status: 'success',
    });

    return {
      user_id,
      usage_key,
      credits: updatedCredits,
      status: 'returnable',
      message: 'Multi-model credits processed successfully',
      details: processedItems.map((item) => item.mapping),
    };
  } catch (error: any) {
    console.error('[Credits Process Worker] Error:', error);

    endTimer({ status: 'error' });
    creditsProcessErrors.inc({
      method: 'executeCreditsProcessEnd',
      error_type: error.name || 'Error',
    });

    // Rethrow execution errors so batch consumer knows it failed
    throw error;
  }
};

/**
 * Optimized batch calculation for usage
 */
const getFeatureUsageInfo = async (
  usages: {
    input_tokens?: number;
    output_tokens?: number;
    ai_model?: string;
  }[],
) => {
  // 1. Fetch Configuration (Dynamic imports)
  const [{ getInitialBillingSetting }, { getAiModelsByValuesOrInitial }] =
    await Promise.all([
      import('../billing-setting/billing-setting.service'),
      import('../ai-model/ai-model.service'),
    ]);

  // 2. Aggregate unique model values
  const uniqueModelValues = [
    ...new Set(usages.map((u) => u.ai_model).filter(Boolean)),
  ] as string[];

  // 3. Fetch all required data in parallel (one call each)
  const [billingSetting, aiModels] = await Promise.all([
    getInitialBillingSetting(),
    getAiModelsByValuesOrInitial(uniqueModelValues),
  ]);

  const credit_price = billingSetting?.credit_price || DEFAULT_CREDIT_PRICE;
  const initialAiModel = aiModels.find((m) => m.is_initial);

  // 4. Map each usage item to its cost info in-memory (OPTIMIZED with Map)
  const modelMap = new Map(aiModels.map((m) => [m.value, m]));

  return usages.map((usage) => {
    const input_token = usage.input_tokens || 0;
    const output_token = usage.output_tokens || 0;
    const foundModel = usage.ai_model
      ? modelMap.get(usage.ai_model)
      : undefined;
    const modelData = foundModel || initialAiModel;

    if (!foundModel && usage.ai_model) {
      console.warn(
        `[Credits Process] AI Model "${usage.ai_model}" not found. Falling back to ${initialAiModel ? 'initial model' : 'system defaults'}.`,
      );
    }

    const input_token_price =
      modelData?.input_token_price ?? DEFAULT_INPUT_TOKEN_PRICE;
    const output_token_price =
      modelData?.output_token_price ?? DEFAULT_OUTPUT_TOKEN_PRICE;

    // Calculations using utility
    const costs = CreditsProcessUtils.calculateTokenCosts(
      input_token,
      output_token,
      input_token_price,
      output_token_price,
      credit_price,
    );

    return {
      ...costs,
      credit_price,
      ai_model: usage.ai_model,
      input_tokens: input_token,
      output_tokens: output_token,
      input_token_price,
      output_token_price,
    };
  });
};
