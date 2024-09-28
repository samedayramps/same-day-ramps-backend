import express from 'express';
import cors from 'cors';
import jobsRouter from './routes/jobs';
import rentalRequestsRouter from './routes/rentalRequests';
import pricingVariablesRouter from './routes/pricingVariables';
import { errorHandler } from './middlewares/errorHandler';
import dotenv from 'dotenv';
import logger from './utils/logger';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.FRONTEND_IP_URL || 'http://192.168.1.10:3000',
    'https://app.samedayramps.com',
    'https://www.samedayramps.com',
    'https://form.samedayramps.com'
  ].filter(Boolean),
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
app.use(errorHandler);

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
