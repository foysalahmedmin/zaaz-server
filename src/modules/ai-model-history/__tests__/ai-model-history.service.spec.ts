import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../ai-model-history.repository', () => ({
  findPaginated: jest.fn(),
  findById: jest.fn(),
  findMany: jest.fn(),
  softDeleteById: jest.fn(),
  permanentDeleteById: jest.fn(),
  updateMany: jest.fn(),
  permanentDeleteMany: jest.fn(),
  findOneAndRestore: jest.fn(),
  restoreMany: jest.fn(),
  AiModelHistory: {},
}));

import * as AiModelHistoryRepository from '../ai-model-history.repository';
import * as AiModelHistoryService from '../ai-model-history.service';

describe('AiModelHistory Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAiModelHistory', () => {
    it('should return history if found', async () => {
      const mock = { _id: 'hist-1', ai_model: 'model-1' };
      (AiModelHistoryRepository.findById as jest.Mock).mockResolvedValue(mock);
      const result = await AiModelHistoryService.getAiModelHistory('hist-1');
      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found', async () => {
      (AiModelHistoryRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(AiModelHistoryService.getAiModelHistory('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'AI Model history not found'),
      );
    });
  });

  describe('deleteAiModelHistory', () => {
    it('should soft delete if found', async () => {
      (AiModelHistoryRepository.findMany as jest.Mock).mockResolvedValue([{ _id: 'hist-1' }]);
      (AiModelHistoryRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);
      await AiModelHistoryService.deleteAiModelHistory('hist-1');
      expect(AiModelHistoryRepository.softDeleteById).toHaveBeenCalledWith('hist-1');
    });

    it('should throw 404 if not found', async () => {
      (AiModelHistoryRepository.findMany as jest.Mock).mockResolvedValue([]);
      await expect(AiModelHistoryService.deleteAiModelHistory('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'AI Model history not found'),
      );
    });
  });

  describe('restoreAiModelHistory', () => {
    it('should restore if found', async () => {
      const mock = { _id: 'hist-1', is_deleted: false };
      (AiModelHistoryRepository.findOneAndRestore as jest.Mock).mockResolvedValue(mock);
      const result = await AiModelHistoryService.restoreAiModelHistory('hist-1');
      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found or not deleted', async () => {
      (AiModelHistoryRepository.findOneAndRestore as jest.Mock).mockResolvedValue(null);
      await expect(AiModelHistoryService.restoreAiModelHistory('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'AI Model history not found or not deleted'),
      );
    });
  });
});
