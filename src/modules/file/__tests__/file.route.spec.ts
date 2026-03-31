import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../file.service');
jest.mock('../../../middlewares/auth.middleware', () => {
  return jest.fn(() => (req: any, _res: any, next: any) => {
    req.user = {
      _id: 'user123',
      role: 'admin',
      name: 'Admin',
      email: 'admin@test.com',
    };
    next();
  });
});
jest.mock('../../../middlewares/file.middleware', () => {
  return jest.fn(() => (req: any, _res: any, next: any) => {
    req.files = { file: [{ path: 'uploads/test.jpg', filename: 'test.jpg' }] };
    next();
  });
});
jest.mock('../../../middlewares/storage.middleware', () => {
  return jest.fn(() => (req: any, _res: any, next: any) => {
    req.storages = [
      { filename: 'cloud.jpg', publicUrl: 'http://cloud.com/cloud.jpg' },
    ];
    next();
  });
});
jest.mock('../../../middlewares/validation.middleware', () => {
  return jest.fn(() => (_req: any, _res: any, next: any) => next());
});

import fileRoutes from '../file.route';
import * as FileService from '../file.service';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/file', fileRoutes);

  // Error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  });

  return app;
};

const app = buildApp();
const request = supertest(app);

describe('POST /api/file (Local Upload)', () => {
  it('should return 201 when local upload succeeds', async () => {
    (FileService.createLocalFile as jest.Mock).mockResolvedValue({
      _id: '1',
      filename: 'test.jpg',
    });

    const res = await request.post('/api/file');

    expect(res.status).toBe(httpStatus.CREATED);
    expect(res.body.message).toContain('local storage');
    expect(FileService.createLocalFile).toHaveBeenCalled();
  });
});

describe('POST /api/file/cloud (Cloud Upload)', () => {
  it('should return 201 when cloud upload succeeds', async () => {
    (FileService.createCloudFiles as jest.Mock).mockResolvedValue([
      { _id: '2', filename: 'cloud.jpg' },
    ]);

    const res = await request.post('/api/file/cloud');

    expect(res.status).toBe(httpStatus.CREATED);
    expect(res.body.message).toContain('cloud storage');
    expect(FileService.createCloudFiles).toHaveBeenCalled();
  });
});

describe('GET /api/file', () => {
  it('should return 200 with files list', async () => {
    (FileService.getFiles as jest.Mock).mockResolvedValue({
      data: [],
      meta: {},
    });

    const res = await request.get('/api/file');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
  });
});

describe('DELETE /api/file/:id', () => {
  it('should return 200 on soft delete', async () => {
    (FileService.deleteFile as jest.Mock).mockResolvedValue(undefined);

    const res = await request.delete('/api/file/507f1f77bcf86cd799439011');

    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.success).toBe(true);
  });
});
