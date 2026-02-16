import crypto from 'crypto';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/AppError';
import { emitToUser } from '../../socket';
import * as CreditsProfitServices from '../credits-profit/credits-profit.service';
import * as CreditsTransactionServices from '../credits-transaction/credits-transaction.service';
import * as FeatureEndpointServices from '../feature-endpoint/feature-endpoint.service';
import * as PackageFeatureConfigServices from '../package-feature-config/package-feature-config.service';
import * as PackageServices from '../package/package.service';
import * as UserWalletServices from '../user-wallet/user-wallet.service';
import {
  TCreditsProcessEndMultimodelPayload,
  TCreditsProcessEndResponse,
  TCreditsProcessStartPayload,
  TCreditsProcessStartResponse,
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
 * Clear cached billing and AI model configurations
 */
export const clearCreditsProcessCache = async (
  type: 'billing' | 'ai-model',
  idOrValue?: string,
) => {
  const { invalidateCache } = await import('../../utils/cache.utils');
  if (type === 'billing') {
    await invalidateCache('billing-setting:initial');
  } else if (type === 'ai-model') {
    if (idOrValue) {
      await invalidateCache([`ai-model:${idOrValue}`, 'ai-model:initial']);
    } else {
      const { invalidateCacheByPattern } =
        await import('../../utils/cache.utils');
      await invalidateCacheByPattern('ai-model:*');
    }
  }
};

/**
 * Check if a user has access to a feature endpoint based on their wallet and package
 */
export const creditsProcessStart = async (
  payload: TCreditsProcessStartPayload,
): Promise<TCreditsProcessStartResponse> => {
  const { user_id, user_email, feature_endpoint_id, feature_endpoint_value } =
    payload;

  const usage_key = crypto.randomUUID();

  try {
    // 1. Fetch frequently changing user wallet data directly from DB & frequently accessed endpoint from cache
    // We fetch them in parallel to minimize latency during the "start" phase
    const [freshWallet, featureEndpoint] = await Promise.all([
      UserWalletServices.getFreshWallet(user_id),
      FeatureEndpointServices.getPublicFeatureEndpointByIdOrValue({
        _id: feature_endpoint_id,
        value: feature_endpoint_value,
      }),
    ]);

    // Validate feature endpoint existence and status
    if (!featureEndpoint) {
      return {
        user_id,
        credits: 0,
        status: 'not-accessible',
        message: 'Feature endpoint not found',
      };
    }

    if (!featureEndpoint.is_active) {
      return {
        user_id,
        credits: 0,
        status: 'not-accessible',
        message: 'Feature endpoint is currently inactive',
      };
    }

    let userCredits = 0;
    let packageFeatures: any[] = [];

    // 2. Handle wallet initialization or retrieval
    if (!freshWallet) {
      // If user has no wallet, create it on-the-fly to allow initial credits/usage if configured
      try {
        const newWallet = await UserWalletServices.createUserWallet({
          user: new mongoose.Types.ObjectId(user_id),
          email: user_email,
          credits: 0,
          type: 'free',
        });
        userCredits = newWallet.credits || 0;
      } catch (walletError: any) {
        // Handle potential race conditions or DB errors during wallet creation
        return {
          user_id,
          credits: 0,
          status: 'not-accessible',
          message: `Failed to initialize user wallet: ${walletError.message || 'Unknown error'}`,
        };
      }
    } else {
      userCredits = freshWallet.credits || 0;

      // 3. Load package features from cache (to check permissions)
      if (freshWallet.package) {
        packageFeatures = await PackageServices.getPackageFeatures(
          freshWallet.package.toString(),
        );
      }
    }

    // 4. Validate package-restricted features
    // If a user has a package, we check if the requested feature is explicitly included
    let effectiveConfig: any = null;
    if (freshWallet?.package && packageFeatures.length > 0) {
      const featureEndpointFeatureId =
        (featureEndpoint.feature as any)?._id?.toString() ||
        featureEndpoint.feature?.toString();

      if (featureEndpointFeatureId) {
        const hasFeatureInPackage = packageFeatures.some((feature: any) => {
          // Normalize feature ID (could be a string, an ObjectId, or a populated object)
          const featureId =
            typeof feature === 'string'
              ? feature
              : (feature?._id || feature)?.toString();
          return featureId === featureEndpointFeatureId;
        });

        if (!hasFeatureInPackage) {
          return {
            user_id,
            credits: userCredits,
            status: 'not-accessible',
            message: 'Your current package does not include this feature.',
          };
        }

        // 4.1 Fetch package-specific configuration if accessible
        effectiveConfig = await PackageFeatureConfigServices.getEffectiveConfig(
          freshWallet.package.toString(),
          featureEndpointFeatureId,
          featureEndpoint._id!.toString(),
        );
      }
    }

    // 5. Final credit balance check
    // We check if the user has at least the base credits required for the endpoint
    // Fallback order: Config min_credits -> Endpoint min_credits
    const minimumCredits =
      effectiveConfig?.min_credits ?? featureEndpoint.min_credits ?? 0;
    const hasAccess = userCredits >= minimumCredits;

    return {
      user_id,
      usage_key,
      credits: userCredits,
      status: hasAccess ? 'accessible' : 'not-accessible',
      message: hasAccess
        ? 'Access granted'
        : `Insufficient credits. Required: ${minimumCredits}, Available: ${userCredits}`,
      config: effectiveConfig,
    };
  } catch (error: any) {
    // Global catch for internal service errors to prevent API crashes
    return {
      user_id,
      credits: 0,
      status: 'not-accessible',
      message: error.message || 'Credits process start failed',
    };
  }
};

/**
 * Deduct credits from user wallet after AI feature usage
 */
export const creditsProcessEnd = async (
  payload: TCreditsProcessEndMultimodelPayload,
): Promise<TCreditsProcessEndResponse> => {
  const {
    user_id,
    feature_endpoint_id,
    feature_endpoint_value,
    usage_key,
    usages = [],
  } = payload;

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
  const session = await mongoose.startSession();
  session.startTransaction();

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
    const updatedCredits = updatedWallet.credits || 0;

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

    await session.commitTransaction();

    // 5. Real-time Synchronization (Non-blocking)
    try {
      emitToUser(String(user_id), 'wallet:credits-updated', {
        credits: updatedCredits,
        cost_credits: totalAggregatedCredits,
        timestamp: new Date().toISOString(),
      });
    } catch (socketError) {
      console.error('[Credits Process] Socket Sync Failed:', socketError);
    }

    return {
      user_id,
      usage_key,
      credits: updatedCredits,
      status: 'returnable',
      message: 'Multi-model credits processed successfully',
      details: processedItems.map((item) => item.mapping),
    };
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error('[Credits Process Multimodel End] Error:', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Credits process failed: ${error.message || 'Unknown error'}`,
    );
  } finally {
    session.endSession();
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

  // 4. Map each usage item to its cost info in-memory
  return usages.map((usage) => {
    const input_token = usage.input_tokens || 0;
    const output_token = usage.output_tokens || 0;

    // Find specific model or fallback to initial
    const foundModel = aiModels.find((m) => m.value === usage.ai_model);
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
