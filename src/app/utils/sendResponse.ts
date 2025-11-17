import { Response } from 'express';
import { TResponse } from '../types/response.type';

const sendResponse = <T>(res: Response, payload: TResponse<T>) => {
  const { status, success, message, data, meta } = payload;
  return res.status(status).json({
    success: success,
    status: status,
    message: message ?? (status === 200 || status === 201 ? 'Success' : ''),
    data: data,
    ...(meta && { meta }),
  });
};

export default sendResponse;
