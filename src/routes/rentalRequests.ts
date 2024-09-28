// src/routes/rentalRequests.ts

import express from 'express';
import * as rentalRequestController from '../controllers/rentalRequestController';
import {
  validateRentalRequestCreation,
  validateCreateJobFromRentalRequest,
  handleValidation,
} from '../middlewares/validationMiddleware';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();

type ControllerFunction = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const asyncHandler = (fn: ControllerFunction): express.RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

router.get('/', asyncHandler(rentalRequestController.getAllRentalRequests));
router.get('/:id', asyncHandler(rentalRequestController.getRentalRequestById));
router.post(
  '/',
  validateRentalRequestCreation,
  handleValidation,
  asyncHandler(rentalRequestController.createRentalRequest)
);
router.post('/:id/archive', asyncHandler(rentalRequestController.archiveRentalRequest));
router.delete('/:id', asyncHandler(rentalRequestController.deleteRentalRequest));

// New route for creating a job from a rental request
router.post(
  '/:id/create-job',
  validateCreateJobFromRentalRequest,
  handleValidation,
  asyncHandler(rentalRequestController.createJobFromRentalRequest)
);

export default router;