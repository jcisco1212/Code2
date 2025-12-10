import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Assign request ID
  req.id = req.headers['x-request-id'] as string || uuidv4();
  req.startTime = Date.now();

  // Set request ID in response header
  res.setHeader('X-Request-ID', req.id);

  // Log request
  logger.info(`Incoming request`, {
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || 0);
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel](`Request completed`, {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
};

export default requestLogger;
