import { Session, SessionData } from 'express-session';
import { JwtPayload } from 'jsonwebtoken';
import { TJwtPayload } from '../types/jsonwebtoken.type';

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload & TJwtPayload;
      session: Session & Partial<SessionData>;
      files?: Record<string, Express.Multer.File[] | Express.Multer.File>;
      file?: Express.Multer.File;
    }
  }
}
