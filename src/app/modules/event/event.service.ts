import httpStatus from 'http-status';
import AppError from '../../builder/AppError';
import AppQuery from '../../builder/AppQuery';
import { Event } from './event.model';
import { TEvent } from './event.type';

export const createEvent = async (data: TEvent): Promise<TEvent> => {
  const result = await Event.create(data);
  return result.toObject();
};

export const getPublicEvent = async (id: string): Promise<TEvent> => {
  const result = await Event.findOne({
    _id: id,
    status: 'active',
  }).populate([{ path: 'category', select: '_id name' }]);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found');
  }
  return result;
};

export const getEvent = async (id: string): Promise<TEvent> => {
  const result = await Event.findById(id).populate([
    { path: 'category', select: '_id name' },
  ]);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found');
  }
  return result;
};

export const getPublicEvents = async (
  query: Record<string, unknown>,
): Promise<{
  data: TEvent[];
  meta: { total: number; page: number; limit: number };
}> => {
  const { date: q_date, ...rest } = query || {};

  const date = q_date ? new Date(q_date as string) : new Date();

  const filter = {
    status: 'active',
    published_at: { $lte: date },
    $or: [{ expired_at: { $exists: false } }, { expired_at: { $gte: date } }],
  };

  const eventQuery = new AppQuery<TEvent>(
    Event.find().populate([
      { path: 'category', select: '_id name' },
    ]),
    { ...rest, ...filter },
  )
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await eventQuery.execute();

  return result;
};

export const getEvents = async (
  query: Record<string, unknown>,
): Promise<{
  data: TEvent[];
  meta: { total: number; page: number; limit: number };
}> => {
  const eventQuery = new AppQuery<TEvent>(
    Event.find().populate([{ path: 'category', select: '_id name' }]),
    query,
  )
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await eventQuery.execute([
    {
      key: 'active',
      filter: { status: 'active' },
    },
    {
      key: 'inactive',
      filter: { status: 'inactive' },
    },
    {
      key: 'featured',
      filter: { is_featured: true },
    },
  ]);

  return result;
};

export const updateEvent = async (
  id: string,
  payload: Partial<Pick<TEvent, 'name' | 'status'>>,
): Promise<TEvent> => {
  const data = await Event.findById(id).lean();

  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found');
  }

  const result = await Event.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result!;
};

export const updateEvents = async (
  ids: string[],
  payload: Partial<Pick<TEvent, 'status'>>,
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const events = await Event.find({ _id: { $in: ids } }).lean();
  const foundIds = events.map((event) => event._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  const result = await Event.updateMany(
    { _id: { $in: foundIds } },
    { ...payload },
  );

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};

export const deleteEvent = async (id: string): Promise<void> => {
  const event = await Event.findById(id);
  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found');
  }

  await event.softDelete();
};

export const deleteEventPermanent = async (id: string): Promise<void> => {
  const event = await Event.findById(id)
    .setOptions({ bypassDeleted: true })
    .lean();

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found');
  }

  await Event.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};

export const deleteEvents = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const events = await Event.find({ _id: { $in: ids } }).lean();
  const foundIds = events.map((event) => event._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await Event.updateMany({ _id: { $in: foundIds } }, { is_deleted: true });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const deleteEventsPermanent = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const events = await Event.find({
    _id: { $in: ids },
    is_deleted: true,
  })
    .setOptions({ bypassDeleted: true })
    .lean();

  const foundIds = events.map((event) => event._id.toString());
  const notFoundIds = ids.filter((id) => !foundIds.includes(id));

  await Event.deleteMany({
    _id: { $in: foundIds },
    is_deleted: true,
  }).setOptions({ bypassDeleted: true });

  return {
    count: foundIds.length,
    not_found_ids: notFoundIds,
  };
};

export const restoreEvent = async (id: string): Promise<TEvent> => {
  const event = await Event.findOneAndUpdate(
    { _id: id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found or not deleted');
  }

  return event;
};

export const restoreEvents = async (
  ids: string[],
): Promise<{
  count: number;
  not_found_ids: string[];
}> => {
  const result = await Event.updateMany(
    { _id: { $in: ids }, is_deleted: true },
    { is_deleted: false },
  );

  const restoredEvents = await Event.find({ _id: { $in: ids } }).lean();
  const restoredIds = restoredEvents.map((event) => event._id.toString());
  const notFoundIds = ids.filter((id) => !restoredIds.includes(id));

  return {
    count: result.modifiedCount,
    not_found_ids: notFoundIds,
  };
};
