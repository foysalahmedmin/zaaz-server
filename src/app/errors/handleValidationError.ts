import mongoose from 'mongoose';
import { TErrorResponse, TErrorSources } from '../types/error-response.type';

const handleValidationError = (
  err: mongoose.Error.ValidationError,
): TErrorResponse => {
  const sources: TErrorSources = Object.values(err.errors).map(
    (val: mongoose.Error.ValidatorError | mongoose.Error.CastError) => {
      return {
        path: val?.path,
        message: val?.message,
      };
    },
  );

  const status = 400;

  return {
    status,
    message: 'Validation Error',
    sources,
  };
};

export default handleValidationError;
