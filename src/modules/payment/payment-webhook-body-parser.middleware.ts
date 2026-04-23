import { NextFunction, Request, Response } from 'express';

export const parseWebhookBody = (req: Request, _res: Response, next: NextFunction): void => {
  if (!(req as any).rawBody) {
    if (Buffer.isBuffer(req.body)) {
      (req as any).rawBody = req.body;
    } else {
      (req as any).rawBody = Buffer.from(
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
      );
    }
  }

  try {
    const contentType = req.headers['content-type'] || '';

    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body) && req.body !== null) {
      if (!(req as any).rawBody || !Buffer.isBuffer((req as any).rawBody)) {
        (req as any).rawBody = Buffer.from(JSON.stringify(req.body));
      }
    } else {
      const bodyBuffer = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(String(req.body));
      const bodyString = bodyBuffer.toString('utf8');

      if (bodyString === '[object Object]') {
        (req as any).body = bodyBuffer;
      } else if (contentType.includes('application/json')) {
        try {
          (req as any).body = JSON.parse(bodyString);
        } catch {
          (req as any).body = bodyBuffer;
        }
      } else if (
        contentType.includes('application/x-www-form-urlencoded') ||
        contentType.includes('text/plain')
      ) {
        try {
          (req as any).body = Object.fromEntries(new URLSearchParams(bodyString));
        } catch {
          (req as any).body = bodyBuffer;
        }
      } else {
        // Unknown content-type — SSLCommerz sometimes omits it; try form-data parsing
        try {
          (req as any).body = Object.fromEntries(new URLSearchParams(bodyString));
        } catch {
          (req as any).body = bodyBuffer;
        }
      }
    }
  } catch {
    (req as any).body = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(String(req.body));
  }

  next();
};
