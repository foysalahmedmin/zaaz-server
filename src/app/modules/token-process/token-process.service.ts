import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/app-error';
import { FeatureEndpoint } from '../feature-endpoint/feature-endpoint.model';
import { TokenProfit } from '../token-profit/token-profit.model';
import { TokenTransaction } from '../token-transaction/token-transaction.model';
import { UserWallet } from '../user-wallet/user-wallet.model';
import {
  TTokenProcessEndPayload,
  TTokenProcessStartPayload,
} from './token-process.type';

// gemini token ratio is 1:4 [input token: output token];
const TOKEN_RATIO = '1:4';

export const tokenProcessStart = async (payload: TTokenProcessStartPayload) => {
  const { user_id, feature_endpoint_id } = payload;

  try {
    // Fetch user wallet with package features and feature endpoint in parallel using aggregation
    const [walletResult, featureEndpoint] = await Promise.all([
      // Aggregation to get only needed fields: token and package features
      UserWallet.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(user_id),
            is_deleted: { $ne: true },
            $or: [
              { expires_at: { $exists: false } },
              { expires_at: { $gte: new Date() } },
            ],
          },
        },
        {
          $lookup: {
            from: 'packages',
            localField: 'package',
            foreignField: '_id',
            as: 'package_data',
          },
        },
        {
          $unwind: {
            path: '$package_data',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            token: 1,
            'package_data.features': 1,
            package: 1,
          },
        },
      ]),
      // Get feature endpoint with only needed fields
      FeatureEndpoint.findById(feature_endpoint_id)
        .select('feature token is_active')
        .lean(),
    ]);

    // Validate feature endpoint exists
    if (!featureEndpoint) {
      return {
        user_id,
        token: 0,
        status: 'not-accessible',
        message: 'Feature endpoint not found',
      };
    }

    // Validate feature endpoint is active
    if (!featureEndpoint.is_active) {
      return {
        user_id,
        token: 0,
        status: 'not-accessible',
        message: 'Feature endpoint is not active',
      };
    }

    let wallet: any;
    let userToken = 0;
    let packageFeatures: any[] = [];

    // If wallet doesn't exist, create a new one
    if (!walletResult || walletResult.length === 0 || !walletResult[0]) {
      try {
        // Create new wallet for user with default token (0)
        await UserWallet.create({
          user: new mongoose.Types.ObjectId(user_id),
          token: 0,
          // package is optional, so we don't set it
        });
        wallet = {
          token: 0,
          package: null,
          package_data: null,
        };
        packageFeatures = [];
      } catch (walletError: any) {
        // If wallet creation fails, return error response instead of throwing
        return {
          user_id,
          token: 0,
          status: 'not-accessible',
          message: `Failed to create wallet: ${walletError.message || 'Unknown error'}`,
        };
      }
    } else {
      wallet = walletResult[0];
      packageFeatures = wallet.package_data?.features || [];
    }

    // Get user token from wallet
    userToken = wallet.token || 0;

    // If wallet has a package, validate package features
    if (wallet.package && packageFeatures.length > 0) {
      const featureEndpointFeatureId = featureEndpoint.feature.toString();
      const hasFeatureInPackage = packageFeatures.some(
        (feature: any) =>
          (typeof feature === 'string'
            ? feature
            : feature._id?.toString() || feature.toString()) ===
          featureEndpointFeatureId,
      );

      if (!hasFeatureInPackage) {
        return {
          user_id,
          token: userToken,
          status: 'not-accessible',
          message: 'Feature endpoint is not available in your package',
        };
      }
    }

    // Validate user token >= minimum token (feature endpoint token)
    const minimumToken = featureEndpoint.token || 0;
    const hasAccess = userToken >= minimumToken;

    return {
      user_id,
      token: userToken,
      status: hasAccess ? 'accessible' : 'not-accessible',
      message: hasAccess
        ? undefined
        : `Insufficient tokens. Required: ${minimumToken}, Available: ${userToken}`,
    };
  } catch (error: any) {
    // Catch any unexpected errors and return a response instead of throwing
    return {
      user_id,
      token: 0,
      status: 'not-accessible',
      message: `Token process start failed: ${error.message || 'Unknown error'}`,
    };
  }
};

export const tokenProcessEnd = async (payload: TTokenProcessEndPayload) => {
  const { user_id, feature_endpoint_id, input_token, output_token } = payload;

  // Parse token ratio (1:4 means 1 input token = 4 output tokens)
  const [inputRatio, outputRatio] = TOKEN_RATIO.split(':').map(Number);
  const ratioValue = outputRatio / inputRatio; // 4 / 1 = 4

  // Calculate base cost from output tokens using ratio
  // Since ratio is 1:4 (input:output), to produce output_token, we need output_token/4 input tokens
  // We use output_token to calculate the equivalent input tokens needed based on the ratio
  // Cost = output_token / ratio (this gives equivalent input tokens needed)
  const baseCost = Math.ceil(output_token / ratioValue);

  // Validate ratio consistency (optional check for data integrity)
  // Expected input based on output: output_token / ratioValue
  // Actual input_token should match or be close to this value
  const expectedInput = output_token / ratioValue;
  if (Math.abs(input_token - expectedInput) > 1) {
    // Log warning if input_token doesn't match expected ratio (for debugging)
    console.warn(
      `Token ratio mismatch: input_token=${input_token}, expected=${expectedInput.toFixed(2)}, output_token=${output_token}`,
    );
  }

  // Use aggregation to calculate total percentage directly in database (faster)
  const totalPercentageResult = await TokenProfit.aggregate([
    {
      $match: {
        is_active: true,
        is_deleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: null,
        totalPercentage: { $sum: '$percentage' },
      },
    },
  ]);

  const totalPercentage =
    totalPercentageResult.length > 0
      ? totalPercentageResult[0].totalPercentage || 0
      : 0;

  // Calculate final cost: base_cost + (base_cost * totalPercentage / 100)
  const finalTokenCost = Math.ceil(
    baseCost + (baseCost * totalPercentage) / 100,
  );

  // Create token transaction and update wallet in a transaction
  // Note: We allow negative token balance for adjustment during next package purchase
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find and update wallet in one operation (returns updated document)
    const updatedWallet = await UserWallet.findOneAndUpdate(
      { user: user_id },
      { $inc: { token: -finalTokenCost } },
      { session, new: true, lean: true },
    );

    if (!updatedWallet) {
      throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
    }

    const userWalletId = updatedWallet._id.toString();
    const updatedToken = updatedWallet.token || 0;

    // Create token transaction (decrease) - directly without validation
    await TokenTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(user_id),
          user_wallet: new mongoose.Types.ObjectId(userWalletId),
          type: 'decrease',
          token: finalTokenCost,
          decrease_source: new mongoose.Types.ObjectId(feature_endpoint_id),
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return {
      user_id: user_id,
      token: updatedToken,
      cost: finalTokenCost,
      status: 'returnable',
    };
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Token process end failed: ${error.message || 'Unknown error'}`,
    );
  } finally {
    session.endSession();
  }
};
