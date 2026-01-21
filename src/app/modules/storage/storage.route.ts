import express from 'express';
import auth from '../../middlewares/auth.middleware';
import storage from '../../middlewares/storage.middleware';
import { StorageController } from './storage.controller';

const router = express.Router();

const uploadConfig = {
  name: 'file',
  maxCount: 10,
  makePublic: true,
};

router.post(
  '/upload',
  auth('admin'),
  storage(uploadConfig),
  StorageController.uploadFiles,
);

export const StorageRoutes = router;
