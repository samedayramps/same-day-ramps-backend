import express from 'express';
import * as jobController from '../controllers/jobController';
import {
  validateJobCreation,
  validateJobUpdate,
  validateScheduleInstallation,
  validateMarkAsInstalled,
  validateScheduleRemoval,
  validateMarkAsRemoved,
  validateCompleteJob,
  validateJobStage,
} from '../middlewares/validationMiddleware';
import { JobStage } from '../types/Job';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const router = express.Router();

type ControllerFunction = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const asyncHandler = (fn: ControllerFunction): express.RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error('Route error:', error);
      next(error);
    });
  };
};

router.get('/', asyncHandler(jobController.getAllJobs));
router.get('/:id', asyncHandler(jobController.getJobById));
router.post('/', validateJobCreation, asyncHandler(jobController.createJob));
router.put('/:id', validateJobUpdate, asyncHandler(jobController.updateJob));
router.delete('/:id', asyncHandler(jobController.deleteJob));
router.post('/:id/send-quote', asyncHandler(jobController.sendQuote));
router.put('/:id/stage', asyncHandler(jobController.updateJobStage));
router.post('/calculate-pricing', asyncHandler(jobController.calculatePricing));

router.post(
  '/:id/schedule-installation',
  validateScheduleInstallation,
  validateJobStage([JobStage.PAID]),
  asyncHandler(jobController.scheduleInstallation)
);

router.post(
  '/:id/mark-installed',
  validateMarkAsInstalled,
  validateJobStage([JobStage.SCHEDULED]),
  asyncHandler(jobController.markAsInstalled)
);

router.post(
  '/:id/schedule-removal',
  validateScheduleRemoval,
  validateJobStage([JobStage.INSTALLED]),
  asyncHandler(jobController.scheduleRemoval)
);

router.post(
  '/:id/mark-removed',
  validateMarkAsRemoved,
  validateJobStage([JobStage.REMOVAL_SCHEDULED]),
  asyncHandler(jobController.markAsRemoved)
);

router.post(
  '/:id/complete',
  validateCompleteJob,
  validateJobStage([JobStage.REMOVED]),
  asyncHandler(jobController.completeJob)
);

router.post(
  '/:id/create-payment-link',
  asyncHandler(jobController.createPaymentLink)
);

router.post(
  '/:id/create-agreement-link',
  asyncHandler(jobController.createAgreementLink)
);

export default router;