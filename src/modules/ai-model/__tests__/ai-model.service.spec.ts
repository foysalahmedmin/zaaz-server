import * as AiModelRepository from '../ai-model.repository';
import * as AiModelService from '../ai-model.service';
import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../ai-model.repository');
jest.mock('../../../utils/cache.utils', () => ({
  withCache: jest.fn().mockImplementation((_key, _ttl, fetcher) => fetcher()),
  invalidateCacheByPattern: jest.fn()
}));
jest.mock('../../credits-process/credits-process.service', () => ({
  clearCreditsProcessCache: jest.fn()
}));

describe('AiModel Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAiModel', () => {
    it('should return a model if it exists', async () => {
      const mockResult = { _id: 'model-1', name: 'GPT-4' };
      (AiModelRepository.findById as jest.Mock).mockResolvedValue(mockResult);

      const result = await AiModelService.getAiModel('model-1');

      expect(result).toEqual(mockResult);
      expect(AiModelRepository.findById).toHaveBeenCalledWith('model-1');
    });

    it('should throw 404 if model not found', async () => {
      (AiModelRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(AiModelService.getAiModel('invalid-id'))
        .rejects.toThrow(new AppError(httpStatus.NOT_FOUND, 'AI Model not found'));
    });
  });

  describe('getAllAiModels', () => {
    it('should return paginated AI models', async () => {
      const mockResult = {
        data: [{ _id: 'model-1', name: 'GPT-4' }],
        meta: { total: 1, limit: 10, page: 1 }
      };
      (AiModelRepository.findPaginated as jest.Mock).mockResolvedValue(mockResult);

      const result = await AiModelService.getAllAiModels({});

      expect(result).toEqual(mockResult);
      expect(AiModelRepository.findPaginated).toHaveBeenCalledWith({});
    });
  });
});
