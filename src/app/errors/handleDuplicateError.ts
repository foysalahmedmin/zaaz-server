import { MongoServerError } from 'mongodb';
import { TErrorResponse, TErrorSources } from '../types/error-response.type';

const handleDuplicateError = (err: MongoServerError): TErrorResponse => {
  const sources: TErrorSources = Object.entries(err.keyValue ?? {}).map(
    ([key, value]) => ({
      path: key,
      message: `${value} already exists`,
    }),
  );

  return {
    status: 400,
    message: 'Duplicate key error',
    sources,
  };
};

export default handleDuplicateError;
