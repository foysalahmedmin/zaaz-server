import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';

const validation = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        params: req.params,
        query: req.query,
        body: req.body,
        cookies: req.cookies,
        session: (req as any).session,
      });

      req.body = parsed.body;
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default validation;
