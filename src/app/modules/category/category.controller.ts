import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as CategoryServices from './category.service';

export const insertCategoriesFromFile = catchAsync(async (req, res) => {
  const result = await CategoryServices.insertCategoriesFromFile(req.file);

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} categories uploaded successfully`,
    data: result,
  });
});

export const createCategory = catchAsync(async (req, res) => {
  const result = await CategoryServices.createCategory(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

export const getPublicCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryServices.getPublicCategory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Category retrieved successfully',
    data: result,
  });
});

export const getCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryServices.getCategory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Category retrieved successfully',
    data: result,
  });
});

export const getPublicCategories = catchAsync(async (req, res) => {
  const result = await CategoryServices.getPublicCategories(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Categories retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getCategories = catchAsync(async (req, res) => {
  const result = await CategoryServices.getCategories(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Categories retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getPublicCategoriesTree = catchAsync(async (req, res) => {
  const { category, ...query } = req.query;
  const result = await CategoryServices.getPublicCategoriesTree(
    category as string,
    query,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Categories retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getCategoriesTree = catchAsync(async (req, res) => {
  const { category, ...query } = req.query;
  const result = await CategoryServices.getCategoriesTree(
    category as string,
    query,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Categories retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryServices.updateCategory(id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});

export const updateCategories = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result = await CategoryServices.updateCategories(ids, payload);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Categories updated successfully',
    data: result,
  });
});

export const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  await CategoryServices.deleteCategory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Category soft deleted successfully',
    data: null,
  });
});

export const deleteCategoryPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await CategoryServices.deleteCategoryPermanent(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Category permanently deleted successfully',
    data: null,
  });
});

export const deleteCategories = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await CategoryServices.deleteCategories(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} categories soft deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const deleteCategoriesPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await CategoryServices.deleteCategoriesPermanent(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} categories permanently deleted successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});

export const restoreCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryServices.restoreCategory(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Category restored successfully',
    data: result,
  });
});

export const restoreCategories = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await CategoryServices.restoreCategories(ids);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} categories restored successfully`,
    data: {
      not_found_ids: result.not_found_ids,
    },
  });
});
