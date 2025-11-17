import mongoose from 'mongoose';
import { TErrorResponse, TErrorSources } from '../types/error-response.type';

const handleCastError = (err: mongoose.Error.CastError): TErrorResponse => {
  const sources: TErrorSources = [
    {
      path: err.path,
      message: err.message,
    },
  ];

  const status = 400;

  return {
    status,
    message: 'Invalid ID',
    sources,
  };
};

export default handleCastError;
