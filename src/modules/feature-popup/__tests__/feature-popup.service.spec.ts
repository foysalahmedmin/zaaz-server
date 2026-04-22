import httpStatus from 'http-status';
import AppError from '../../../builder/app-error';

jest.mock('../feature-popup.repository', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findPaginated: jest.fn(),
  updateById: jest.fn(),
  findByIds: jest.fn(),
  softDeleteById: jest.fn(),
  permanentDeleteById: jest.fn(),
  softDeleteMany: jest.fn(),
  permanentDeleteMany: jest.fn(),
  restore: jest.fn(),
  restoreMany: jest.fn(),
}));
jest.mock('../../feature/feature.model', () => ({
  Feature: { findById: jest.fn().mockReturnValue({ lean: jest.fn() }) },
}));
jest.mock('../../feature/feature.service', () => ({
  clearFeatureCache: jest.fn(),
}));

import * as FeaturePopupRepository from '../feature-popup.repository';
import * as FeaturePopupService from '../feature-popup.service';
import { Feature } from '../../feature/feature.model';

describe('FeaturePopup Service Unit Tests', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getFeaturePopup', () => {
    it('should return popup if it exists', async () => {
      const mock = { _id: 'popup-1', name: 'Intro', value: 'intro' };
      (FeaturePopupRepository.findById as jest.Mock).mockResolvedValue(mock);

      const result = await FeaturePopupService.getFeaturePopup('popup-1');
      expect(result).toEqual(mock);
    });

    it('should throw 404 if not found', async () => {
      (FeaturePopupRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(FeaturePopupService.getFeaturePopup('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Feature popup not found'),
      );
    });
  });

  describe('createFeaturePopup', () => {
    it('should create popup when value is unique and feature exists', async () => {
      const payload = { name: 'Intro', value: 'intro', feature: 'feat-1', category: 'single-time', is_active: true } as any;
      const mock = { _id: 'popup-new', ...payload };
      (FeaturePopupRepository.findOne as jest.Mock).mockResolvedValue(null);
      (Feature.findById as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'feat-1' }) });
      (FeaturePopupRepository.create as jest.Mock).mockResolvedValue(mock);

      const result = await FeaturePopupService.createFeaturePopup(payload, { storages: [] } as any);
      expect(result).toEqual(mock);
    });

    it('should throw 404 if feature not found', async () => {
      const payload = { name: 'Intro', value: 'intro', feature: 'feat-1', category: 'single-time', is_active: true } as any;
      (FeaturePopupRepository.findOne as jest.Mock).mockResolvedValue(null);
      (Feature.findById as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await expect(FeaturePopupService.createFeaturePopup(payload, { storages: [] } as any)).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Feature not found'),
      );
    });
  });

  describe('deleteFeaturePopup', () => {
    it('should soft delete if exists', async () => {
      (FeaturePopupRepository.findById as jest.Mock).mockResolvedValue({ _id: 'popup-1' });
      (FeaturePopupRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);

      await FeaturePopupService.deleteFeaturePopup('popup-1');
      expect(FeaturePopupRepository.softDeleteById).toHaveBeenCalledWith('popup-1');
    });

    it('should throw 404 if not found', async () => {
      (FeaturePopupRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(FeaturePopupService.deleteFeaturePopup('bad')).rejects.toThrow(
        new AppError(httpStatus.NOT_FOUND, 'Feature popup not found'),
      );
    });
  });
});
