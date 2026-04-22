import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import responseFormatter from '../../utils/response-formatter';
import * as IntervalServices from './interval.service';

export const createInterval = catchAsync(async (req, res) => {
  const result = await IntervalServices.createInterval(req.body);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Interval created successfully',
    data: result,
  });
});

export const getInterval = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await IntervalServices.getInterval(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Interval retrieved successfully',
    data: result,
  });
});

export const getPublicIntervals = catchAsync(async (req, res) => {
  const result = await IntervalServices.getIntervals({
    ...req.query,
    is_active: true,
  });
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Intervals retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getIntervals = catchAsync(async (req, res) => {
  const result = await IntervalServices.getIntervals(req.query);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Intervals retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const updateInterval = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await IntervalServices.updateInterval(id, req.body);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Interval updated successfully',
    data: result,
  });
});

export const updateIntervals = catchAsync(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result = await IntervalServices.updateIntervals(ids, payload);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Intervals updated successfully',
    data: result,
  });
});

export const deleteInterval = catchAsync(async (req, res) => {
  const { id } = req.params;
  await IntervalServices.deleteInterval(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Interval soft deleted successfully',
    data: null,
  });
});

export const deleteIntervalPermanent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await IntervalServices.deleteIntervalPermanent(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Interval permanently deleted successfully',
    data: null,
  });
});

export const deleteIntervals = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await IntervalServices.deleteIntervals(ids);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} intervals soft deleted successfully`,
    data: { not_found_ids: result.not_found_ids },
  });
});

export const deleteIntervalsPermanent = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await IntervalServices.deleteIntervalsPermanent(ids);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} intervals permanently deleted successfully`,
    data: { not_found_ids: result.not_found_ids },
  });
});

export const restoreInterval = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await IntervalServices.restoreInterval(id);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Interval restored successfully',
    data: result,
  });
});

export const restoreIntervals = catchAsync(async (req, res) => {
  const { ids } = req.body;
  const result = await IntervalServices.restoreIntervals(ids);
  responseFormatter(res, {
    status: httpStatus.OK,
    success: true,
    message: `${result.count} intervals restored successfully`,
    data: { not_found_ids: result.not_found_ids },
  });
});
