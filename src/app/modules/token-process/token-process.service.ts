import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../builder/AppError';
import { FeatureEndpoint } from '../feature-endpoint/feature-endpoint.model';
import { TokenProfit } from '../token-profit/token-profit.model';
import { TokenTransaction } from '../token-transaction/token-transaction.model';
import { UserWallet } from '../user-wallet/user-wallet.model';
import {
  TTokenProcessEndPayload,
  TTokenProcessStartPayload,
} from './token-process.type';

export const tokenProcessStart = async (payload: TTokenProcessStartPayload) => {
  const { user_id, feature_endpoint_id } = payload;

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
          as: 'packageData',
        },
      },
      {
        $unwind: {
          path: '$packageData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          token: 1,
          'packageData.features': 1,
        },
      },
    ]),
    // Get feature endpoint with only needed fields
    FeatureEndpoint.findById(feature_endpoint_id)
      .select('feature token is_active')
      .lean(),
  ]);

  // Validate wallet exists
  if (!walletResult || walletResult.length === 0 || !walletResult[0]) {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet not found');
  }

  const wallet = walletResult[0];
  const userToken = wallet.token || 0;
  const packageFeatures = wallet.packageData?.features || [];

  // Validate feature endpoint exists and is active
  if (!featureEndpoint) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feature endpoint not found');
  }

  if (!featureEndpoint.is_active) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Feature endpoint is not active',
    );
  }

  // Validate package features: Check if feature_endpoint's feature_id exists in user's package features
  if (packageFeatures.length > 0) {
    const featureEndpointFeatureId = featureEndpoint.feature.toString();
    const hasFeatureInPackage = packageFeatures.some(
      (feature: any) =>
        (typeof feature === 'string'
          ? feature
          : feature._id?.toString() || feature.toString()) ===
        featureEndpointFeatureId,
    );

    if (!hasFeatureInPackage) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Feature endpoint is not available in your package',
      );
    }
  } else {
    throw new AppError(httpStatus.NOT_FOUND, 'User wallet package not found');
  }

  // Validate user token >= minimum token (feature endpoint token)
  const minimumToken = featureEndpoint.token || 0;
  const hasAccess = userToken >= minimumToken;

  return {
    user_id,
    user_token: userToken,
    status: hasAccess ? 'access-able' : 'not-access-able',
  };
};

export const tokenProcessEnd = async (payload: TTokenProcessEndPayload) => {
  const { user_id, feature_endpoint_id, cost: process_cost } = payload;

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

  // Calculate final cost: token_cost + (token_cost * totalPercentage / 100)
  const finalTokenCost = Math.ceil(
    process_cost + (process_cost * totalPercentage) / 100,
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
          amount: finalTokenCost,
          decrease_source: new mongoose.Types.ObjectId(feature_endpoint_id),
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return {
      user: user_id,
      status: 'return-able',
      token: updatedToken,
      cost: finalTokenCost,
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
