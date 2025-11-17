import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import AppError from '../builder/AppError';
import config from '../config';
import handleCastError from '../errors/handleCastError';
import handleDuplicateError from '../errors/handleDuplicateError';
import handleValidationError from '../errors/handleValidationError';
import handleZodError from '../errors/handleZodError';
import { TErrorSources } from '../types/error-response.type';

const error: ErrorRequestHandler = (error, _req, res, _next) => {
  let status = 500;
  let message = 'Something went wrong!';
  let sources: TErrorSources = [
    {
      path: '',
      message: 'Something went wrong',
    },
  ];

  if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    status = simplifiedError?.status;
    message = simplifiedError?.message;
    sources = simplifiedError?.sources;
  } else if (error?.name === 'ValidationError') {
    const simplifiedError = handleValidationError(error);
    status = simplifiedError?.status;
    message = simplifiedError?.message;
    sources = simplifiedError?.sources;
  } else if (error?.name === 'CastError') {
    const simplifiedError = handleCastError(error);
    status = simplifiedError?.status;
    message = simplifiedError?.message;
    sources = simplifiedError?.sources;
  } else if (error?.code === 11000) {
    const simplifiedError = handleDuplicateError(error);
    status = simplifiedError?.status;
    message = simplifiedError?.message;
    sources = simplifiedError?.sources;
  } else if (error instanceof AppError) {
    status = error?.status;
    message = error.message;
    sources = [
      {
        path: '',
        message: error?.message,
      },
    ];
  } else if (error instanceof Error) {
    message = error.message;
    sources = [
      {
        path: '',
        message: error?.message,
      },
    ];
  }

  res.status(status).json({
    success: false,
    status,
    message,
    sources,
    error,
    stack: config.node_dev === 'development' ? error?.stack : null,
  });
  return;
};

export default error;
