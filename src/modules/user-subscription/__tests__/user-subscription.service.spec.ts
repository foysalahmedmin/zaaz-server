import * as UserSubscriptionRepository from '../user-subscription.repository';
import * as UserSubscriptionService from '../user-subscription.service';

jest.mock('../user-subscription.repository');

describe('User Subscription Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveSubscription', () => {
    it('should return the active subscription for a user', async () => {
      const mockSub = { _id: 'sub-1', status: 'active', user: 'user-1' };
      (UserSubscriptionRepository.findActiveSubscription as jest.Mock).mockResolvedValue(mockSub);

      const result = await UserSubscriptionService.getActiveSubscription('user-1');

      expect(result).toEqual(mockSub);
      expect(UserSubscriptionRepository.findActiveSubscription).toHaveBeenCalledWith('user-1');
    });

    it('should return null if no active subscription exists', async () => {
      (UserSubscriptionRepository.findActiveSubscription as jest.Mock).mockResolvedValue(null);

      const result = await UserSubscriptionService.getActiveSubscription('user-1');

      expect(result).toBeNull();
    });
  });

  describe('createSubscription', () => {
    it('should update previous subscriptions and create a new one', async () => {
      const mockPayload = { user: 'user-1', package: 'pkg-1', status: 'active' };
      const mockNewSub = { _id: 'sub-2', ...mockPayload };

      (UserSubscriptionRepository.updateManyStatuses as jest.Mock).mockResolvedValue(undefined);
      (UserSubscriptionRepository.create as jest.Mock).mockResolvedValue(mockNewSub);

      const result = await UserSubscriptionService.createSubscription(mockPayload);

      expect(UserSubscriptionRepository.updateManyStatuses).toHaveBeenCalledWith(
        'user-1',
        'active',
        'canceled',
        undefined
      );
      expect(UserSubscriptionRepository.create).toHaveBeenCalledWith(mockPayload, undefined);
      expect(result).toEqual(mockNewSub);
    });
  });
});
