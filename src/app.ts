import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jobsRouter from './routes/jobs';
import rentalRequestsRouter from './routes/rentalRequests';
import pricingVariablesRouter from './routes/pricingVariables';
import { errorHandler } from './middlewares/errorHandler';
import dotenv from 'dotenv';
import logger from './utils/logger';
import { CustomError } from './utils/customError';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : []),
      process.env.FRONTEND_IP_URL || 'http://192.168.1.10:3000',
      'http://localhost:3000', // Add this line to allow localhost:3000
      'https://same-day-ramps-com.vercel.app/', // Existing line
      'https://app.samedayramps.com', // Added this line
    ].filter(Boolean);

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/jobs', jobsRouter);
app.use('/api/rental-requests', rentalRequestsRouter);
app.use('/api/pricing-variables', pricingVariablesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error Handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error:', err);

  if (err instanceof CustomError) {
    res.status(err.statusCode).json({ message: err.message });
  } else {
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
});

// Uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});

export default app;
