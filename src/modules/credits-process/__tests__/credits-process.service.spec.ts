jest.mock('../../user-wallet/user-wallet.service', () => ({
  getFreshWallet: jest.fn(),
  createUserWallet: jest.fn(),
}));
jest.mock('../../feature-endpoint/feature-endpoint.service', () => ({
  getPublicFeatureEndpointByIdOrValue: jest.fn(),
}));
jest.mock('../../user-subscription/user-subscription.service', () => ({
  getActiveSubscription: jest.fn(),
}));
jest.mock('../../package-feature-config/package-feature-config.service', () => ({
  getEffectiveConfig: jest.fn(),
}));
jest.mock('../../package/package.model', () => ({
  Package: {
    findOne: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    }),
  },
}));
jest.mock('../credits-process.metrics', () => ({
  creditsProcessDuration: { startTimer: jest.fn().mockReturnValue(jest.fn()) },
  creditsProcessErrors: { inc: jest.fn() },
  creditsProcessTotal: { inc: jest.fn() },
}));
jest.mock('../credits-process-batch.service', () => ({
  batchAggregator: { addToBatch: jest.fn().mockResolvedValue(undefined) },
}));

import * as UserWalletServices from '../../user-wallet/user-wallet.service';
import * as FeatureEndpointServices from '../../feature-endpoint/feature-endpoint.service';
import * as UserSubscriptionServices from '../../user-subscription/user-subscription.service';
import * as PackageFeatureConfigServices from '../../package-feature-config/package-feature-config.service';
import { batchAggregator } from '../credits-process-batch.service';
import { creditsProcessStart, creditsProcessEnd } from '../credits-process.service';

const USER_ID = '507f1f77bcf86cd799439001';
const FEATURE_ENDPOINT_ID = '507f1f77bcf86cd799439011';
const FEATURE_ID = '507f1f77bcf86cd799439012';

const mockFeatureEndpoint = (overrides: any = {}) => ({
  _id: FEATURE_ENDPOINT_ID,
  is_active: true,
  min_credits: 10,
  feature: { _id: FEATURE_ID, toString: () => FEATURE_ID },
  ...overrides,
});

describe('CreditsProcess Service', () => {
  beforeEach(() => jest.clearAllMocks());

  // ------------------------------------------------------------------ //
  describe('creditsProcessStart', () => {
    const basePayload = {
      user_id: USER_ID,
      user_email: 'user@test.com',
      feature_endpoint_id: FEATURE_ENDPOINT_ID,
    };

    it('should return not-accessible if feature endpoint not found', async () => {
      (FeatureEndpointServices.getPublicFeatureEndpointByIdOrValue as jest.Mock).mockResolvedValue(null);
      (UserWalletServices.getFreshWallet as jest.Mock).mockResolvedValue({ credits: 100 });
      (UserSubscriptionServices.getActiveSubscription as jest.Mock).mockResolvedValue(null);

      const result = await creditsProcessStart(basePayload);

      expect(result.status).toBe('not-accessible');
      expect(result.message).toBe('Feature endpoint not found');
    });

    it('should return not-accessible if feature endpoint is inactive', async () => {
      (FeatureEndpointServices.getPublicFeatureEndpointByIdOrValue as jest.Mock).mockResolvedValue(
        mockFeatureEndpoint({ is_active: false }),
      );
      (UserWalletServices.getFreshWallet as jest.Mock).mockResolvedValue({ credits: 100 });
      (UserSubscriptionServices.getActiveSubscription as jest.Mock).mockResolvedValue(null);

      const result = await creditsProcessStart(basePayload);

      expect(result.status).toBe('not-accessible');
      expect(result.message).toBe('Feature endpoint is currently inactive');
    });

    it('should return not-accessible if user has insufficient credits', async () => {
      (FeatureEndpointServices.getPublicFeatureEndpointByIdOrValue as jest.Mock).mockResolvedValue(
        mockFeatureEndpoint({ min_credits: 50 }),
      );
      (UserWalletServices.getFreshWallet as jest.Mock).mockResolvedValue({ credits: 10 });
      (UserSubscriptionServices.getActiveSubscription as jest.Mock).mockResolvedValue(null);

      const result = await creditsProcessStart(basePayload);

      expect(result.status).toBe('not-accessible');
      expect(result.message).toContain('Insufficient credits');
      expect(result.credits).toBe(10);
    });

    it('should return accessible when user has enough credits', async () => {
      (FeatureEndpointServices.getPublicFeatureEndpointByIdOrValue as jest.Mock).mockResolvedValue(
        mockFeatureEndpoint({ min_credits: 10 }),
      );
      (UserWalletServices.getFreshWallet as jest.Mock).mockResolvedValue({ credits: 100 });
      (UserSubscriptionServices.getActiveSubscription as jest.Mock).mockResolvedValue(null);

      const result = await creditsProcessStart(basePayload);

      expect(result.status).toBe('accessible');
      expect(result.message).toBe('Access granted');
      expect(result.credits).toBe(100);
      expect(result.usage_key).toBeDefined();
    });

    it('should return not-accessible if feature not in subscription package', async () => {
      const otherFeatureId = '507f1f77bcf86cd799439099';
      (FeatureEndpointServices.getPublicFeatureEndpointByIdOrValue as jest.Mock).mockResolvedValue(
        mockFeatureEndpoint(),
      );
      (UserWalletServices.getFreshWallet as jest.Mock).mockResolvedValue({ credits: 100 });
      (UserSubscriptionServices.getActiveSubscription as jest.Mock).mockResolvedValue({
        package: 'pkg-1',
        package_snapshot: {
          features: [{ _id: otherFeatureId, toString: () => otherFeatureId }],
        },
      });

      const result = await creditsProcessStart(basePayload);

      expect(result.status).toBe('not-accessible');
      expect(result.message).toContain('subscription does not include this feature');
    });

    it('should create wallet on-the-fly if user has no wallet', async () => {
      (FeatureEndpointServices.getPublicFeatureEndpointByIdOrValue as jest.Mock).mockResolvedValue(
        mockFeatureEndpoint({ min_credits: 0 }),
      );
      (UserWalletServices.getFreshWallet as jest.Mock).mockResolvedValue(null);
      (UserSubscriptionServices.getActiveSubscription as jest.Mock).mockResolvedValue(null);
      (UserWalletServices.createUserWallet as jest.Mock).mockResolvedValue({ credits: 0 });

      const result = await creditsProcessStart(basePayload);

      expect(UserWalletServices.createUserWallet).toHaveBeenCalled();
      expect(result.status).toBe('accessible');
    });

    it('should return not-accessible if wallet creation fails', async () => {
      (FeatureEndpointServices.getPublicFeatureEndpointByIdOrValue as jest.Mock).mockResolvedValue(
        mockFeatureEndpoint(),
      );
      (UserWalletServices.getFreshWallet as jest.Mock).mockResolvedValue(null);
      (UserSubscriptionServices.getActiveSubscription as jest.Mock).mockResolvedValue(null);
      (UserWalletServices.createUserWallet as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await creditsProcessStart(basePayload);

      expect(result.status).toBe('not-accessible');
      expect(result.message).toContain('Failed to initialize user wallet');
    });

    it('should use effective config min_credits over endpoint min_credits', async () => {
      (FeatureEndpointServices.getPublicFeatureEndpointByIdOrValue as jest.Mock).mockResolvedValue(
        mockFeatureEndpoint({ min_credits: 5 }),
      );
      (UserWalletServices.getFreshWallet as jest.Mock).mockResolvedValue({ credits: 8 });
      (UserSubscriptionServices.getActiveSubscription as jest.Mock).mockResolvedValue({
        package: '507f1f77bcf86cd799439030',
        package_snapshot: {
          features: [{ _id: FEATURE_ID, toString: () => FEATURE_ID }],
        },
      });
      (PackageFeatureConfigServices.getEffectiveConfig as jest.Mock).mockResolvedValue({
        min_credits: 20,
      });

      const result = await creditsProcessStart(basePayload);

      expect(result.status).toBe('not-accessible');
      expect(result.message).toContain('Required: 20');
    });
  });

  // ------------------------------------------------------------------ //
  describe('creditsProcessEnd', () => {
    const basePayload = {
      user_id: USER_ID,
      usage_key: 'key-abc',
      model_id: 'gpt-4',
      input_tokens: 100,
      output_tokens: 50,
      feature_endpoint_id: FEATURE_ENDPOINT_ID,
    } as any;

    it('should queue payload and return processing status', async () => {
      const result = await creditsProcessEnd(basePayload);

      expect(batchAggregator.addToBatch).toHaveBeenCalledWith(basePayload);
      expect(result.status).toBe('processing');
      expect(result.message).toBe('Credits processing queued successfully');
      expect(result.user_id).toBe(USER_ID);
      expect(result.usage_key).toBe('key-abc');
    });

    it('should throw INTERNAL_SERVER_ERROR if batch aggregator fails', async () => {
      (batchAggregator.addToBatch as jest.Mock).mockRejectedValue(new Error('Queue full'));

      await expect(creditsProcessEnd(basePayload)).rejects.toThrow('Credits process failed: Queue full');
    });
  });
});
