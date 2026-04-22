import request from 'supertest';
import app from '../../../app';
import * as AiModelHistoryService from '../ai-model-history.service';
import httpStatus from 'http-status';

jest.mock('../ai-model-history.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('AiModelHistory Route Integration Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/ai-model-histories/:aiModelId', () => {
    it('should return 200 and a list of histories', async () => {
      const mock = {
        data: [{ _id: 'hist-1', ai_model: '507f1f77bcf86cd799439011' }],
        meta: { total: 1, page: 1, limit: 10 },
      };
      (AiModelHistoryService.getAiModelHistories as jest.Mock).mockResolvedValue(mock);

      const res = await request(app).get('/api/ai-model-histories/ai-model/507f1f77bcf86cd799439011');
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mock.data);
    });
  });
});
