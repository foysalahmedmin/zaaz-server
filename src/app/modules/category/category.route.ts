import express from 'express';
import multer from 'multer';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as CategoryControllers from './category.controller';
import * as CategoryValidations from './category.validation';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post(
  '/upload-json',
  upload.single('file'),
  CategoryControllers.insertCategoriesFromFile,
);

// GET
router.get('/public', CategoryControllers.getPublicCategories);
router.get('/', auth('admin'), CategoryControllers.getCategories);

router.get('/tree/public', CategoryControllers.getPublicCategoriesTree);
router.get('/tree', auth('admin'), CategoryControllers.getCategoriesTree);

router.get('/:id/public', CategoryControllers.getPublicCategory);
router.get(
  '/:id',
  auth('admin'),
  validation(CategoryValidations.categoryOperationValidationSchema),
  CategoryControllers.getCategory,
);

// PATCH
router.patch(
  '/bulk',
  auth('admin'),
  validation(CategoryValidations.updateCategoriesValidationSchema),
  CategoryControllers.updateCategories,
);

router.patch(
  '/:id',
  auth('admin'),
  validation(CategoryValidations.updateCategoryValidationSchema),
  CategoryControllers.updateCategory,
);

// DELETE
router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(CategoryValidations.categoriesOperationValidationSchema),
  CategoryControllers.deleteCategoriesPermanent,
);

router.delete(
  '/bulk',
  auth('admin'),
  validation(CategoryValidations.categoriesOperationValidationSchema),
  CategoryControllers.deleteCategories,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(CategoryValidations.categoryOperationValidationSchema),
  CategoryControllers.deleteCategoryPermanent,
);

router.delete(
  '/:id',
  auth('admin'),
  validation(CategoryValidations.categoryOperationValidationSchema),
  CategoryControllers.deleteCategory,
);

// POST
router.post(
  '/',
  auth('admin'),
  validation(CategoryValidations.createCategoryValidationSchema),
  CategoryControllers.createCategory,
);

router.post(
  '/bulk/restore',
  auth('admin'),
  validation(CategoryValidations.categoriesOperationValidationSchema),
  CategoryControllers.restoreCategories,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(CategoryValidations.categoryOperationValidationSchema),
  CategoryControllers.restoreCategory,
);

const CategoryRoutes = router;

export default CategoryRoutes;
