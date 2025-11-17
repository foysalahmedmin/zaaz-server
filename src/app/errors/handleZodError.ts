import { ZodError, ZodIssue } from 'zod';
import { TErrorResponse, TErrorSources } from '../types/error-response.type';

const handleZodError = (err: ZodError): TErrorResponse => {
  const sources: TErrorSources = err.issues.map((issue: ZodIssue) => {
    return {
      path: issue?.path[issue.path.length - 1],
      message: issue.message,
    };
  });

  const status = 400;

  return {
    status,
    message: 'Validation Error',
    sources,
  };
};

export default handleZodError;
