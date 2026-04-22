jest.mock('../dashboard.repository', () => ({
  getRevenueByMonth: jest.fn(),
  countUsers: jest.fn(),
  countPaymentTransactions: jest.fn(),
  getTotalCredits: jest.fn(),
  getCreditsIncreaseByMonth: jest.fn(),
  getRevenueByPeriod: jest.fn(),
  getTransactionStatusBreakdown: jest.fn(),
  getTransactionTotal: jest.fn(),
  getPaymentMethodBreakdown: jest.fn(),
  getCreditsFlowByPeriod: jest.fn(),
  getUserGrowthByPeriod: jest.fn(),
  getPackagePerformance: jest.fn(),
  getFeaturePerformance: jest.fn(),
}));
jest.mock('../../../utils/cache.utils', () => ({
  withCache: jest.fn().mockImplementation((_key: any, _ttl: any, fn: any) => fn()),
}));

import * as DashboardRepository from '../dashboard.repository';
import * as DashboardService from '../dashboard.service';

describe('Dashboard Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getDashboardStatistics', () => {
    it('should return dashboard statistics', async () => {
      (DashboardRepository.getRevenueByMonth as jest.Mock).mockResolvedValue([
        { _id: 'USD', total: 1000 },
        { _id: 'BDT', total: 11000 },
      ]);
      (DashboardRepository.countUsers as jest.Mock).mockResolvedValue(50);
      (DashboardRepository.countPaymentTransactions as jest.Mock).mockResolvedValue(20);
      (DashboardRepository.getTotalCredits as jest.Mock).mockResolvedValue(5000);
      (DashboardRepository.getCreditsIncreaseByMonth as jest.Mock).mockResolvedValue(500);

      const result = await DashboardService.getDashboardStatistics();

      expect(result).toHaveProperty('total_revenue');
      expect(result).toHaveProperty('total_users');
      expect(result).toHaveProperty('total_transactions');
      expect(result).toHaveProperty('total_credits');
      expect(result).toHaveProperty('trends');
      expect(result.total_revenue.USD).toBe(1000);
    });
  });

  describe('getDashboardRevenue', () => {
    it('should return revenue data for period', async () => {
      (DashboardRepository.getRevenueByPeriod as jest.Mock).mockResolvedValue([
        {
          _id: '2026-04-01',
          amounts: [
            { currency: 'USD', amount: 500 },
            { currency: 'BDT', amount: 2000 },
          ],
        },
      ]);

      const result = await DashboardService.getDashboardRevenue('30d');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ date: '2026-04-01', USD: 500, BDT: 2000 });
    });
  });

  describe('getDashboardUserGrowth', () => {
    it('should return user growth data', async () => {
      (DashboardRepository.getUserGrowthByPeriod as jest.Mock).mockResolvedValue([
        { _id: '2026-04-01', count: 5 },
        { _id: '2026-04-02', count: 8 },
      ]);

      const result = await DashboardService.getDashboardUserGrowth('7d');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ date: '2026-04-01', count: 5 });
    });
  });

  describe('getDashboardFeatures', () => {
    it('should return feature performance data', async () => {
      (DashboardRepository.getFeaturePerformance as jest.Mock).mockResolvedValue([
        { feature_name: 'AI Generator', usage_count: 100, total_credits_used: 500 },
      ]);

      const result = await DashboardService.getDashboardFeatures();
      expect(result).toHaveLength(1);
      expect(result[0].feature_name).toBe('AI Generator');
    });
  });
});
