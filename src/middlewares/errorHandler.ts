import { ErrorRequestHandler } from 'express';
import logger from '../utils/logger';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error('Error caught by errorHandler:', err);
  
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({ 
    message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};