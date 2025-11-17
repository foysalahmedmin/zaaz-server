import { RequestHandler } from 'express';

const notfound: RequestHandler = (_req, res, _next) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: 'API not found !!',
    sources: [],
    error: '',
    stack: '',
  });
  return;
};

export default notfound;
