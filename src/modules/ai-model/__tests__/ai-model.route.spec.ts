import request from 'supertest';
import app from '../../../app';
import * as AiModelService from '../ai-model.service';
import httpStatus from 'http-status';

jest.mock('../ai-model.service', () => ({
  getAllAiModels: jest.fn(),
}));

// Mocking the auth middleware
jest.mock('../../../middlewares/auth.middleware', () => {
  return () => (req: any, _res: any, next: any) => {
    req.user = { _id: 'test-user-id', role: 'admin' };
    next();
  };
});

describe('AiModel Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ai-models', () => {
    it('should return 200 and a list of AI models', async () => {
      const mockResult = {
        data: [{ _id: 'model-1', name: 'GPT-4' }],
        meta: { total: 1, page: 1, limit: 10 }
      };
      (AiModelService.getAllAiModels as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/ai-models');

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult.data);
      expect(AiModelService.getAllAiModels).toHaveBeenCalled();
    });
  });
});
