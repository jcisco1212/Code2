import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import xss from 'xss';

// Run validations and handle errors
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      next();
      return;
    }

    res.status(422).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array().map(err => ({
          field: err.type === 'field' ? (err as any).path : 'unknown',
          message: err.msg
        }))
      }
    });
  };
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return xss(input, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });
};

// Sanitize all string fields in an object
export const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

// Middleware to sanitize request body
export const sanitizeBody = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

// Middleware to sanitize request query
export const sanitizeQuery = (req: Request, res: Response, next: NextFunction): void => {
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

// Middleware to sanitize request params
export const sanitizeParams = (req: Request, res: Response, next: NextFunction): void => {
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

// Combined sanitization middleware
export const sanitizeAll = (req: Request, res: Response, next: NextFunction): void => {
  sanitizeBody(req, res, () => {
    sanitizeQuery(req, res, () => {
      sanitizeParams(req, res, next);
    });
  });
};

export default {
  validate,
  sanitizeInput,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeAll
};
