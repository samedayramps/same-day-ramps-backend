// src/middlewares/validationMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { body, param, ValidationChain, validationResult } from 'express-validator';
import { JobStage } from '../types/Job';
import { Job } from '../models/Job';

export const validateJobCreation: ValidationChain[] = [
  body('customerInfo.firstName').notEmpty().withMessage('First name is required'),
  body('customerInfo.lastName').notEmpty().withMessage('Last name is required'),
  body('customerInfo.email').isEmail().withMessage('Invalid email'),
  body('customerInfo.phone').notEmpty().withMessage('Phone number is required'),
  body('rampConfiguration.rentalDuration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Rental duration must be a positive integer'),
  body('quote.upfrontFee').optional().isNumeric().withMessage('Upfront fee must be a number'),
];

export const validateJobUpdate: ValidationChain[] = [
  body('stage').optional().isIn(Object.values(JobStage)).withMessage('Invalid job stage'),
  body('quote.upfrontFee').optional().isNumeric().withMessage('Upfront fee must be a number'),
];

export const validateRentalRequestCreation: ValidationChain[] = [
  body('customerInfo.firstName').notEmpty().withMessage('First name is required'),
  body('customerInfo.lastName').notEmpty().withMessage('Last name is required'),
  body('customerInfo.email').isEmail().withMessage('Invalid email'),
  body('customerInfo.phone').notEmpty().withMessage('Phone number is required'),
  body('installAddress').notEmpty().withMessage('Install address is required'),
  body('rampDetails.installTimeframe').notEmpty().withMessage('Install timeframe is required'),
  // Add more validation rules as needed
];

export const validateCreateJobFromRentalRequest: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid rental request ID'),
];

export const validateScheduleInstallation: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid job ID'),
  body('quote.installationDate').isISO8601().withMessage('Invalid installation date format'),
  body('quote.installationStartTime').isString().notEmpty().withMessage('Installation start time is required'),
  body('quote.installationDuration').isInt({ min: 1 }).withMessage('Installation duration must be a positive integer'),
];

export const validateMarkAsInstalled: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid job ID'),
  body('installationNotes')
    .isString()
    .notEmpty()
    .withMessage('Installation notes are required'),
];

export const validateScheduleRemoval: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid job ID'),
  body('removalDate')
    .isISO8601()
    .withMessage('Invalid removal date format'),
  body('timeSlot')
    .isString()
    .notEmpty()
    .withMessage('Time slot is required'),
];

export const validateMarkAsRemoved: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid job ID'),
  body('removalNotes')
    .isString()
    .notEmpty()
    .withMessage('Removal notes are required'),
];

export const validateCompleteJob: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid job ID'),
];

export const handleValidation = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return; // Added return to stop execution
  }
  next();
};

export const validateJobStage = (allowedStages: JobStage[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await Job.findById(req.params.id);
      if (!job) {
        res.status(404).json({ message: 'Job not found' });
        return;
      }
      if (!allowedStages.includes(job.stage)) {
        res.status(400).json({ message: `Invalid job stage. Allowed stages: ${allowedStages.join(', ')}` });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};