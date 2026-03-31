import httpStatus from 'http-status';

jest.mock('../file.repository');
jest.mock('../../../utils/delete-files', () => ({
  deleteFiles: jest.fn().mockResolvedValue(undefined),
}));

import * as FileRepository from '../file.repository';
import * as FileService from '../file.service';
import { TFile } from '../file.type';

const mockLocalFile = (): TFile => ({
  _id: '507f1f77bcf86cd799439011',
  name: 'test-image.jpg',
  originalname: 'test-image.jpg',
  filename: 'test-image-123.jpg',
  url: 'http://localhost:5000/uploads/files/test-image-123.jpg',
  mimetype: 'image/jpeg',
  size: 1024,
  author: '507f1f77bcf86cd799439022' as any,
  provider: 'local',
  status: 'active',
  is_deleted: false,
  metadata: {
    path: 'uploads/files/test-image-123.jpg',
    extension: 'jpg',
    file_type: 'image',
  },
});

const mockCloudFile = (): TFile => ({
  _id: '507f1f77bcf86cd799439033',
  name: 'cloud-image.png',
  originalname: 'cloud-image.png',
  filename: 'cloud-image-456.png',
  url: 'https://storage.googleapis.com/test-bucket/cloud-image-456.png',
  mimetype: 'image/png',
  size: 2048,
  author: '507f1f77bcf86cd799439022' as any,
  provider: 'gcs',
  status: 'active',
  is_deleted: false,
  metadata: {
    bucket: 'test-bucket',
    extension: 'png',
    file_type: 'image',
  },
});

describe('FileService.createLocalFile', () => {
  it('should create a local file record', async () => {
    const mockFileData = mockLocalFile();
    (FileRepository.create as jest.Mock).mockResolvedValue(mockFileData);

    const multerFile = {
      path: 'uploads\\files\\test-image-123.jpg',
      filename: 'test-image-123.jpg',
      originalname: 'test-image.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
    } as Express.Multer.File;

    const result = await FileService.createLocalFile(
      { _id: '507f1f77bcf86cd799439022' } as any,
      multerFile,
      { name: 'Custom Name' },
      'http://localhost:5000',
    );

    expect(FileRepository.create).toHaveBeenCalled();
    expect(result.provider).toBe('local');
    expect(result.metadata?.path).toBe('uploads/files/test-image-123.jpg');
  });
});

describe('FileService.createCloudFiles', () => {
  it('should create cloud file records', async () => {
    const mockFileData = mockCloudFile();
    (FileRepository.createMany as jest.Mock).mockResolvedValue([mockFileData]);

    const storageResults = [
      {
        filename: 'cloud-image-456.png',
        originalName: 'cloud-image.png',
        publicUrl:
          'https://storage.googleapis.com/test-bucket/cloud-image-456.png',
        mimetype: 'image/png',
        size: 2048,
        bucket: 'test-bucket',
      },
    ] as any;

    const result = await FileService.createCloudFiles(
      { _id: '507f1f77bcf86cd799439022' } as any,
      storageResults,
      {},
    );

    expect(FileRepository.createMany).toHaveBeenCalled();
    expect(result[0].provider).toBe('gcs');
    expect(result[0].metadata?.bucket).toBe('test-bucket');
  });
});

describe('FileService.getFile', () => {
  it('should return a file when found', async () => {
    const file = mockLocalFile();
    (FileRepository.findById as jest.Mock).mockResolvedValue(file);

    const result = await FileService.getFile('507f1f77bcf86cd799439011');
    expect(result).toEqual(file);
  });

  it('should throw 404 when file not found', async () => {
    (FileRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(FileService.getFile('non-existent')).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
    });
  });
});

// ─── deleteFilePermanent ─────────────────────────────────────────────────────

describe('FileService.deleteFilePermanent', () => {
  it('should delete local file from disk', async () => {
    const file = mockLocalFile();
    (FileRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(file);
    const { deleteFiles } = jest.requireMock('../../../utils/delete-files');

    await FileService.deleteFilePermanent('id');

    expect(deleteFiles).toHaveBeenCalledWith(file.metadata?.path);
    expect(FileRepository.hardDeleteById).toHaveBeenCalledWith('id');
  });
});
