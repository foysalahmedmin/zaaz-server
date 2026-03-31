import crypto from 'crypto';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import * as FeatureEndpointServices from '../feature-endpoint/feature-endpoint.service';
import * as PackageFeatureConfigServices from '../package-feature-config/package-feature-config.service';
import * as UserWalletServices from '../user-wallet/user-wallet.service';
import * as UserSubscriptionServices from '../user-subscription/user-subscription.service';
import {
  creditsProcessDuration,
  creditsProcessErrors,
  creditsProcessTotal,
} from './credits-process.metrics';
import {
  TCreditsProcessEndMultimodelPayload,
  TCreditsProcesresponseFormatter,
  TCreditsProcessStartPayload,
  TCreditsProcessStartResponse,
} from './credits-process.type';

// Constants & Configuration
// Constants & Configuration
// Removed unused constants - moved to worker

/**
 * Clear cached billing and AI model configurations
 */
export const clearCreditsProcessCache = async (
  type: 'billing' | 'ai-model',
  idOrValue?: string,
) => {
  if (type === 'billing') {
    const { invalidateCache } = await import('../../utils/cache.utils');
    await invalidateCache('billing-setting:initial');
  } else if (type === 'ai-model') {
    if (idOrValue) {
      const { invalidateCache } = await import('../../utils/cache.utils');
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
    const [freshWallet, featureEndpoint, activeSubscription] = await Promise.all([
      UserWalletServices.getFreshWallet(user_id),
      FeatureEndpointServices.getPublicFeatureEndpointByIdOrValue({
        _id: feature_endpoint_id,
        value: feature_endpoint_value,
      }),
      UserSubscriptionServices.getActiveSubscription(user_id)
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

      // 3. Load package features from active subscription (to check permissions)
      if (activeSubscription?.package_snapshot) {
        // The package_snapshot (PackageHistory) already embeds its features array
        packageFeatures = (activeSubscription.package_snapshot as any).features || [];
      } else {
        // FALLBACK: If no active subscription, try loading features from the "Initial" package
        const { Package } = await import('../package/package.model');
        const initialPackage = (await Package.findOne({ is_initial: true, is_active: true, is_deleted: { $ne: true } }).populate('features').lean()) as any;
        if (initialPackage) {
           packageFeatures = initialPackage.features || [];
        }
      }
    }

    // 4. Validate package-restricted features
    // If a user has a subscription, we check if the requested feature is explicitly included
    let effectiveConfig: any = null;
    if (activeSubscription && packageFeatures.length > 0) {
      const featureEndpointFeatureId =
        (featureEndpoint.feature as any)?._id?.toString() ||
        featureEndpoint.feature?.toString();

      if (featureEndpointFeatureId) {
        const hasFeatureInPackage = packageFeatures.some((feature: any) => {
          // In packageHistory, features are embedded objects with _id referring to the Feature
          const featureId = typeof feature === 'string'
              ? feature
              : (feature?.feature || feature?._id || feature)?.toString();
          return featureId === featureEndpointFeatureId;
        });

        if (!hasFeatureInPackage) {
          return {
            user_id,
            credits: userCredits,
            status: 'not-accessible',
            message: 'Your current subscription does not include this feature.',
          };
        }

        // 4.1 Fetch package-specific configuration if accessible
        effectiveConfig = await PackageFeatureConfigServices.getEffectiveConfig(
          activeSubscription.package?.toString() || '', // Configs are normally mapped to the root package
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
 * Uses batch processing for high throughput
 */
export const creditsProcessEnd = async (
  payload: TCreditsProcessEndMultimodelPayload,
): Promise<TCreditsProcesresponseFormatter> => {
  const { user_id, usage_key } = payload;

  // Start metrics timer
  const endTimer = creditsProcessDuration.startTimer({
    method: 'creditsProcessEnd',
    mode: 'async',
  });
  creditsProcessTotal.inc({ method: 'creditsProcessEnd', status: 'attempt' });

  try {
    // Dynamically import batch aggregator to avoid circular dependency
    const { batchAggregator } = await import('./credits-process-batch.service');
    await batchAggregator.addToBatch(payload);

    endTimer({ status: 'success' });
    creditsProcessTotal.inc({ method: 'creditsProcessEnd', status: 'success' });

    return {
      user_id,
      usage_key,
      credits: 0, // Will be updated asynchronously
      status: 'processing',
      message: 'Credits processing queued successfully',
    };
  } catch (error: any) {
    endTimer({ status: 'error' });
    creditsProcessErrors.inc({
      method: 'creditsProcessEnd',
      error_type: error.name || 'Error',
    });
    console.error('[Credits Process End] Batch Error:', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Credits process failed: ${error.message || 'Unknown error'}`,
    );
  }
};



