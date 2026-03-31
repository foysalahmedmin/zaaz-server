import express from 'express';
import auth from '../../middlewares/auth.middleware';
import file from '../../middlewares/file.middleware';
import storage from '../../middlewares/storage.middleware';
import validation from '../../middlewares/validation.middleware';
import * as FileControllers from './file.controller';
import * as FileValidations from './file.validation';

const router = express.Router();

// ─── POST (Upload) ───────────────────────────────────────────────────────────

// Local Upload
router.post(
  '/',
  auth('super-admin', 'admin'),
  file({
    name: 'file',
    folder: 'files',
    size: 50 * 1024 * 1024, // 50MB
  }),
  validation(FileValidations.createFileValidationSchema),
  FileControllers.createLocalFile,
);

// Cloud Upload (GCS)
router.post(
  '/cloud',
  auth('super-admin', 'admin'),
  storage({
    name: 'file',
    size: 50 * 1024 * 1024, // 50MB
    makePublic: true,
  }),
  validation(FileValidations.createFileValidationSchema),
  FileControllers.createCloudFiles,
);

// ─── GET (List & Single) ─────────────────────────────────────────────────────

router.get(
  '/',
  auth('super-admin', 'admin'),
  FileControllers.getFiles,
);

router.get(
  '/self',
  auth('super-admin', 'admin'),
  FileControllers.getSelfFiles,
);

router.get(
  '/:id',
  auth('super-admin', 'admin'),
  validation(FileValidations.fileOperationValidationSchema),
  FileControllers.getFile,
);

// ─── PATCH (Update) ──────────────────────────────────────────────────────────

router.patch(
  '/bulk',
  auth('super-admin', 'admin'),
  validation(FileValidations.updateFilesValidationSchema),
  FileControllers.updateFiles,
);

router.patch(
  '/:id',
  auth('super-admin', 'admin'),
  validation(FileValidations.updateFileValidationSchema),
  FileControllers.updateFile,
);

// ─── DELETE ──────────────────────────────────────────────────────────────────

router.delete(
  '/bulk/permanent',
  auth('super-admin', 'admin'),
  validation(FileValidations.filesOperationValidationSchema),
  FileControllers.deleteFilesPermanent,
);

router.delete(
  '/bulk',
  auth('super-admin', 'admin'),
  validation(FileValidations.filesOperationValidationSchema),
  FileControllers.deleteFiles,
);

router.delete(
  '/:id/permanent',
  auth('super-admin', 'admin'),
  validation(FileValidations.fileOperationValidationSchema),
  FileControllers.deleteFilePermanent,
);

router.delete(
  '/:id',
  auth('super-admin', 'admin'),
  validation(FileValidations.fileOperationValidationSchema),
  FileControllers.deleteFile,
);

// ─── POST (Restore) ──────────────────────────────────────────────────────────

router.post(
  '/bulk/restore',
  auth('super-admin', 'admin'),
  validation(FileValidations.filesOperationValidationSchema),
  FileControllers.restoreFiles,
);

router.post(
  '/:id/restore',
  auth('super-admin', 'admin'),
  validation(FileValidations.fileOperationValidationSchema),
  FileControllers.restoreFile,
);

const fileRoutes = router;
export default fileRoutes;
