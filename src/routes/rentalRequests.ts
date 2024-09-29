// src/routes/rentalRequests.ts

import express from 'express';
import * as rentalRequestController from '../controllers/rentalRequestController';
import {
  validateRentalRequestCreation,
  validateCreateJobFromRentalRequest,
  handleValidation,
} from '../middlewares/validationMiddleware';
import { Request, Response, NextFunction } from 'express';
import { RentalRequest } from '../models/RentalRequest';

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

// New route for updating rental request status
router.put('/:id/status', asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'job created', 'rejected'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const rentalRequest = await RentalRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!rentalRequest) {
      res.status(404).json({ message: 'Rental request not found' });
      return;
    }

    res.json(rentalRequest);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}));

export default router;