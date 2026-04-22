import request from 'supertest';
import app from '../../../app';
import * as FeatureFeedbackService from '../feature-feedback.service';
import httpStatus from 'http-status';

jest.mock('../feature-feedback.service');

jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('FeatureFeedback Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/feature-feedbacks', () => {
    it('should return 200 and a list of feedbacks', async () => {
      const mock = {
        data: [{ _id: 'feedback-1', rating: 5, comment: 'Great!' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (FeatureFeedbackService.getFeatureFeedbacks as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/feature-feedbacks');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });
});
